import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClub, createMember, createUser, setCurrentUser } from '../storage'
import CodeModal from '../components/CodeModal'

export default function CreateClub() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ clubName: '', maxMembers: '', myName: '', pin: '' })
  const [createdCode, setCreatedCode] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.clubName.trim() || !form.myName.trim() || !form.maxMembers || form.pin.length !== 4) return

    const club = createClub({ name: form.clubName.trim(), maxMembers: form.maxMembers })
    const member = createMember({ name: form.myName.trim(), clubId: club.id, role: 'admin' })
    createUser({ nickname: form.myName.trim(), pin: form.pin, clubId: club.id, memberId: member.id, role: 'admin' })
    setCurrentUser({ name: member.name, clubId: club.id, memberId: member.id, role: 'admin' })
    setCreatedCode(club.code)
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
          <label className="block text-sm font-medium text-gray-700 mb-1">내 닉네임</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 김독서"
            value={form.myName}
            onChange={e => setForm(f => ({ ...f, myName: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (숫자 4자리)</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="••••"
            value={form.pin}
            onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
          />
          <p className="text-xs text-gray-400 mt-1">다음에 로그인할 때 사용해요</p>
        </div>
        <button
          type="submit"
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
          disabled={!form.clubName.trim() || !form.myName.trim() || !form.maxMembers || form.pin.length !== 4}
        >
          만들기
        </button>
      </form>
    </div>
  )
}
