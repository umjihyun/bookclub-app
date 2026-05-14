import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClubByCode, getMembersByClub, createMember, setCurrentUser } from '../storage'

export default function JoinClub() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ code: '', name: '' })
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const club = getClubByCode(form.code.trim())
    if (!club) {
      setError('유효하지 않은 코드예요.')
      return
    }
    const members = getMembersByClub(club.id)
    if (members.length >= club.maxMembers) {
      setError('멤버가 꽉 찼어요.')
      return
    }
    const duplicate = members.find(m => m.name === form.name.trim())
    if (duplicate) {
      setError('이미 같은 이름의 멤버가 있어요.')
      return
    }
    const member = createMember({ name: form.name.trim(), clubId: club.id, role: 'member' })
    setCurrentUser({ name: member.name, clubId: club.id, memberId: member.id, role: 'member' })
    navigate('/home', { replace: true })
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate(-1)} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-8">코드로 들어가기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">초대 코드</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 uppercase"
            placeholder="예: BC-4F2K"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내 이름</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 이책벌레"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!form.code.trim() || !form.name.trim()}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
        >
          입장하기
        </button>
      </form>
    </div>
  )
}
