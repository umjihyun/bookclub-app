import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSync } from '../RealtimeProvider'
import {
  getCurrentUser, getNoticeById, getMemberById, deleteNotice,
  getCommentsByPost, createComment, deleteComment
} from '../storage'

function relTime(ts) {
  const d = Date.now() - ts
  if (d < 60000) return '방금'
  if (d < 3600000) return `${Math.floor(d / 60000)}분 전`
  if (d < 86400000) return `${Math.floor(d / 3600000)}시간 전`
  return new Date(ts).toLocaleDateString('ko', { month: 'short', day: 'numeric' })
}

function Avatar({ name, size = 'md' }) {
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
  return (
    <div className={`${cls} rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0`}>
      {name?.[0] || '?'}
    </div>
  )
}

// ★ 최상위 컴포넌트로 분리 — 부모 state 변화로 인한 remount 방지
function CommentItem({ comment, replies, isReply, user, replyToId, onReplyTo, onDelete, onSubmitReply }) {
  const [replyText, setReplyText] = useState('')
  const inputRef = useRef()
  const isReplying = replyToId === comment.id
  const author = getMemberById(comment.authorId)
  const canDel = user.role === 'admin' || user.role === 'superadmin' || user.memberId === comment.authorId

  useEffect(() => {
    if (isReplying) inputRef.current?.focus()
  }, [isReplying])

  function submitReply() {
    if (!replyText.trim()) return
    // 대댓글은 항상 최상위 댓글의 자식으로 (2 depth 고정)
    const parentId = isReply ? comment.parentId : comment.id
    onSubmitReply(parentId, replyText.trim())
    setReplyText('')
    onReplyTo(null)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply() }
  }

  return (
    <div className={isReply ? 'ml-9 mt-2' : ''}>
      <div className="flex gap-2.5">
        <Avatar name={author?.name} size={isReply ? 'sm' : 'md'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-900">{author?.name || '멤버'}</span>
            <span className="text-xs text-gray-400">{relTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 leading-snug whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={() => onReplyTo(isReplying ? null : comment.id)}
              className="text-xs text-gray-400 font-medium"
            >
              {isReplying ? '취소' : '답글'}
            </button>
            {canDel && (
              <button onClick={() => onDelete(comment.id)} className="text-xs text-red-400">삭제</button>
            )}
          </div>

          {isReplying && (
            <div className="mt-2 flex gap-2">
              <input
                ref={inputRef}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`${author?.name}에게 답글...`}
                className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <button
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                등록
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 대댓글 */}
      {!isReply && replies?.length > 0 && (
        <div className="ml-9 mt-2 flex flex-col gap-3 relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 -translate-x-4" />
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply
              user={user}
              replyToId={replyToId}
              onReplyTo={onReplyTo}
              onDelete={onDelete}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function NoticeDetail() {
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const notice = getNoticeById(noticeId)

  const sync = useSync()
  const [comments, setComments] = useState(() => getCommentsByPost(noticeId))
  const [newComment, setNewComment] = useState('')
  const [replyToId, setReplyToId] = useState(null)

  useEffect(() => { setComments(getCommentsByPost(noticeId)) }, [sync, noticeId])

  if (!notice) return <div className="p-6 text-gray-400">게시글을 찾을 수 없어요</div>

  const author = getMemberById(notice.authorId)
  const canDeletePost = user.role === 'admin' || user.role === 'superadmin' || user.memberId === notice.authorId

  const topLevel = comments.filter(c => !c.parentId)
  const repliesFor = (parentId) => comments.filter(c => c.parentId === parentId)

  function refresh() { setComments(getCommentsByPost(noticeId)) }

  function handleDeletePost() {
    if (!confirm('이 게시글을 삭제하시겠어요?')) return
    deleteNotice(noticeId)
    navigate('/notices', { replace: true })
  }

  function handleDeleteComment(id) {
    if (!confirm('댓글을 삭제하시겠어요?')) return
    deleteComment(id)
    refresh()
  }

  function handleSubmitNew() {
    if (!newComment.trim()) return
    createComment({ postId: noticeId, parentId: null, authorId: user.memberId, content: newComment.trim(), clubId: user.clubId })
    setNewComment('')
    refresh()
  }

  function handleSubmitReply(parentId, text) {
    createComment({ postId: noticeId, parentId, authorId: user.memberId, content: text, clubId: user.clubId })
    refresh()
  }

  function handleKeyNew(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitNew() }
  }

  return (
    <div className="pb-24">
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
            <button onClick={handleDeletePost} className="shrink-0 text-xs text-red-400 border border-red-200 rounded-lg px-3 py-1.5">
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

      {/* 댓글 */}
      <div className="px-5 mt-6 mb-4">
        <div className="h-px bg-gray-100 mb-4" />
        <p className="text-sm font-semibold text-gray-700 mb-4">댓글 {comments.length}개</p>
        {topLevel.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">첫 댓글을 남겨보세요</p>
        ) : (
          <div className="flex flex-col gap-4">
            {topLevel.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesFor(comment.id)}
                isReply={false}
                user={user}
                replyToId={replyToId}
                onReplyTo={setReplyToId}
                onDelete={handleDeleteComment}
                onSubmitReply={handleSubmitReply}
              />
            ))}
          </div>
        )}
      </div>

      {/* 새 댓글 입력창 — Nav 위에 고정 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 z-40 pb-safe"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)' }}
      >
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={handleKeyNew}
            placeholder="댓글 입력..."
            className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          />
          <button
            onClick={handleSubmitNew}
            disabled={!newComment.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  )
}
