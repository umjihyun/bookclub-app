import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getVoteRoundsByClub, ensureActiveVoteRound, createVoteCandidate } from '../storage'

export default function ProposeBook() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [form, setForm] = useState({ title: '', author: '', reason: '', imageUrl: '', link: '', roundId: '' })

  const rounds = getVoteRoundsByClub(user.clubId).filter(r => r.status === 'active')
  if (rounds.length === 0) {
    ensureActiveVoteRound(user.clubId)
  }
  const activeRounds = getVoteRoundsByClub(user.clubId).filter(r => r.status === 'active')
  const defaultRound = activeRounds[activeRounds.length - 1]

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim()) return
    const targetRound = form.roundId ? activeRounds.find(r => r.id === form.roundId) : defaultRound
    if (!targetRound) return
    createVoteCandidate({
      roundId: targetRound.id,
      clubId: user.clubId,
      title: form.title.trim(),
      author: form.author.trim(),
      reason: form.reason.trim(),
      imageUrl: form.imageUrl.trim(),
      link: form.link.trim(),
      proposerId: user.memberId,
    })
    navigate('/vote')
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate('/vote')} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-6">책 제안하기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { key: 'title', label: '제목', placeholder: '예: 82년생 김지영', required: true },
          { key: 'author', label: '저자', placeholder: '예: 조남주', required: true },
          { key: 'reason', label: '읽고 싶은 이유', placeholder: '간단하게 소개해주세요', required: false, textarea: true },
          { key: 'imageUrl', label: '표지 이미지 URL', placeholder: 'https://...', required: false },
          { key: 'link', label: '책 링크', placeholder: 'https://...', required: false },
        ].map(({ key, label, placeholder, required, textarea }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {textarea ? (
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
                placeholder={placeholder}
                rows={3}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            ) : (
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required={required}
              />
            )}
          </div>
        ))}

        {activeRounds.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제안할 회차</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
              value={form.roundId}
              onChange={e => setForm(f => ({ ...f, roundId: e.target.value }))}
            >
              {activeRounds.map(r => (
                <option key={r.id} value={r.id}>{r.round}회차</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={!form.title.trim() || !form.author.trim()}
          className="w-full py-4 bg-purple-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
        >
          제안 올리기
        </button>
      </form>
    </div>
  )
}
