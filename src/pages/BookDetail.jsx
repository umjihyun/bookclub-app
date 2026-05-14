import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getCurrentUser, getBookById, getMembersByClub, getMemberBook,
  getMemberBooksByBook, upsertMemberBook, getMinutesByBook, addMinutes, getMemberById, updateBook, deleteBook
} from '../storage'
import RatingModal from '../components/RatingModal'
import ImageUpload from '../components/ImageUpload'
import Nav from '../components/Nav'

function Stars({ n }) {
  return <span className="text-yellow-400">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

export default function BookDetail() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [book, setBook] = useState(() => getBookById(bookId))
  const [showRating, setShowRating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [, forceUpdate] = useState(0)
  const fileRef = useRef()
  const isAdmin = user.role === 'admin' || user.role === 'superadmin'

  if (!book) return <div className="p-6 text-gray-400">책을 찾을 수 없어요</div>

  const members = getMembersByClub(user.clubId)
  const allMemberBooks = getMemberBooksByBook(bookId)
  const myMemberBook = getMemberBook(user.memberId, bookId)
  const isRead = myMemberBook?.read || false
  const minutes = getMinutesByBook(bookId)

  function startEdit() {
    setEditForm({ title: book.title, author: book.author, coverUrl: book.coverUrl || '', startDate: book.startDate || '', endDate: book.endDate || '' })
    setEditing(true)
  }

  function saveEdit() {
    if (!editForm.title.trim() || !editForm.author.trim()) return
    const updates = { title: editForm.title.trim(), author: editForm.author.trim(), coverUrl: editForm.coverUrl, startDate: editForm.startDate, endDate: editForm.endDate }
    updateBook(bookId, updates)
    setBook(b => ({ ...b, ...updates }))
    setEditing(false)
  }

  function toggleRead() {
    if (!isRead) {
      upsertMemberBook({ memberId: user.memberId, bookId, clubId: user.clubId, read: true, rating: myMemberBook?.rating, review: myMemberBook?.review })
      setShowRating(true)
    } else {
      upsertMemberBook({ memberId: user.memberId, bookId, clubId: user.clubId, read: false, rating: null, review: '' })
      forceUpdate(n => n + 1)
    }
  }

  function handleRating({ rating, review }) {
    upsertMemberBook({ memberId: user.memberId, bookId, clubId: user.clubId, read: true, rating, review })
    setShowRating(false)
    forceUpdate(n => n + 1)
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      addMinutes({ bookId, clubId: user.clubId, fileName: file.name, fileData: ev.target.result, uploaderId: user.memberId })
      forceUpdate(n => n + 1)
    }
    reader.readAsDataURL(file)
  }

  function toggleDone() {
    const newStatus = book.status === 'reading' ? 'done' : 'reading'
    updateBook(bookId, { status: newStatus })
    setBook(b => ({ ...b, status: newStatus }))
  }

  return (
    <div className="pb-24">
      {showRating && <RatingModal onSubmit={handleRating} onSkip={() => { setShowRating(false); forceUpdate(n => n + 1) }} />}

      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/books')} className="text-gray-400 text-sm">← 책꽂이</button>
          {isAdmin && !editing && (
            <div className="flex gap-3">
              <button onClick={startEdit} className="text-sm text-blue-600 font-medium">수정</button>
              <button
                onClick={() => {
                  if (!confirm('이 책을 삭제하시겠어요?')) return
                  deleteBook(bookId)
                  navigate('/books', { replace: true })
                }}
                className="text-sm text-red-400 font-medium"
              >
                삭제
              </button>
            </div>
          )}
          {editing && (
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="text-sm text-gray-400">취소</button>
              <button onClick={saveEdit} disabled={!editForm.title.trim() || !editForm.author.trim()} className="text-sm text-blue-600 font-semibold disabled:opacity-40">저장</button>
            </div>
          )}
        </div>

        {editing ? (
          /* 수정 모드 */
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">표지 이미지</label>
              <ImageUpload
                value={editForm.coverUrl}
                onChange={url => setEditForm(f => ({ ...f, coverUrl: url }))}
                label="표지 업로드"
                aspect="portrait"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">제목 *</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">저자 *</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                value={editForm.author}
                onChange={e => setEditForm(f => ({ ...f, author: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">시작일</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">종료일</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
          </div>
        ) : (
          /* 보기 모드 */
          <div className="flex gap-4">
            <div className="w-20 shrink-0">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full rounded-xl shadow object-cover aspect-[2/3]" />
              ) : (
                <div className="w-full aspect-[2/3] bg-gradient-to-b from-blue-200 to-blue-400 rounded-xl flex items-center justify-center text-3xl">📖</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-snug">{book.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
              <p className="text-xs text-gray-400 mt-1">{book.startDate} ~ {book.endDate}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={toggleRead}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${isRead ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {isRead ? '✓ 읽음' : '읽음으로 표시'}
                </button>
                {isRead && (
                  <button onClick={() => setShowRating(true)} className="text-xs px-3 py-1.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                    ★ 별점/리뷰
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={toggleDone}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${book.status === 'done' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {book.status === 'done' ? '완료됨' : '완료로 표시'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 멤버 리뷰 */}
      <div className="px-5 mt-2">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">멤버 리뷰</h2>
        {members.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 리뷰가 없어요</p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map(m => {
              const mb = allMemberBooks.find(mb => mb.memberId === m.id)
              return (
                <div key={m.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{m.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${mb?.read ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {mb?.read ? '읽음' : '안읽음'}
                      </span>
                    </div>
                    {mb?.read && (mb?.rating || mb?.review) && (
                      <div className="mt-0.5">
                        {mb.rating > 0 && <Stars n={mb.rating} />}
                        {mb.review && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{mb.review}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 회의록 */}
      <div className="px-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">회의록</h2>
          <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 font-medium">+ 업로드</button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
        </div>
        {minutes.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 회의록이 없어요</p>
        ) : (
          <div className="flex flex-col gap-2">
            {minutes.map(m => {
              const uploader = getMemberById(m.uploaderId)
              return (
                <a key={m.id} href={m.fileData} download={m.fileName} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                  <span className="text-xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.fileName}</p>
                    <p className="text-xs text-gray-400">{uploader?.name} · {new Date(m.uploadedAt).toLocaleDateString('ko')}</p>
                  </div>
                  <span className="text-xs text-blue-600">다운로드</span>
                </a>
              )
            })}
          </div>
        )}
      </div>

      <Nav />
    </div>
  )
}
