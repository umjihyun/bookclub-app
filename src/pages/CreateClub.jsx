import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, createClub, createMember, addMembership, setCurrentClub } from '../storage'
import CodeModal from '../components/CodeModal'
import ImageUpload from '../components/ImageUpload'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function CreateClub() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [form, setForm] = useState({ clubName: '', maxMembers: '', imageUrl: '' })
  const [createdCode, setCreatedCode] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.clubName.trim() || !form.maxMembers) return

    const club = createClub({ name: form.clubName.trim(), maxMembers: form.maxMembers, imageUrl: form.imageUrl })
    const member = createMember({ name: user.name, clubId: club.id, role: 'admin' })
    addMembership({ userId: user.userId, clubId: club.id, memberId: member.id, role: 'admin' })
    setCurrentClub({ clubId: club.id, memberId: member.id, role: 'admin' })

    // Firestore에 코드 저장 (다른 기기에서 코드로 참여 가능)
    setDoc(doc(db, 'clubs_by_code', club.code), {
      id: club.id, name: club.name, code: club.code,
      maxMembers: club.maxMembers, imageUrl: club.imageUrl || '', createdAt: club.createdAt,
    }).catch(console.error)

    setCreatedCode(club.code)
  }

  if (createdCode) {
    return <CodeModal code={createdCode} onClose={() => navigate('/home', { replace: true })} />
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate('/clubs')} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-6">북클럽 만들기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">대표 이미지</label>
          <ImageUpload
            value={form.imageUrl}
            onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
            label="대표 이미지 업로드"
            aspect="landscape"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">북클럽 이름 <span className="text-red-400">*</span></label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 화요책방"
            value={form.clubName}
            onChange={e => setForm(f => ({ ...f, clubName: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">최대 멤버 수 <span className="text-red-400">*</span></label>
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
        <p className="text-xs text-gray-400">관리자: {user?.name}</p>
        <button
          type="submit"
          disabled={!form.clubName.trim() || !form.maxMembers}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
        >
          만들기
        </button>
      </form>
    </div>
  )
}
