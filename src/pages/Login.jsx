import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, createUser, verifyUser, setCurrentUser } from '../storage'
import { syncUserFromFirestore } from '../sync'

export default function Login() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const name = nickname.trim()
    if (!name || pin.length !== 4) return

    let existing = getUsers().find(u => u.nickname === name)

    // 로컬에 없으면 Firestore에서 찾기 (다른 기기에서 가입한 경우)
    if (!existing) {
      const fromFirestore = await syncUserFromFirestore(name, pin)
      if (fromFirestore) existing = fromFirestore
    }

    if (existing) {
      const verified = verifyUser(name, pin)
      if (!verified) {
        setError('비밀번호가 맞지 않아요.')
        return
      }
      setCurrentUser({ userId: verified.id, name: verified.nickname })
    } else {
      const user = createUser({ nickname: name, pin })
      setCurrentUser({ userId: user.id, name: user.nickname })
    }

    navigate('/clubs', { replace: true })
  }

  return (
    <div className="flex flex-col justify-center min-h-screen px-6 py-10">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">📖</div>
        <h1 className="text-2xl font-bold text-gray-900">북클럽</h1>
        <p className="text-gray-400 mt-1 text-sm">함께 읽고, 나누고, 기록하는 독서 공간</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 김독서"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (숫자 4자리)</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="••••"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!nickname.trim() || pin.length !== 4}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
        >
          시작하기
        </button>
        <p className="text-center text-xs text-gray-400">
          처음 사용하면 자동으로 계정이 만들어져요
        </p>
      </form>
    </div>
  )
}
