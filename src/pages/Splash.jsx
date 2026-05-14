import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../storage'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      navigate('/login', { replace: true })
    } else if (!user.clubId) {
      navigate('/clubs', { replace: true })
    } else {
      navigate('/home', { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-4xl animate-pulse">📖</div>
    </div>
  )
}
