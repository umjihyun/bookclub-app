import { useSync } from '../RealtimeProvider'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUser, getClubById, getMembersByClub, getBooksByClub,
  getMeetingsByClub, getMeetingResponsesByMeeting, getNoticesByClub,
  getVoteRoundsByClub, clearCurrentUser, clearCurrentClub, getVoteCandidatesByRound
} from '../storage'
import Nav from '../components/Nav'

function HamburgerIcon() {
  return (
    <div className="flex flex-col gap-[5px] w-5">
      <span className="block h-0.5 bg-gray-700 rounded-full" />
      <span className="block h-0.5 bg-gray-700 rounded-full" />
      <span className="block h-0.5 bg-gray-700 rounded-full" />
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  useSync()
  const club = getClubById(user.clubId)
  const members = getMembersByClub(user.clubId)
  const books = getBooksByClub(user.clubId)
  const doneBooks = books.filter(b => b.status === 'done').length
  const currentBook = books.find(b => b.status === 'reading') || null
  const meetings = getMeetingsByClub(user.clubId).filter(m => m.status === 'open' || m.status === 'confirmed')
  const nextMeeting = meetings.sort((a, b) => a.createdAt - b.createdAt)[0] || null
  const notices = getNoticesByClub(user.clubId)
  const latestNotice = notices[0] || null
  const rounds = getVoteRoundsByClub(user.clubId)
  const activeRound = rounds.find(r => r.status === 'active') || null
  const activeCandidates = activeRound ? getVoteCandidatesByRound(activeRound.id) : []

  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(club.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function switchClub() {
    setShowMenu(false)
    clearCurrentClub()
    navigate('/clubs', { replace: true })
  }

  function logout() {
    setShowMenu(false)
    if (confirm('로그아웃 하시겠어요?')) {
      clearCurrentUser()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="pb-24">
      {/* 햄버거 드로어 */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMenu(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 truncate mr-2">{club?.name}</span>
              <button onClick={() => setShowMenu(false)} className="text-gray-400 text-xl shrink-0">✕</button>
            </div>

            {/* 초대 코드 (관리자만) */}
            {user.role === 'admin' && (
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-2">초대 코드</p>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                  <span className="font-mono font-bold text-blue-600 tracking-widest text-lg">{club?.code}</span>
                  <button onClick={copyCode} className="text-xs text-blue-600 font-medium ml-3 shrink-0">
                    {copied ? '복사됨 ✓' : '복사'}
                  </button>
                </div>
              </div>
            )}

            {/* 메뉴 항목 */}
            <div className="flex-1 px-3 pt-2">
              <button
                onClick={switchClub}
                className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 active:bg-gray-50"
              >
                <span className="text-xl">🏠</span>
                <span className="font-medium">다른 북클럽</span>
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/settings') }}
                className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 active:bg-gray-50"
              >
                <span className="text-xl">⚙️</span>
                <span className="font-medium">환경설정</span>
              </button>
              <button
                onClick={logout}
                className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 active:bg-red-50"
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className="px-5 pt-10 pb-4 flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate('/club')}
        >
          {/* 프로필 원형 이미지 */}
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
            {club?.imageUrl ? (
              <img src={club.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{club?.name?.[0] || '📚'}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{club?.name || '내 북클럽'}</h1>
            <p className="text-xs text-gray-400">멤버 {members.length}명 · 읽은 책 {doneBooks}권</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/club/edit')}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500"
            >
              수정
            </button>
          )}
          <button onClick={() => setShowMenu(true)} className="p-1.5 -mr-1">
            <HamburgerIcon />
          </button>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* 현재 읽는 책 */}
        <section
          onClick={() => currentBook && navigate(`/books/${currentBook.id}`)}
          className={`rounded-2xl p-4 ${currentBook ? 'bg-blue-50 cursor-pointer' : 'bg-gray-50'}`}
        >
          <p className="text-xs font-medium text-gray-400 mb-2">지금 읽는 책</p>
          {currentBook ? (
            <div className="flex gap-3 items-center">
              {currentBook.coverUrl ? (
                <img src={currentBook.coverUrl} alt="" className="w-12 h-16 object-cover rounded-lg shadow" />
              ) : (
                <div className="w-12 h-16 bg-blue-200 rounded-lg flex items-center justify-center text-xl">📖</div>
              )}
              <div>
                <p className="font-semibold text-gray-900 leading-tight">{currentBook.title}</p>
                <p className="text-sm text-gray-500">{currentBook.author}</p>
                <p className="text-xs text-gray-400 mt-1">{currentBook.startDate} ~ {currentBook.endDate}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">아직 등록된 책이 없어요</p>
          )}
        </section>

        {/* 다음 일정 */}
        <section
          onClick={() => nextMeeting && navigate(`/schedule/${nextMeeting.id}`)}
          className={`rounded-2xl p-4 ${nextMeeting ? 'bg-green-50 cursor-pointer' : 'bg-gray-50'}`}
        >
          <p className="text-xs font-medium text-gray-400 mb-1">다음 일정</p>
          {nextMeeting ? (() => {
            const responses = getMeetingResponsesByMeeting(nextMeeting.id)
            const resCount = responses.length
            const total = members.length
            return (
              <div>
                <p className="font-semibold text-gray-900">{nextMeeting.name}</p>
                {nextMeeting.status === 'confirmed' && nextMeeting.confirmedSlot ? (
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    확정: {nextMeeting.confirmedSlot.date} {String(nextMeeting.confirmedSlot.hour).padStart(2, '0')}:00
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-400">응답 완료</span>
                      <span className="text-xs font-medium text-gray-600">{resCount}/{total}명</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all"
                        style={{ width: total > 0 ? `${(resCount / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </>
                )}
              </div>
            )
          })() : (
            <p className="text-gray-400 text-sm">예정된 모임이 없어요</p>
          )}
        </section>

        {/* 최신 게시글 */}
        <section
          onClick={() => latestNotice && navigate(`/notices/${latestNotice.id}`)}
          className={`rounded-2xl p-4 ${latestNotice ? 'bg-yellow-50 cursor-pointer' : 'bg-gray-50'}`}
        >
          <p className="text-xs font-medium text-gray-400 mb-1">최신 게시글</p>
          {latestNotice ? (
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{latestNotice.title}</p>
              {latestNotice.content && (
                <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{latestNotice.content}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">게시글이 없어요</p>
          )}
        </section>

        {/* 투표 현황 */}
        <section
          onClick={() => navigate('/vote')}
          className={`rounded-2xl p-4 cursor-pointer ${activeRound ? 'bg-purple-50' : 'bg-gray-50'}`}
        >
          <p className="text-xs font-medium text-gray-400 mb-1">투표 현황</p>
          {activeRound ? (
            <p className="font-semibold text-gray-900 text-sm">
              진행중 · 후보 {activeCandidates.length}권
            </p>
          ) : (
            <p className="text-gray-400 text-sm">진행중인 투표가 없어요</p>
          )}
        </section>
      </div>

      <Nav />
    </div>
  )
}
