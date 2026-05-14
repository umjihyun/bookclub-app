import { db } from './firebase'
import { doc, getDoc, getDocs, setDoc, collection, query, where, writeBatch } from 'firebase/firestore'

function getKey(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function saveKey(key, list) { localStorage.setItem(key, JSON.stringify(list)) }

const KEYS = {
  clubs: 'bc_clubs', members: 'bc_members', books: 'bc_books',
  memberBooks: 'bc_member_books', meetings: 'bc_meetings',
  meetingResponses: 'bc_meeting_responses', notices: 'bc_notices',
  comments: 'bc_comments', voteRounds: 'bc_vote_rounds',
  voteCandidates: 'bc_vote_candidates', voteHearts: 'bc_vote_hearts',
  users: 'bc_users', memberships: 'bc_memberships',
}

function mergeInto(key, newDocs) {
  if (!newDocs.length) return
  const existing = getKey(key)
  const newIds = new Set(newDocs.map(d => d.id))
  saveKey(key, [...existing.filter(d => !newIds.has(d.id)), ...newDocs])
}

// Batch write helper — splits into chunks of 499 (Firestore limit is 500)
async function batchWrite(writes) {
  const CHUNK = 499
  for (let i = 0; i < writes.length; i += CHUNK) {
    const batch = writeBatch(db)
    writes.slice(i, i + CHUNK).forEach(([ref, data]) => batch.set(ref, data))
    await batch.commit()
  }
}

// ─── One-time migration: push all local localStorage data to Firestore ─────
export async function migrateLocalToFirestore(clubId) {
  const flagKey = `bc_migrated_${clubId}`
  if (localStorage.getItem(flagKey)) return  // already done

  try {
    const writes = []

    // Club doc
    const club = getKey(KEYS.clubs).find(c => c.id === clubId)
    if (club) {
      writes.push([doc(db, 'clubs', clubId), club])
      writes.push([doc(db, 'clubs_by_code', club.code), club])
    }

    // Members
    getKey(KEYS.members).filter(m => m.clubId === clubId)
      .forEach(m => writes.push([doc(db, 'clubs', clubId, 'members', m.id), m]))

    // Books
    const books = getKey(KEYS.books).filter(b => b.clubId === clubId)
    books.forEach(b => writes.push([doc(db, 'clubs', clubId, 'books', b.id), b]))
    const bookIds = new Set(books.map(b => b.id))

    // MemberBooks (linked to this club's books)
    getKey(KEYS.memberBooks).filter(mb => bookIds.has(mb.bookId))
      .forEach(mb => writes.push([doc(db, 'clubs', clubId, 'memberBooks', `${mb.memberId}_${mb.bookId}`), mb]))

    // Meetings
    const meetings = getKey(KEYS.meetings).filter(m => m.clubId === clubId)
    meetings.forEach(m => writes.push([doc(db, 'clubs', clubId, 'meetings', m.id), m]))
    const meetingIds = new Set(meetings.map(m => m.id))

    // Meeting responses (linked to this club's meetings)
    getKey(KEYS.meetingResponses).filter(r => meetingIds.has(r.meetingId))
      .forEach(r => writes.push([doc(db, 'clubs', clubId, 'meetingResponses', `${r.memberId}_${r.meetingId}`), r]))

    // Notices
    const notices = getKey(KEYS.notices).filter(n => n.clubId === clubId)
    notices.forEach(n => writes.push([doc(db, 'clubs', clubId, 'notices', n.id), n]))
    const noticeIds = new Set(notices.map(n => n.id))

    // Comments (linked to this club's notices)
    getKey(KEYS.comments).filter(c => noticeIds.has(c.postId))
      .forEach(c => writes.push([doc(db, 'clubs', clubId, 'comments', c.id), c]))

    // Vote rounds
    const rounds = getKey(KEYS.voteRounds).filter(r => r.clubId === clubId)
    rounds.forEach(r => writes.push([doc(db, 'clubs', clubId, 'voteRounds', r.id), r]))

    // Vote candidates
    const cands = getKey(KEYS.voteCandidates).filter(c => c.clubId === clubId)
    cands.forEach(c => writes.push([doc(db, 'clubs', clubId, 'voteCandidates', c.id), c]))
    const candIds = new Set(cands.map(c => c.id))

    // Vote hearts (linked to this club's candidates)
    getKey(KEYS.voteHearts).filter(h => candIds.has(h.candidateId))
      .forEach(h => writes.push([doc(db, 'clubs', clubId, 'voteHearts', `${h.memberId}_${h.candidateId}`), h]))

    // Users
    getKey(KEYS.users)
      .forEach(u => writes.push([doc(db, 'users', u.id), u]))

    // Memberships
    getKey(KEYS.memberships).filter(m => m.clubId === clubId)
      .forEach(m => writes.push([doc(db, 'memberships', `${m.userId}_${m.clubId}`), m]))

    if (writes.length > 0) {
      await batchWrite(writes)
      console.log(`[migration] Uploaded ${writes.length} docs for club ${clubId}`)
    }

    localStorage.setItem(flagKey, '1')
  } catch (e) {
    console.error('[migration failed]', e)
  }
}

// ─── Cross-device Login ────────────────────────────────────────────────────
export async function syncUserFromFirestore(nickname, pin) {
  try {
    const q = query(collection(db, 'users'), where('nickname', '==', nickname), where('pin', '==', pin))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const user = snap.docs[0].data()
    mergeInto(KEYS.users, [user])
    return user
  } catch (e) {
    console.warn('[sync user]', e.message)
    return null
  }
}

// ─── Memberships ───────────────────────────────────────────────────────────
export async function syncMembershipsFromFirestore(userId) {
  try {
    const q = query(collection(db, 'memberships'), where('userId', '==', userId))
    const snap = await getDocs(q)
    const ms = snap.docs.map(d => d.data())
    if (ms.length > 0) {
      const other = getKey(KEYS.memberships).filter(m => m.userId !== userId)
      saveKey(KEYS.memberships, [...other, ...ms])
    }
    return ms
  } catch (e) {
    console.warn('[sync memberships]', e.message)
    return []
  }
}

// ─── Full Club Sync ────────────────────────────────────────────────────────
export async function syncClubFromFirestore(clubId) {
  try {
    // Club doc
    const clubSnap = await getDoc(doc(db, 'clubs', clubId))
    if (clubSnap.exists()) mergeInto(KEYS.clubs, [clubSnap.data()])

    const subs = [
      ['members',          KEYS.members,          'clubId'],
      ['books',            KEYS.books,             'clubId'],
      ['memberBooks',      KEYS.memberBooks,       null],
      ['meetings',         KEYS.meetings,          'clubId'],
      ['meetingResponses', KEYS.meetingResponses,  null],
      ['notices',          KEYS.notices,           'clubId'],
      ['comments',         KEYS.comments,          null],
      ['voteRounds',       KEYS.voteRounds,        'clubId'],
      ['voteCandidates',   KEYS.voteCandidates,    'clubId'],
      ['voteHearts',       KEYS.voteHearts,        null],
    ]

    const snaps = await Promise.all(
      subs.map(([sub]) => getDocs(collection(db, 'clubs', clubId, sub)))
    )

    subs.forEach(([, key, clubIdField], i) => {
      const docs = snaps[i].docs.map(d => d.data())
      // Only overwrite if Firestore actually has data
      if (docs.length === 0) return
      if (clubIdField) {
        // Replace only this club's docs
        const other = getKey(key).filter(d => d[clubIdField] !== clubId)
        saveKey(key, [...other, ...docs])
      } else {
        mergeInto(key, docs)
      }
    })

    return true
  } catch (e) {
    console.warn('[sync club]', e.message)
    return false
  }
}
