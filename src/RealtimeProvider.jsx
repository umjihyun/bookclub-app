import { createContext, useContext, useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { getCurrentUser } from './storage'

const Ctx = createContext(0)
export const useSync = () => useContext(Ctx)

function getLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

// 서브컬렉션 설정: name, localStorage key, clubId 필드 or 복합 키
const SUBS = [
  { name: 'members',          ls: 'bc_members',           cf: 'clubId' },
  { name: 'books',            ls: 'bc_books',             cf: 'clubId' },
  { name: 'meetings',         ls: 'bc_meetings',          cf: 'clubId' },
  { name: 'notices',          ls: 'bc_notices',           cf: 'clubId' },
  { name: 'voteRounds',       ls: 'bc_vote_rounds',       cf: 'clubId' },
  { name: 'voteCandidates',   ls: 'bc_vote_candidates',   cf: 'clubId' },
  { name: 'comments',         ls: 'bc_comments',          cf: null, ck: d => d.id },
  { name: 'memberBooks',      ls: 'bc_member_books',      cf: null, ck: d => `${d.memberId}_${d.bookId}` },
  { name: 'meetingResponses', ls: 'bc_meeting_responses', cf: null, ck: d => `${d.memberId}_${d.meetingId}` },
  { name: 'voteHearts',       ls: 'bc_vote_hearts',       cf: null, ck: d => `${d.memberId}_${d.candidateId}` },
]

function applySnap(sub, docs, clubId) {
  const existing = getLS(sub.ls)
  let next
  if (sub.cf) {
    // clubId 필드가 있는 경우 — 해당 클럽 데이터를 통째로 교체 (삭제도 반영)
    next = [...existing.filter(d => d[sub.cf] !== clubId), ...docs]
  } else {
    // 복합 키 — 있는 것만 업데이트/추가 (삭제는 비실시간)
    const fsKeys = new Set(docs.map(d => sub.ck(d)).filter(Boolean))
    next = [...existing.filter(d => !fsKeys.has(sub.ck(d))), ...docs]
  }
  localStorage.setItem(sub.ls, JSON.stringify(next))
}

export function RealtimeProvider({ children }) {
  const [tick, setTick] = useState(0)
  const user = getCurrentUser()
  const clubId = user?.clubId

  useEffect(() => {
    if (!clubId) return
    const bump = () => setTick(t => t + 1)
    const unsubs = []

    // 서브컬렉션 리스너
    for (const sub of SUBS) {
      unsubs.push(
        onSnapshot(
          collection(db, 'clubs', clubId, sub.name),
          snap => {
            const docs = snap.docs.map(d => d.data())
            // Firestore가 비어있으면 로컬 데이터를 지우지 않음 (아직 업로드 중일 수 있음)
            if (docs.length === 0 && sub.cf) return
            applySnap(sub, docs, clubId)
            bump()
          },
          err => console.warn('[RT]', sub.name, err.message)
        )
      )
    }

    // 클럽 문서 자체 (이름, 이미지 변경 등)
    unsubs.push(
      onSnapshot(
        doc(db, 'clubs', clubId),
        snap => {
          if (!snap.exists()) return
          const clubs = getLS('bc_clubs')
          localStorage.setItem('bc_clubs', JSON.stringify([
            ...clubs.filter(c => c.id !== clubId),
            snap.data()
          ]))
          bump()
        },
        err => console.warn('[RT club]', err.message)
      )
    )

    return () => unsubs.forEach(u => u())
  }, [clubId])

  return <Ctx.Provider value={tick}>{children}</Ctx.Provider>
}
