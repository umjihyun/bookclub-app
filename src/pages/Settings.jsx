import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getUserByMemberId, updateUserProfile } from '../storage'

export default function Settings() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const stored = getUserByMemberId(user.memberId)

  const [nickname, setNickname] = useState(user.name)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    setError('')

    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요')
      return
    }
    if (newPin || confirmPin) {
      if (newPin.length !== 4) {
        setError('새 비밀번호는 숫자 4자리여야 해요')
        return
      }
      if (newPin !== confirmPin) {
        setError('새 비밀번호가 일치하지 않아요')
        return
      }
    }

    updateUserProfile(user.memberId, {
      nickname: nickname.trim(),
      pin: newPin || stored?.pin || '',
    })
    setSaved(true)
    setNewPin('')
    setConfirmPin('')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate(-1)} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-8">환경설정</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 변경 (선택)</label>
          <div className="flex flex-col gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="새 비밀번호 4자리"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="새 비밀번호 확인"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!nickname.trim()}
          className={`w-full py-4 rounded-2xl text-base font-semibold disabled:opacity-40 transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}
        >
          {saved ? '저장됨 ✓' : '저장하기'}
        </button>
      </form>
    </div>
  )
}
