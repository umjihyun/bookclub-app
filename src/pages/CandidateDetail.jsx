import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getCurrentUser, getVoteCandidateById, getHeartsByCandidate,
  hasHeart, toggleHeart, deleteVoteCandidate, getMemberById
} from '../storage'
import Nav from '../components/Nav'

export default function CandidateDetail() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [cand, setCand] = useState(() => getVoteCandidateById(candidateId))
  const [, forceUpdate] = useState(0)

  if (!cand) return <div className="p-6 text-gray-400">후보를 찾을 수 없어요</div>

  const proposer = getMemberById(cand.proposerId)
  const hearts = getHeartsByCandidate(cand.id)
  const liked = hasHeart(cand.id, user.memberId)
  const canDelete = user.role === 'admin' || cand.proposerId === user.memberId

  function handleHeart() {
    toggleHeart({ candidateId: cand.id, memberId: user.memberId })
    forceUpdate(n => n + 1)
  }

  function handleDelete() {
    if (!confirm('이 후보를 삭제하시겠어요?')) return
    deleteVoteCandidate(cand.id)
    navigate('/vote')
  }

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate('/vote')} className="text-gray-400 text-sm mb-4">← 투표</button>
      </div>

      <div className="px-5">
        <div className="flex gap-4 mb-6">
          {cand.imageUrl ? (
            <img src={cand.imageUrl} alt={cand.title} className="w-24 rounded-xl shadow object-cover aspect-[2/3]" />
          ) : (
            <div className="w-24 aspect-[2/3] bg-gradient-to-b from-purple-200 to-purple-400 rounded-xl flex items-center justify-center text-4xl">📕</div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{cand.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{cand.author}</p>
            <p className="text-xs text-gray-400 mt-1">제안: {proposer?.name || '알 수 없음'}</p>
          </div>
        </div>

        {cand.reason && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-medium text-gray-400 mb-1">읽고 싶은 이유</p>
            <p className="text-sm text-gray-700 leading-relaxed">{cand.reason}</p>
          </div>
        )}

        {cand.link && (
          <a
            href={cand.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-gray-200 rounded-xl px-4 py-3 text-sm text-blue-600 mb-4 truncate"
          >
            🔗 {cand.link}
          </a>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleHeart}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${liked ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
          >
            {liked ? '❤️' : '🤍'} 좋아요 {hearts.length}
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-3 rounded-2xl text-sm font-semibold bg-red-50 text-red-500 border border-red-200"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      <Nav />
    </div>
  )
}
