import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getClubById, getMembersByClub, getBooksByClub, updateClub, updateMemberRole } from '../storage'
import ImageUpload from '../components/ImageUpload'

const ROLES = ['member', 'admin', 'superadmin']
const ROLE_LABEL = { member: '멤버', admin: '관리자', superadmin: '슈퍼관리자' }
const ROLE_STYLE = {
  member: 'bg-gray-100 text-gray-500',
  admin: 'bg-blue-100 text-blue-600',
  superadmin: 'bg-purple-100 text-purple-700',
}

export default function EditClub() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const club = getClubById(user.clubId)
  const books = getBooksByClub(user.clubId)
  const doneBooks = books.filter(b => b.status === 'done').length

  const [name, setName] = useState(club?.name || '')
  const [imageUrl, setImageUrl] = useState(club?.imageUrl || '')
  const [saved, setSaved] = useState(false)
  const [members, setMembers] = useState(() => getMembersByClub(user.clubId))

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    navigate('/club', { replace: true })
    return null
  }

  function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    updateClub(user.clubId, { name: name.trim(), imageUrl: imageUrl.trim() })
    setSaved(true)
    setTimeout(() => { setSaved(false); navigate('/club') }, 800)
  }

  function cycleRole(m) {
    // 슈퍼관리자만 슈퍼관리자 지정 가능, 자기 자신은 변경 불가
    if (m.id === user.memberId) return
    const canAssignSuper = user.role === 'superadmin'
    const available = canAssignSuper ? ROLES : ROLES.filter(r => r !== 'superadmin')
    const currentIdx = available.indexOf(m.role) ?? 0
    const nextRole = available[(currentIdx + 1) % available.length]
    updateMemberRole(m.id, user.clubId, nextRole)
    setMembers(prev => prev.map(p => p.id === m.id ? { ...p, role: nextRole } : p))
  }

  return (
    <div className="min-h-screen px-6 py-10 pb-16">
      <button onClick={() => navigate('/club')} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-6">클럽 수정</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-4 mb-10">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">대표 이미지</label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} label="대표 이미지 업로드" aspect="landscape" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">북클럽 이름</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className={`w-full py-4 rounded-2xl text-base font-semibold disabled:opacity-40 transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}
        >
          {saved ? '저장됨 ✓' : '저장하기'}
        </button>
      </form>

      {/* 멤버 목록 + 역할 관리 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">멤버 {members.length}명 · 읽은 책 {doneBooks}권</h2>
        <p className="text-xs text-gray-400 mb-3">역할 뱃지를 탭하면 변경돼요 (자신 제외)</p>
        <div className="flex flex-col gap-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                {m.name[0]}
              </div>
              <span className="font-medium text-gray-800 flex-1">{m.name}</span>
              {m.id === user.memberId && <span className="text-xs text-gray-400">나</span>}
              <button
                onClick={() => cycleRole(m)}
                disabled={m.id === user.memberId}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[m.role] || ROLE_STYLE.member} ${m.id !== user.memberId ? 'active:opacity-70' : 'cursor-default'}`}
              >
                {ROLE_LABEL[m.role] || '멤버'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
