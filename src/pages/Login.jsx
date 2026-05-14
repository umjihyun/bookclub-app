import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifyUser, setCurrentUser, getUsers } from '../storage'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nickname: '', pin: '' })
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const user = verifyUser(form.nickname.trim(), form.pin)
    if (!user) {
      setError('닉네임 또는 비밀번호가 맞지 않아요.')
      return
    }
    setCurrentUser({ name: user.nickname, clubId: user.clubId, memberId: user.memberId, role: user.role })
    navigate('/home', { replace: true })
  }

  return (
    <div className="flex flex-col justify-center min-h-screen px-6 py-10">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">📖</div>
        <h1 className="text-2xl font-bold text-gray-900">다시 오셨군요!</h1>
        <p className="text-gray-400 mt-1 text-sm">닉네임과 비밀번호로 로그인하세요</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 김독서"
            value={form.nickname}
            onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
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
            value={form.pin}
            onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!form.nickname.trim() || form.pin.length !== 4}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold mt-2 disabled:opacity-40"
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full py-3 text-gray-400 text-sm"
        >
          처음 사용이신가요? → 북클럽 만들기 / 참여
        </button>
      </form>
    </div>
  )
}
