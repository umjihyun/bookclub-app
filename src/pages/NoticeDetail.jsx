import { useNavigate, useParams } from 'react-router-dom'
import { getNoticeById, getMemberById } from '../storage'
import Nav from '../components/Nav'

export default function NoticeDetail() {
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const notice = getNoticeById(noticeId)

  if (!notice) return <div className="p-6 text-gray-400">공지를 찾을 수 없어요</div>

  const author = getMemberById(notice.authorId)

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate('/notices')} className="text-gray-400 text-sm mb-4">← 공지</button>
        <h1 className="text-xl font-bold text-gray-900 leading-snug">{notice.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-500">{author?.name || '관리자'}</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-400">{new Date(notice.createdAt).toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
