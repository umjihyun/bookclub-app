import { db } from './firebase'
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'

// localStorage save helpers (mirrors storage.js internals)
function saveKey(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
}
function getKey(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}

const KEYS = {
  clubs: 'bc_clubs', members: 'bc_members', books: 'bc_books',
  memberBooks: 'bc_member_books', meetings: 'bc_meetings',
  meetingResponses: 'bc_meeting_responses', notices: 'bc_notices',
  comments: 'bc_comments', voteRounds: 'bc_vote_rounds',
  voteCandidates: 'bc_vote_candidates', voteHearts: 'bc_vote_hearts',
  users: 'bc_users', memberships: 'bc_memberships',
}

// Merge Firestore docs into localStorage list, replacing any doc with same id
function mergeInto(key, newDocs) {
  const existing = getKey(key)
  const newIds = new Set(newDocs.map(d => d.id))
  const kept = existing.filter(d => !newIds.has(d.id))
  saveKey(key, [...kept, ...newDocs])
}

// Remove docs belonging to a club from a key
function removeClubDocs(key, clubId, clubIdField = 'clubId') {
  saveKey(key, getKey(key).filter(d => d[clubIdField] !== clubId))
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
    // Replace all memberships for this user
    const other = getKey(KEYS.memberships).filter(m => m.userId !== userId)
    saveKey(KEYS.memberships, [...other, ...ms])
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

    // Subcollections
    const subs = [
      ['members',          KEYS.members,          null],
      ['books',            KEYS.books,             null],
      ['memberBooks',      KEYS.memberBooks,       null],
      ['meetings',         KEYS.meetings,          null],
      ['meetingResponses', KEYS.meetingResponses,  null],
      ['notices',          KEYS.notices,           null],
      ['comments',         KEYS.comments,          null],
      ['voteRounds',       KEYS.voteRounds,        null],
      ['voteCandidates',   KEYS.voteCandidates,    null],
      ['voteHearts',       KEYS.voteHearts,        null],
    ]

    const snaps = await Promise.all(
      subs.map(([sub]) => getDocs(collection(db, 'clubs', clubId, sub)))
    )

    subs.forEach(([, key], i) => {
      const docs = snaps[i].docs.map(d => d.data())
      // Clear this club's old docs from localStorage, then add fresh from Firestore
      const idField = (key === KEYS.memberBooks || key === KEYS.meetingResponses || key === KEYS.voteHearts)
        ? null : 'clubId'

      if (idField) {
        removeClubDocs(key, clubId, idField)
        const other = getKey(key).filter(d => d[idField] !== clubId) // already filtered above, re-check
        saveKey(key, [...getKey(key).filter(d => d[idField] !== clubId), ...docs])
      } else {
        // For items without clubId (memberBooks, meetingResponses, voteHearts),
        // we can't easily filter by club, so just merge by id
        mergeInto(key, docs)
      }
    })

    return true
  } catch (e) {
    console.warn('[sync club]', e.message)
    return false
  }
}
