import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getNoticesByClub, getMemberById } from '../storage'
import Nav from '../components/Nav'

export default function NoticeList() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const all = getNoticesByClub(user.clubId)

  const pinned = all.filter(n => n.isNotice)
  const posts = all.filter(n => !n.isNotice)

  return (
    <div className="pb-24">
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">게시판</h1>
        <button
          onClick={() => navigate('/notices/create')}
          className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-light"
        >
          +
        </button>
      </div>

      {all.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-sm">아직 게시글이 없어요</p>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-2">
          {/* 공지 섹션 */}
          {pinned.length > 0 && (
            <>
              {pinned.map(notice => (
                <PostCard key={notice.id} notice={notice} onClick={() => navigate(`/notices/${notice.id}`)} />
              ))}
              {posts.length > 0 && <div className="h-px bg-gray-100 my-1" />}
            </>
          )}
          {/* 일반 게시글 */}
          {posts.map(notice => (
            <PostCard key={notice.id} notice={notice} onClick={() => navigate(`/notices/${notice.id}`)} />
          ))}
        </div>
      )}

      <Nav />
    </div>
  )
}

function PostCard({ notice, onClick }) {
  const author = getMemberById(notice.authorId)
  return (
    <div
      onClick={onClick}
      className="border border-gray-100 rounded-2xl p-4 cursor-pointer active:bg-gray-50"
    >
      <div className="flex items-start gap-2">
        {notice.isNotice && (
          <span className="shrink-0 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-medium mt-0.5">공지</span>
        )}
        <h3 className="font-semibold text-gray-900 leading-snug flex-1">{notice.title}</h3>
      </div>
      {notice.content && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notice.content}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-400">{author?.name || '멤버'}</span>
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-400">{new Date(notice.createdAt).toLocaleDateString('ko')}</span>
      </div>
    </div>
  )
}
