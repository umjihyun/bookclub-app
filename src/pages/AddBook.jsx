import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, createBook } from '../storage'
import ImageUpload from '../components/ImageUpload'

export default function AddBook() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [form, setForm] = useState({ title: '', author: '', coverUrl: '', startDate: '', endDate: '' })

  if (user.role !== 'admin') {
    navigate('/books', { replace: true })
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim()) return
    createBook({ ...form, clubId: user.clubId })
    navigate('/books', { replace: true })
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate('/books')} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-6">책 추가</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제목 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 채식주의자"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            저자 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 한강"
            value={form.author}
            onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">표지 이미지</label>
          <ImageUpload
            value={form.coverUrl}
            onChange={url => setForm(f => ({ ...f, coverUrl: url }))}
            label="표지 이미지 업로드"
            aspect="portrait"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            value={form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={!form.title.trim() || !form.author.trim()}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
        >
          저장하기
        </button>
      </form>
    </div>
  )
}
