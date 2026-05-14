import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, createBook } from '../storage'

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
        {[
          { key: 'title', label: '제목', placeholder: '예: 채식주의자', required: true },
          { key: 'author', label: '저자', placeholder: '예: 한강', required: true },
          { key: 'coverUrl', label: '표지 이미지 URL', placeholder: 'https://...', required: false },
          { key: 'startDate', label: '시작일', type: 'date', required: false },
          { key: 'endDate', label: '종료일', type: 'date', required: false },
        ].map(({ key, label, placeholder, required, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <input
              type={type || 'text'}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              placeholder={placeholder}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              required={required}
            />
          </div>
        ))}
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
