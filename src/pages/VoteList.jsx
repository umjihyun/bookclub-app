import { useSync } from '../RealtimeProvider'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUser, getVoteRoundsByClub, getVoteCandidatesByRound,
  getHeartsByCandidate, hasHeart, toggleHeart, updateVoteRound,
  createVoteRound, moveCandidatesToRound, ensureActiveVoteRound
} from '../storage'
import Nav from '../components/Nav'

function CandidateCard({ cand, user, onHeartToggle, onClick }) {
  const hearts = getHeartsByCandidate(cand.id)
  const liked = hasHeart(cand.id, user.memberId)

  return (
    <div className="border border-gray-100 rounded-2xl p-3 flex gap-3 items-start">
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(cand.id)}>
        {cand.imageUrl ? (
          <img src={cand.imageUrl} alt={cand.title} className="w-12 h-16 object-cover rounded-lg shadow mb-2" />
        ) : (
          <div className="w-12 h-16 bg-gradient-to-b from-purple-200 to-purple-400 rounded-lg flex items-center justify-center text-xl mb-2">📕</div>
        )}
        <p className="font-semibold text-gray-900 text-sm leading-snug">{cand.title}</p>
        <p className="text-xs text-gray-500">{cand.author}</p>
      </div>
      <button
        onClick={() => onHeartToggle(cand.id)}
        className={`flex flex-col items-center gap-0.5 pt-1 shrink-0 ${liked ? 'text-red-500' : 'text-gray-300'}`}
      >
        <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
        <span className="text-xs font-medium">{hearts.length}</span>
      </button>
    </div>
  )
}

export default function VoteList() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  useSync()
  const [, forceUpdate] = useState(0)

  let rounds = getVoteRoundsByClub(user.clubId)
  if (rounds.length === 0) {
    ensureActiveVoteRound(user.clubId)
    rounds = getVoteRoundsByClub(user.clubId)
  }

  function handleHeart(candidateId) {
    toggleHeart({ candidateId, memberId: user.memberId, clubId: user.clubId })
    forceUpdate(n => n + 1)
  }

  function confirmBook(roundId, candidateId) {
    if (!confirm('이 책으로 확정하시겠어요?')) return
    const allRounds = getVoteRoundsByClub(user.clubId)
    const currentRound = allRounds.find(r => r.id === roundId)
    if (!currentRound) return
    updateVoteRound(roundId, { status: 'confirmed', confirmedBookId: candidateId })
    const allCands = getVoteCandidatesByRound(roundId)
    const remaining = allCands.filter(c => c.id !== candidateId).map(c => c.id)
    if (remaining.length > 0) {
      const nextRound = createVoteRound({ clubId: user.clubId, round: currentRound.round + 1 })
      moveCandidatesToRound(remaining, nextRound.id)
    } else {
      createVoteRound({ clubId: user.clubId, round: currentRound.round + 1 })
    }
    forceUpdate(n => n + 1)
  }

  const freshRounds = getVoteRoundsByClub(user.clubId)
  const activeRound = freshRounds.find(r => r.status === 'active')
  const pastRounds = freshRounds.filter(r => r.status === 'confirmed').sort((a, b) => b.round - a.round)

  return (
    <div className="pb-24">
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">투표</h1>
        <button onClick={() => navigate('/vote/propose')} className="text-sm text-blue-600 font-medium">
          + 책 제안
        </button>
      </div>

      <div className="px-5 flex flex-col gap-6">
        {/* 현재 진행중인 투표 */}
        {activeRound && (() => {
          const cands = getVoteCandidatesByRound(activeRound.id)
          return (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-gray-800">현재 진행중인 투표</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">진행중</span>
              </div>
              {cands.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-4 text-center text-gray-400 text-sm">
                  아직 후보가 없어요. 책을 제안해보세요!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {cands.sort((a, b) => getHeartsByCandidate(b.id).length - getHeartsByCandidate(a.id).length).map(cand => (
                    <CandidateCard
                      key={cand.id}
                      cand={cand}
                      user={user}
                      onHeartToggle={handleHeart}
                      onClick={id => navigate(`/vote/${id}`)}
                    />
                  ))}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        const top = [...cands].sort((a, b) => getHeartsByCandidate(b.id).length - getHeartsByCandidate(a.id).length)[0]
                        if (top) confirmBook(activeRound.id, top.id)
                      }}
                      className="w-full py-3 bg-purple-600 text-white rounded-2xl text-sm font-semibold mt-1"
                    >
                      최다 득표 책으로 확정
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })()}

        {/* 지난 투표 당선작 */}
        {pastRounds.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-400 mb-3">지난 투표 당선작</h2>
            <div className="flex flex-col gap-2">
              {pastRounds.map(round => {
                const cands = getVoteCandidatesByRound(round.id)
                const winner = cands.find(c => c.id === round.confirmedBookId)
                if (!winner) return null
                return (
                  <div key={round.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-2xl">
                    {winner.imageUrl ? (
                      <img src={winner.imageUrl} alt="" className="w-8 h-11 object-cover rounded-md shrink-0" />
                    ) : (
                      <div className="w-8 h-11 bg-gray-200 rounded-md flex items-center justify-center text-sm shrink-0">📕</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 truncate">{winner.title}</p>
                      <p className="text-xs text-gray-400">{winner.author}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{round.round}회차</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <Nav />
    </div>
  )
}
