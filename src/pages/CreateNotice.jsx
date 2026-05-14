import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, createNotice } from '../storage'

export default function CreateNotice() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isNotice, setIsNotice] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    createNotice({
      clubId: user.clubId,
      title: title.trim(),
      content: content.trim(),
      authorId: user.memberId,
      isNotice: user.role === 'admin' ? isNotice : false,
    })
    navigate('/notices', { replace: true })
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate('/notices')} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-6">글쓰기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
            placeholder="내용을 입력하세요"
            rows={8}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        {/* 공지 토글 — 관리자만 표시 */}
        {user.role === 'admin' && (
          <button
            type="button"
            onClick={() => setIsNotice(v => !v)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${isNotice ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}
          >
            <div className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${isNotice ? 'bg-red-500' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isNotice ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <div className="text-left">
              <p className={`text-sm font-semibold ${isNotice ? 'text-red-600' : 'text-gray-600'}`}>공지로 등록</p>
              <p className="text-xs text-gray-400">게시판 상단에 고정돼요</p>
            </div>
          </button>
        )}

        <button
          type="submit"
          disabled={!title.trim() || !content.trim()}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold disabled:opacity-40 mt-1"
        >
          게시하기
        </button>
      </form>
    </div>
  )
}
