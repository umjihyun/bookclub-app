import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClub, createMember, setCurrentUser } from '../storage'
import CodeModal from '../components/CodeModal'

export default function CreateClub() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ clubName: '', maxMembers: '', myName: '' })
  const [createdCode, setCreatedCode] = useState(null)
  const [createdClub, setCreatedClub] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.clubName.trim() || !form.myName.trim() || !form.maxMembers) return

    const club = createClub({ name: form.clubName.trim(), maxMembers: form.maxMembers })
    const member = createMember({ name: form.myName.trim(), clubId: club.id, role: 'admin' })
    setCurrentUser({ name: member.name, clubId: club.id, memberId: member.id, role: 'admin' })
    setCreatedCode(club.code)
    setCreatedClub(club)
  }

  if (createdCode) {
    return <CodeModal code={createdCode} onClose={() => navigate('/home', { replace: true })} />
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate(-1)} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-8">북클럽 만들기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">북클럽 이름</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 화요책방"
            value={form.clubName}
            onChange={e => setForm(f => ({ ...f, clubName: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">최대 멤버 수</label>
          <input
            type="number"
            min={1}
            max={50}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 8"
            value={form.maxMembers}
            onChange={e => setForm(f => ({ ...f, maxMembers: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내 이름</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 김독서"
            value={form.myName}
            onChange={e => setForm(f => ({ ...f, myName: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
          disabled={!form.clubName.trim() || !form.myName.trim() || !form.maxMembers}
        >
          만들기
        </button>
      </form>
    </div>
  )
}
