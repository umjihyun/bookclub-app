import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { getCurrentUser, getUsers } from '../storage'

export default function Splash() {
  const navigate = useNavigate()
  const hasUsers = getUsers().length > 0

  useEffect(() => {
    const user = getCurrentUser()
    if (user) navigate('/home', { replace: true })
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <div className="text-center mb-4">
        <div className="text-6xl mb-3">📖</div>
        <h1 className="text-3xl font-bold text-gray-900">북클럽</h1>
        <p className="text-gray-400 mt-2 text-sm">함께 읽고, 나누고, 기록하는 우리의 독서 공간</p>
      </div>
      <div className="w-full flex flex-col gap-3">
        {hasUsers && (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold"
          >
            로그인
          </button>
        )}
        <button
          onClick={() => navigate('/create')}
          className={`w-full py-4 rounded-2xl text-base font-semibold ${hasUsers ? 'border-2 border-blue-600 text-blue-600' : 'bg-blue-600 text-white'}`}
        >
          북클럽 만들기
        </button>
        <button
          onClick={() => navigate('/join')}
          className="w-full py-4 border-2 border-blue-600 text-blue-600 rounded-2xl text-base font-semibold"
        >
          코드로 들어가기
        </button>
      </div>
    </div>
  )
}
