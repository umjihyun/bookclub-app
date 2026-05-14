import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getBooksByClub, getMemberBook } from '../storage'
import Nav from '../components/Nav'

function Stars({ rating }) {
  return (
    <span className="text-yellow-400 text-xs">
      {'★'.repeat(rating || 0)}{'☆'.repeat(5 - (rating || 0))}
    </span>
  )
}

export default function BookShelf() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const books = getBooksByClub(user.clubId).sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="pb-24">
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">책꽂이</h1>
        {user.role === 'admin' && (
          <button
            onClick={() => navigate('/books/add')}
            className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-light"
          >
            +
          </button>
        )}
      </div>

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📚</div>
          <p className="text-sm">아직 책이 없어요</p>
          {user.role === 'admin' && (
            <button onClick={() => navigate('/books/add')} className="mt-3 text-blue-600 text-sm font-medium">
              + 첫 책 추가하기
            </button>
          )}
        </div>
      ) : (
        <div className="px-5 grid grid-cols-3 gap-3">
          {books.map(book => {
            const mb = getMemberBook(user.memberId, book.id)
            const isRead = mb?.read || false
            return (
              <div
                key={book.id}
                onClick={() => navigate(`/books/${book.id}`)}
                className="cursor-pointer relative"
              >
                <div className="relative rounded-xl overflow-hidden aspect-[2/3] shadow-sm">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isRead ? 'bg-gradient-to-b from-blue-300 to-blue-500' : 'bg-gradient-to-b from-gray-200 to-gray-400'}`}>
                      <span className="text-3xl">📖</span>
                    </div>
                  )}
                  {isRead && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs font-medium text-gray-800 line-clamp-1">{book.title}</p>
                {isRead && mb?.rating && <Stars rating={mb.rating} />}
              </div>
            )
          })}
        </div>
      )}

      <Nav />
    </div>
  )
}
