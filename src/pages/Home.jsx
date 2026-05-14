import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUser, getClubById, getMembersByClub, getBooksByClub,
  getMeetingsByClub, getNoticesByClub, getVoteRoundsByClub, clearCurrentUser,
  getVoteCandidatesByRound
} from '../storage'
import Nav from '../components/Nav'

export default function Home() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const club = getClubById(user.clubId)
  const members = getMembersByClub(user.clubId)
  const books = getBooksByClub(user.clubId)
  const currentBook = books.find(b => b.status === 'reading') || null
  const meetings = getMeetingsByClub(user.clubId).filter(m => m.status === 'open' || m.status === 'confirmed')
  const nextMeeting = meetings.sort((a, b) => a.createdAt - b.createdAt)[0] || null
  const notices = getNoticesByClub(user.clubId)
  const latestNotice = notices[0] || null
  const rounds = getVoteRoundsByClub(user.clubId)
  const activeRound = rounds.find(r => r.status === 'active') || null
  const activeCandidates = activeRound ? getVoteCandidatesByRound(activeRound.id) : []

  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(club.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function logout() {
    if (confirm('북클럽에서 나가시겠어요?')) {
      clearCurrentUser()
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <h1 className="text-xl font-bold text-gray-900 truncate">{club?.name || '내 북클럽'}</h1>
            <p className="text-sm text-gray-400 mt-0.5">멤버 {members.length}명 · {user.role === 'admin' ? '관리자' : '멤버'}</p>
          </div>
          <div className="flex gap-2">
            {user.role === 'admin' && (
              <button
                onClick={() => setShowCode(s => !s)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600"
              >
                초대코드
              </button>
            )}
            <button onClick={logout} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500">
              나가기
            </button>
          </div>
        </div>
        {showCode && (
          <div className="mt-3 bg-blue-50 rounded-xl p-3 flex items-center justify-between">
            <span className="font-mono font-bold text-blue-700 text-lg tracking-wider">{club?.code}</span>
            <button onClick={copyCode} className="text-xs text-blue-600 font-medium">
              {copied ? '복사됨 ✓' : '복사'}
            </button>
          </div>
        )}
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
          {nextMeeting ? (
            <div>
              <p className="font-semibold text-gray-900">{nextMeeting.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {nextMeeting.status === 'confirmed'
                  ? `확정: ${nextMeeting.confirmedSlot?.date} ${nextMeeting.confirmedSlot?.timeRange}`
                  : `후보 ${nextMeeting.slots?.length}개 · 응답 대기중`}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">예정된 모임이 없어요</p>
          )}
        </section>

        {/* 최신 공지 */}
        <section
          onClick={() => latestNotice && navigate(`/notices/${latestNotice.id}`)}
          className={`rounded-2xl p-4 ${latestNotice ? 'bg-yellow-50 cursor-pointer' : 'bg-gray-50'}`}
        >
          <p className="text-xs font-medium text-gray-400 mb-1">최신 공지</p>
          {latestNotice ? (
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{latestNotice.title}</p>
          ) : (
            <p className="text-gray-400 text-sm">공지가 없어요</p>
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
              {activeRound.round}회차 진행중 · 후보 {activeCandidates.length}권
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
