import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getClubByCode, getMembersByClub, createMember, addMembership, setCurrentClub, saveClubLocally } from '../storage'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function JoinClub() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedCode = code.trim().toUpperCase()

    // 1. 로컬에서 먼저 찾기
    let club = getClubByCode(trimmedCode)

    // 2. 없으면 Firestore에서 찾기
    if (!club) {
      try {
        const snap = await getDoc(doc(db, 'clubs_by_code', trimmedCode))
        if (snap.exists()) club = saveClubLocally(snap.data())
      } catch (err) {
        console.error(err)
      }
    }

    if (!club) {
      setError('유효하지 않은 코드예요.')
      setLoading(false)
      return
    }

    const members = getMembersByClub(club.id)
    if (members.length >= club.maxMembers) {
      setError('멤버가 꽉 찼어요.')
      setLoading(false)
      return
    }
    if (members.find(m => m.name === user.name)) {
      setError('이미 이 북클럽에 참여해 있어요.')
      setLoading(false)
      return
    }

    const member = createMember({ name: user.name, clubId: club.id, role: 'member' })
    addMembership({ userId: user.userId, clubId: club.id, memberId: member.id, role: 'member' })
    setCurrentClub({ clubId: club.id, memberId: member.id, role: 'member' })
    navigate('/home', { replace: true })
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate('/clubs')} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-2">코드로 들어가기</h1>
      <p className="text-sm text-gray-400 mb-8">{user?.name}으로 참여해요</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">초대 코드</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 uppercase tracking-widest"
            placeholder="예: AB3K9P"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!code.trim() || loading}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
        >
          {loading ? '확인 중…' : '입장하기'}
        </button>
      </form>
    </div>
  )
}
