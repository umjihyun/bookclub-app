import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser, getNoticeById, getMemberById, deleteNotice } from '../storage'
import Nav from '../components/Nav'

export default function NoticeDetail() {
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const notice = getNoticeById(noticeId)

  if (!notice) return <div className="p-6 text-gray-400">게시글을 찾을 수 없어요</div>

  const author = getMemberById(notice.authorId)
  const canDelete = user.role === 'admin' || user.memberId === notice.authorId

  function handleDelete() {
    if (!confirm('이 게시글을 삭제하시겠어요?')) return
    deleteNotice(noticeId)
    navigate('/notices', { replace: true })
  }

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate('/notices')} className="text-gray-400 text-sm mb-4">← 게시판</button>

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {notice.isNotice && (
                <span className="shrink-0 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-medium">공지</span>
              )}
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{notice.title}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm text-gray-500">{author?.name || '멤버'}</span>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-400">
                {new Date(notice.createdAt).toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="shrink-0 text-xs text-red-400 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      <div className="px-5">
        <div className="h-px bg-gray-100 mb-4" />
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
      </div>

      <Nav />
    </div>
  )
}
