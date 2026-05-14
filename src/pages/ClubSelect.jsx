import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getUserMemberships, getClubById, getMembersByClub, clearCurrentUser, setCurrentClub, ensureMemberExists } from '../storage'
import { syncMembershipsFromFirestore, syncClubFromFirestore, migrateLocalToFirestore } from '../sync'
import Nav from '../components/Nav'

export default function ClubSelect() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [syncing, setSyncing] = useState(false)
  const [memberships, setMemberships] = useState(() => getUserMemberships(user?.userId))

  useEffect(() => {
    if (!user?.userId) return
    setSyncing(true)
    syncMembershipsFromFirestore(user.userId).then(ms => {
      setMemberships(getUserMemberships(user.userId))
      setSyncing(false)
    })
  }, [user?.userId])

  const clubs = memberships
    .map(m => ({ ...m, club: getClubById(m.clubId), memberCount: getMembersByClub(m.clubId).length }))
    .filter(m => m.club)

  async function enterClub(m) {
    setSyncing(true)
    // 기존 로컬 데이터를 Firestore로 먼저 올린 뒤 (최초 1회), 그 다음 내려받기
    await migrateLocalToFirestore(m.clubId)
    await syncClubFromFirestore(m.clubId)
    // 혹시 sync 과정에서 멤버 레코드가 없어졌어도 복구
    ensureMemberExists({ memberId: m.memberId, name: user.name, clubId: m.clubId, role: m.role })
    setCurrentClub({ clubId: m.clubId, memberId: m.memberId, role: m.role })
    navigate('/home', { replace: true })
  }

  function logout() {
    if (confirm('로그아웃 하시겠어요?')) {
      clearCurrentUser()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen pb-10">
      {/* 헤더 */}
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">안녕하세요, {user?.name}님!</h1>
          <p className="text-sm text-gray-400 mt-0.5">
        {syncing ? '동기화 중…' : '속한 북클럽을 선택하세요'}
      </p>
        </div>
        <button onClick={logout} className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5">
          로그아웃
        </button>
      </div>

      <div className="px-5">
        {clubs.length === 0 ? (
          /* 클럽 없음 */
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400">
            <div className="text-5xl mb-2">📚</div>
            <p className="text-sm font-medium">아직 속한 북클럽이 없어요</p>
            <button
              onClick={() => {
                setSyncing(true)
                syncMembershipsFromFirestore(user?.userId).then(() => {
                  setMemberships(getUserMemberships(user?.userId))
                  setSyncing(false)
                })
              }}
              disabled={syncing}
              className="mt-2 text-xs text-blue-500 border border-blue-200 rounded-lg px-3 py-1.5 disabled:opacity-40"
            >
              {syncing ? '동기화 중…' : '🔄 다시 동기화'}
            </button>
            <p className="text-xs">새 북클럽을 만들거나 초대 코드로 참여하세요</p>
          </div>
        ) : (
          /* 클럽 목록 */
          <div className="flex flex-col gap-3 mb-6">
            {clubs.map(m => (
              <button
                key={m.clubId}
                onClick={() => enterClub(m)}
                className="w-full text-left flex items-center gap-4 p-4 border border-gray-100 rounded-2xl active:bg-gray-50"
              >
                {/* 클럽 이미지 */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                  {m.club.imageUrl ? (
                    <img src={m.club.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white/60">{m.club.name[0]}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{m.club.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">멤버 {m.memberCount}명</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${m.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {m.role === 'admin' ? '관리자' : '멤버'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 북클럽 추가 버튼 */}
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 pt-3">북클럽 추가</p>
          <button
            onClick={() => navigate('/create')}
            className="w-full py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold"
          >
            + 북클럽 만들기
          </button>
          <button
            onClick={() => navigate('/join')}
            className="w-full py-3.5 border-2 border-blue-600 text-blue-600 rounded-2xl text-sm font-semibold"
          >
            코드로 들어가기
          </button>
        </div>
      </div>
    </div>
  )
}
