import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getVoteRoundsByClub, ensureActiveVoteRound, createVoteCandidate } from '../storage'
import ImageUpload from '../components/ImageUpload'

export default function ProposeBook() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [form, setForm] = useState({ title: '', author: '', reason: '', imageUrl: '', link: '', roundId: '' })
  const [, refresh] = useState(0)

  // 라운드 초기화는 mount 시 1번만 (렌더마다 실행 금지)
  useEffect(() => {
    const active = getVoteRoundsByClub(user.clubId).filter(r => r.status === 'active')
    if (active.length === 0) {
      ensureActiveVoteRound(user.clubId)
      refresh(n => n + 1)
    }
  }, [user.clubId])

  const activeRounds = getVoteRoundsByClub(user.clubId).filter(r => r.status === 'active')
  // round 번호가 가장 높은 활성 라운드를 기본으로
  const defaultRound = activeRounds.sort((a, b) => b.round - a.round)[0]

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-400">*</span></label>
          <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" placeholder="예: 82년생 김지영" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">저자 <span className="text-red-400">*</span></label>
          <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" placeholder="예: 조남주" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">표지 이미지</label>
          <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} label="표지 이미지 업로드" aspect="portrait" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">읽고 싶은 이유</label>
          <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none" placeholder="간단하게 소개해주세요" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">책 링크</label>
          <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" placeholder="https://..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
        </div>

        {/* 활성 라운드가 2개 이상일 때만 선택 표시 */}
        {activeRounds.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제안할 회차</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none bg-white" value={form.roundId} onChange={e => setForm(f => ({ ...f, roundId: e.target.value }))}>
              {activeRounds.map(r => <option key={r.id} value={r.id}>{r.round}회차</option>)}
            </select>
          </div>
        )}

        <button type="submit" disabled={!form.title.trim() || !form.author.trim()} className="w-full py-4 bg-purple-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40">
          제안 올리기
        </button>
      </form>
    </div>
  )
}
