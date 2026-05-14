import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getNoticesByClub, getMemberById } from '../storage'
import Nav from '../components/Nav'

export default function NoticeList() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const notices = getNoticesByClub(user.clubId)

  return (
    <div className="pb-24">
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">공지</h1>
        {user.role === 'admin' && (
          <button
            onClick={() => navigate('/notices/create')}
            className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-light"
          >
            +
          </button>
        )}
      </div>

      {notices.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📢</div>
          <p className="text-sm">공지가 없어요</p>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-2">
          {notices.map(notice => {
            const author = getMemberById(notice.authorId)
            return (
              <div
                key={notice.id}
                onClick={() => navigate(`/notices/${notice.id}`)}
                className="border border-gray-100 rounded-2xl p-4 cursor-pointer"
              >
                <h3 className="font-semibold text-gray-900 leading-snug">{notice.title}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notice.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">{author?.name || '관리자'}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{new Date(notice.createdAt).toLocaleDateString('ko')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Nav />
    </div>
  )
}
