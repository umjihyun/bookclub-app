import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getCurrentUser, getNoticeById, getMemberById, deleteNotice,
  getCommentsByPost, createComment, deleteComment
} from '../storage'
import Nav from '../components/Nav'

function relTime(ts) {
  const d = Date.now() - ts
  if (d < 60000) return '방금'
  if (d < 3600000) return `${Math.floor(d / 60000)}분 전`
  if (d < 86400000) return `${Math.floor(d / 3600000)}시간 전`
  return new Date(ts).toLocaleDateString('ko', { month: 'short', day: 'numeric' })
}

function Avatar({ name, size = 'md' }) {
  const cls = size === 'sm'
    ? 'w-7 h-7 text-xs'
    : 'w-8 h-8 text-sm'
  return (
    <div className={`${cls} rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0`}>
      {name?.[0] || '?'}
    </div>
  )
}

export default function NoticeDetail() {
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const notice = getNoticeById(noticeId)

  const [comments, setComments] = useState(() => getCommentsByPost(noticeId))
  const [input, setInput] = useState('')
  const [replyTo, setReplyTo] = useState(null) // { id, authorName, isReply }
  const inputRef = useRef()

  useEffect(() => {
    if (replyTo) inputRef.current?.focus()
  }, [replyTo])

  if (!notice) return <div className="p-6 text-gray-400">게시글을 찾을 수 없어요</div>

  const author = getMemberById(notice.authorId)
  const canDeletePost = user.role === 'admin' || user.memberId === notice.authorId

  const topLevel = comments.filter(c => !c.parentId)
  const repliesFor = (parentId) => comments.filter(c => c.parentId === parentId)

  function refreshComments() {
    setComments(getCommentsByPost(noticeId))
  }

  function handleDeletePost() {
    if (!confirm('이 게시글을 삭제하시겠어요?')) return
    deleteNotice(noticeId)
    navigate('/notices', { replace: true })
  }

  function handleSubmit() {
    if (!input.trim()) return
    const parentId = replyTo ? (replyTo.isReply ? replyTo.parentId : replyTo.id) : null
    createComment({ postId: noticeId, parentId, authorId: user.memberId, content: input.trim() })
    setInput('')
    setReplyTo(null)
    refreshComments()
  }

  function handleDeleteComment(id) {
    if (!confirm('댓글을 삭제하시겠어요?')) return
    deleteComment(id)
    refreshComments()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function CommentItem({ comment, isReply = false }) {
    const commentAuthor = getMemberById(comment.authorId)
    const canDel = user.role === 'admin' || user.memberId === comment.authorId
    const replies = repliesFor(comment.id)

    return (
      <div className={isReply ? 'ml-9 mt-2' : ''}>
        {isReply && (
          <div className="absolute -left-4 top-2 bottom-0 w-px bg-gray-200" />
        )}
        <div className="flex gap-2.5 relative">
          <Avatar name={commentAuthor?.name} size={isReply ? 'sm' : 'md'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-900">{commentAuthor?.name || '멤버'}</span>
              <span className="text-xs text-gray-400">{relTime(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 mt-0.5 leading-snug whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={() => setReplyTo(
                  replyTo?.id === comment.id
                    ? null
                    : { id: comment.id, authorName: commentAuthor?.name, isReply, parentId: isReply ? comment.parentId : comment.id }
                )}
                className="text-xs text-gray-400 font-medium"
              >
                {replyTo?.id === comment.id ? '취소' : '답글'}
              </button>
              {canDel && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-red-400"
                >
                  삭제
                </button>
              )}
            </div>

            {/* 이 댓글에 대한 인라인 답글 입력 */}
            {replyTo?.id === comment.id && (
              <div className="mt-2 flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`${replyTo.authorName}에게 답글...`}
                  className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                >
                  등록
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 대댓글 */}
        {!isReply && replies.length > 0 && (
          <div className="ml-9 mt-2 flex flex-col gap-3 relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 -translate-x-4" />
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pb-36">
      {/* 헤더 */}
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate('/notices')} className="text-gray-400 text-sm mb-4">← 게시판</button>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          {canDeletePost && (
            <button
              onClick={handleDeletePost}
              className="shrink-0 text-xs text-red-400 border border-red-200 rounded-lg px-3 py-1.5"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="px-5">
        <div className="h-px bg-gray-100 mb-4" />
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
      </div>

      {/* 댓글 섹션 */}
      <div className="px-5 mt-6">
        <div className="h-px bg-gray-100 mb-4" />
        <p className="text-sm font-semibold text-gray-700 mb-4">
          댓글 {comments.length}개
        </p>
        {topLevel.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">첫 댓글을 남겨보세요</p>
        ) : (
          <div className="flex flex-col gap-4">
            {topLevel.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>

      <Nav />

      {/* 댓글 입력 (Nav 위 고정) — replyTo 없을 때만 표시 */}
      {!replyTo && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 pb-safe z-40"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)' }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="댓글 입력..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              등록
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
