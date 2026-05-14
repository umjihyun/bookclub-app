import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, createNotice } from '../storage'

export default function CreateNotice() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  if (user.role !== 'admin') {
    navigate('/notices', { replace: true })
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    createNotice({ clubId: user.clubId, title: title.trim(), content: content.trim(), authorId: user.memberId })
    navigate('/notices', { replace: true })
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate('/notices')} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-6">공지 작성</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="공지 제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
            placeholder="공지 내용을 입력하세요"
            rows={8}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={!title.trim() || !content.trim()}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold disabled:opacity-40"
        >
          게시하기
        </button>
      </form>
    </div>
  )
}
