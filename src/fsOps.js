import { db } from './firebase'
import {
  doc, setDoc, deleteDoc, updateDoc, writeBatch, collection, getDocs, query, where
} from 'firebase/firestore'

function fw(promise) {
  promise.catch(e => console.warn('[Firestore write]', e.message))
}

// ── Users ──────────────────────────────────────────
export function fsWriteUser(user) {
  fw(setDoc(doc(db, 'users', user.id), user))
}

// ── Clubs ──────────────────────────────────────────
export function fsWriteClub(club) {
  fw(setDoc(doc(db, 'clubs', club.id), club))
  fw(setDoc(doc(db, 'clubs_by_code', club.code), club))
}

export function fsUpdateClub(clubId, updates) {
  fw(updateDoc(doc(db, 'clubs', clubId), updates))
}

// ── Memberships ────────────────────────────────────
export function fsWriteMembership(m) {
  fw(setDoc(doc(db, 'memberships', `${m.userId}_${m.clubId}`), m))
}

// ── Members ────────────────────────────────────────
export function fsWriteMember(member) {
  fw(setDoc(doc(db, 'clubs', member.clubId, 'members', member.id), member))
}

export function fsUpdateMember(clubId, memberId, updates) {
  fw(updateDoc(doc(db, 'clubs', clubId, 'members', memberId), updates))
}

// ── Books ──────────────────────────────────────────
export function fsWriteBook(book) {
  fw(setDoc(doc(db, 'clubs', book.clubId, 'books', book.id), book))
}

export function fsUpdateBook(clubId, bookId, updates) {
  fw(updateDoc(doc(db, 'clubs', clubId, 'books', bookId), updates))
}

export async function fsDeleteBook(clubId, bookId) {
  try {
    const batch = writeBatch(db)
    batch.delete(doc(db, 'clubs', clubId, 'books', bookId))
    const mbSnap = await getDocs(collection(db, 'clubs', clubId, 'memberBooks'))
    mbSnap.docs.filter(d => d.data().bookId === bookId).forEach(d => batch.delete(d.ref))
    await batch.commit()
  } catch (e) {
    console.warn('[Firestore deleteBook]', e.message)
  }
}

// ── MemberBooks ────────────────────────────────────
export function fsWriteMemberBook(clubId, mb) {
  fw(setDoc(doc(db, 'clubs', clubId, 'memberBooks', `${mb.memberId}_${mb.bookId}`), mb))
}

// ── Meetings ───────────────────────────────────────
export function fsWriteMeeting(meeting) {
  fw(setDoc(doc(db, 'clubs', meeting.clubId, 'meetings', meeting.id), meeting))
}

export function fsUpdateMeeting(clubId, meetingId, updates) {
  fw(updateDoc(doc(db, 'clubs', clubId, 'meetings', meetingId), updates))
}

// ── Meeting Responses ──────────────────────────────
export function fsWriteMeetingResponse(clubId, r) {
  fw(setDoc(doc(db, 'clubs', clubId, 'meetingResponses', `${r.memberId}_${r.meetingId}`), r))
}

// ── Notices ────────────────────────────────────────
export function fsWriteNotice(notice) {
  fw(setDoc(doc(db, 'clubs', notice.clubId, 'notices', notice.id), notice))
}

export async function fsDeleteNotice(clubId, noticeId) {
  try {
    const batch = writeBatch(db)
    batch.delete(doc(db, 'clubs', clubId, 'notices', noticeId))
    const commentsSnap = await getDocs(collection(db, 'clubs', clubId, 'comments'))
    commentsSnap.docs
      .filter(d => d.data().postId === noticeId)
      .forEach(d => batch.delete(d.ref))
    await batch.commit()
  } catch (e) {
    console.warn('[Firestore deleteNotice]', e.message)
  }
}

// ── Comments ───────────────────────────────────────
export function fsWriteComment(clubId, comment) {
  fw(setDoc(doc(db, 'clubs', clubId, 'comments', comment.id), comment))
}

export async function fsDeleteComments(clubId, ids) {
  try {
    const batch = writeBatch(db)
    ids.forEach(id => batch.delete(doc(db, 'clubs', clubId, 'comments', id)))
    await batch.commit()
  } catch (e) {
    console.warn('[Firestore deleteComments]', e.message)
  }
}

// ── Vote Rounds ────────────────────────────────────
export function fsWriteVoteRound(round) {
  fw(setDoc(doc(db, 'clubs', round.clubId, 'voteRounds', round.id), round))
}

export function fsUpdateVoteRound(clubId, roundId, updates) {
  fw(updateDoc(doc(db, 'clubs', clubId, 'voteRounds', roundId), updates))
}

// ── Vote Candidates ────────────────────────────────
export function fsWriteVoteCandidate(cand) {
  fw(setDoc(doc(db, 'clubs', cand.clubId, 'voteCandidates', cand.id), cand))
}

export async function fsDeleteVoteCandidate(clubId, candidateId) {
  try {
    const batch = writeBatch(db)
    batch.delete(doc(db, 'clubs', clubId, 'voteCandidates', candidateId))
    const heartsSnap = await getDocs(collection(db, 'clubs', clubId, 'voteHearts'))
    heartsSnap.docs
      .filter(d => d.data().candidateId === candidateId)
      .forEach(d => batch.delete(d.ref))
    await batch.commit()
  } catch (e) {
    console.warn('[Firestore deleteVoteCandidate]', e.message)
  }
}

export function fsUpdateVoteCandidate(clubId, candidateId, updates) {
  fw(updateDoc(doc(db, 'clubs', clubId, 'voteCandidates', candidateId), updates))
}

// ── Vote Hearts ────────────────────────────────────
export function fsToggleHeart(clubId, memberId, candidateId, add) {
  const ref = doc(db, 'clubs', clubId, 'voteHearts', `${memberId}_${candidateId}`)
  fw(add ? setDoc(ref, { memberId, candidateId, clubId }) : deleteDoc(ref))
}

// ── Delete Entire Club ─────────────────────────────
export async function fsDeleteClub(clubId, code) {
  const subs = ['members', 'books', 'memberBooks', 'meetings', 'meetingResponses',
    'notices', 'comments', 'voteRounds', 'voteCandidates', 'voteHearts']
  try {
    const refs = []
    for (const sub of subs) {
      const snap = await getDocs(collection(db, 'clubs', clubId, sub))
      snap.docs.forEach(d => refs.push(d.ref))
    }
    // memberships
    const msSnap = await getDocs(query(collection(db, 'memberships'), where('clubId', '==', clubId)))
    msSnap.docs.forEach(d => refs.push(d.ref))
    refs.push(doc(db, 'clubs', clubId))
    if (code) refs.push(doc(db, 'clubs_by_code', code))

    const CHUNK = 499
    for (let i = 0; i < refs.length; i += CHUNK) {
      const batch = writeBatch(db)
      refs.slice(i, i + CHUNK).forEach(r => batch.delete(r))
      await batch.commit()
    }
  } catch (e) {
    console.warn('[Firestore deleteClub]', e.message)
  }
}
