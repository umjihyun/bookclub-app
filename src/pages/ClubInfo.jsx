import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getClubById, getMembersByClub, getBooksByClub } from '../storage'
import Nav from '../components/Nav'

export default function ClubInfo() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const club = getClubById(user.clubId)
  const members = getMembersByClub(user.clubId)
  const books = getBooksByClub(user.clubId)
  const doneBooks = books.filter(b => b.status === 'done').length

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-2 flex items-center justify-between">
        <button onClick={() => navigate('/home')} className="text-gray-400 text-sm">← 홈</button>
        {user.role === 'admin' && (
          <button
            onClick={() => navigate('/club/edit')}
            className="text-sm text-blue-600 font-medium"
          >
            수정하기
          </button>
        )}
      </div>

      {/* 대표 이미지 */}
      <div className="px-5 mt-2 mb-4">
        <div className="w-full rounded-2xl overflow-hidden">
          {club?.imageUrl ? (
            <img src={club.imageUrl} alt="" className="w-full h-auto block" />
          ) : (
            <div className="w-full h-44 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
              <span className="text-7xl font-bold text-white/40">{club?.name?.[0] || '📚'}</span>
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold mt-3 text-gray-900">{club?.name}</h1>
        <p className="text-sm text-gray-400 mt-1">멤버 {members.length}명 · 읽은 책 {doneBooks}권</p>
      </div>

      {/* 멤버 목록 */}
      <div className="px-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">멤버 {members.length}명</h2>
        <div className="flex flex-col gap-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                {m.name[0]}
              </div>
              <span className="font-medium text-gray-800 flex-1">{m.name}</span>
              {m.id === user.memberId && (
                <span className="text-xs text-gray-400 mr-1">나</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                {m.role === 'admin' ? '관리자' : '멤버'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Nav />
    </div>
  )
}
