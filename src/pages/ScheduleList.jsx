import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getMeetingsByClub, getMeetingResponsesByMeeting, getMembersByClub } from '../storage'
import Nav from '../components/Nav'

function statusLabel(status) {
  if (status === 'open') return { label: '응답 대기', cls: 'bg-blue-100 text-blue-600' }
  if (status === 'confirmed') return { label: '확정', cls: 'bg-green-100 text-green-600' }
  return { label: '닫힘', cls: 'bg-gray-100 text-gray-500' }
}

function fmtHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

export default function ScheduleList() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const members = getMembersByClub(user.clubId)
  const meetings = getMeetingsByClub(user.clubId).sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="pb-24">
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">일정</h1>
        {user.role === 'admin' && (
          <button
            onClick={() => navigate('/schedule/create')}
            className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-light"
          >
            +
          </button>
        )}
      </div>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-sm">아직 일정이 없어요</p>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-3">
          {meetings.map(meeting => {
            const responses = getMeetingResponsesByMeeting(meeting.id)
            const { label, cls } = statusLabel(meeting.status)
            const slot = meeting.confirmedSlot

            return (
              <div
                key={meeting.id}
                onClick={() => navigate(
                  meeting.status === 'confirmed'
                    ? `/schedule/${meeting.id}/result`
                    : `/schedule/${meeting.id}`
                )}
                className="border border-gray-100 rounded-2xl p-4 cursor-pointer active:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{meeting.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
                </div>

                {meeting.status === 'confirmed' && slot ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-green-700">{slot.date}</span>
                    <span className="text-sm text-green-600">{fmtHour(slot.hour)} ~ {fmtHour(slot.hour + 1)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>날짜 {(meeting.dates || []).length}개</span>
                    <span>·</span>
                    <span>{fmtHour(meeting.startHour)} ~ {fmtHour(meeting.endHour)}</span>
                    <span>·</span>
                    <span className="text-blue-500 font-medium">{responses.length}/{members.length}명 응답</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Nav />
    </div>
  )
}
