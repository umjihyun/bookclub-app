import { useNavigate, useLocation } from 'react-router-dom'

const items = [
  { path: '/books', label: '책꽂이', icon: '📚' },
  { path: '/vote', label: '투표', icon: '🗳️' },
  { path: '/home', label: '홈', icon: '🏠' },
  { path: '/schedule', label: '일정', icon: '📅' },
  { path: '/notices', label: '공지', icon: '📢' },
]

export default function Nav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 flex z-50 pb-safe">
      {items.map(item => {
        const active = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path))
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 ${active ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
