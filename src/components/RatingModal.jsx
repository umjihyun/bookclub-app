import { useState } from 'react'

export default function RatingModal({ onSubmit, onSkip }) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">별점 & 후기</h2>
        <div className="flex gap-2 justify-center mb-4">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`text-3xl transition-transform ${n <= rating ? 'scale-110' : 'opacity-30'}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-blue-400"
          placeholder="한줄 후기 (선택)"
          rows={3}
          value={review}
          onChange={e => setReview(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500"
          >
            건너뛰기
          </button>
          <button
            onClick={() => onSubmit({ rating, review })}
            disabled={rating === 0}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  )
}
