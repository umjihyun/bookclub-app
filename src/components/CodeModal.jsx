import { useState } from 'react'

export default function CodeModal({ code, onClose }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-lg font-bold mb-1">북클럽이 만들어졌어요!</h2>
        <p className="text-sm text-gray-500 mb-4">아래 코드를 멤버들에게 공유하세요</p>
        <div className="bg-gray-100 rounded-xl py-4 px-6 mb-4">
          <span className="text-3xl font-mono font-bold tracking-widest text-blue-600">{code}</span>
        </div>
        <button
          onClick={copy}
          className="w-full py-2.5 border border-blue-600 text-blue-600 rounded-xl text-sm font-semibold mb-2"
        >
          {copied ? '복사됨 ✓' : '코드 복사'}
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          홈으로 가기
        </button>
      </div>
    </div>
  )
}
