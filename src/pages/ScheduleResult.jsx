import { useSync } from '../RealtimeProvider'
import { Fragment, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser, getMeetingById, getMeetingResponsesByMeeting, getMembersByClub, updateMeeting } from '../storage'
import Nav from '../components/Nav'

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()}\n${days[d.getDay()]}`
}

function heatStyle(count, total) {
  if (total === 0 || count === 0) return { background: '#f3f4f6', color: '#d1d5db' }
  const r = count / total
  if (r <= 0.25) return { background: '#bfdbfe', color: '#1e40af' }
  if (r <= 0.5)  return { background: '#60a5fa', color: '#1e3a8a' }
  if (r <= 0.75) return { background: '#2563eb', color: '#ffffff' }
  return { background: '#1d4ed8', color: '#ffffff' }
}

export default function ScheduleResult() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const sync = useSync()
  const [meeting, setMeeting] = useState(() => getMeetingById(meetingId))
  useEffect(() => { setMeeting(getMeetingById(meetingId)) }, [sync, meetingId])

  if (!meeting) return <div className="p-6 text-gray-400">일정을 찾을 수 없어요</div>

  const members = getMembersByClub(user.clubId)
  const responses = getMeetingResponsesByMeeting(meetingId)
  const dates = meeting.dates || []
  const hours = []
  for (let h = meeting.startHour; h < meeting.endHour; h++) hours.push(h)

  function getCount(date, hour) {
    return responses.filter(r => Array.isArray(r.availability?.[date]) && r.availability[date].includes(hour)).length
  }

  function isConfirmed(date, hour) {
    return meeting.confirmedSlot?.date === date && meeting.confirmedSlot?.hour === hour
  }

  function confirmSlot(date, hour) {
    const timeStr = `${String(hour).padStart(2, '0')}:00 ~ ${String(hour + 1).padStart(2, '0')}:00`
    if (!confirm(`${date} ${timeStr}\n이 시간으로 확정하시겠어요?`)) return
    updateMeeting(meetingId, { status: 'confirmed', confirmedSlot: { date, hour } })
    setMeeting(m => ({ ...m, status: 'confirmed', confirmedSlot: { date, hour } }))
  }

  const canConfirm = user.role === 'admin' && meeting.status === 'open'

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-3">
        <button onClick={() => navigate('/schedule')} className="text-gray-400 text-sm mb-4">← 일정</button>
        <h1 className="text-xl font-bold">{meeting.name}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {meeting.status === 'confirmed'
            ? '확정된 일정'
            : `${responses.length}/${members.length}명 응답 완료`}
        </p>
      </div>

      {/* 확정 배너 */}
      {meeting.status === 'confirmed' && meeting.confirmedSlot && (
        <div className="mx-5 mb-5 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-green-600 font-medium mb-1">확정된 일정</p>
          <p className="text-xl font-bold text-green-800">{meeting.confirmedSlot.date}</p>
          <p className="text-lg text-green-700">
            {String(meeting.confirmedSlot.hour).padStart(2, '0')}:00 ~{' '}
            {String(meeting.confirmedSlot.hour + 1).padStart(2, '0')}:00
          </p>
        </div>
      )}

      {/* 히트맵 범례 */}
      {meeting.status === 'open' && (
        <div className="px-5 flex items-center gap-1.5 mb-3">
          <span className="text-xs text-gray-400 mr-1">적음</span>
          {[0, 0.3, 0.6, 1].map((r, i) => {
            const s = heatStyle(r * 4, 4)
            return <div key={i} className="w-6 h-6 rounded" style={{ background: s.background }} />
          })}
          <span className="text-xs text-gray-400 ml-1">많음</span>
          {canConfirm && <span className="text-xs text-gray-400 ml-auto">탭하여 확정</span>}
        </div>
      )}

      {/* Grid */}
      <div className="px-4 overflow-x-auto pb-2">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `44px repeat(${dates.length}, 1fr)`,
            minWidth: dates.length > 3 ? `${44 + dates.length * 72}px` : 'auto'
          }}
        >
          {/* Header */}
          <div />
          {dates.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-600 pb-2 whitespace-pre-line leading-snug">
              {fmtDate(d)}
            </div>
          ))}

          {/* Hour rows */}
          {hours.map(hour => (
            <Fragment key={hour}>
              <div className="flex items-center justify-end pr-2 text-xs text-gray-400 h-10">
                {String(hour).padStart(2, '0')}:00
              </div>
              {dates.map(date => {
                const count = getCount(date, hour)
                const confirmed = isConfirmed(date, hour)
                const style = confirmed
                  ? { background: '#16a34a', color: '#ffffff' }
                  : heatStyle(count, members.length)

                return (
                  <button
                    key={`${date}-${hour}`}
                    onClick={() => canConfirm && confirmSlot(date, hour)}
                    disabled={!canConfirm}
                    className="h-10 mx-0.5 my-0.5 rounded-lg flex items-center justify-center relative transition-opacity"
                    style={{ background: style.background }}
                  >
                    {confirmed ? (
                      <span className="text-sm font-bold" style={{ color: style.color }}>✓</span>
                    ) : count > 0 ? (
                      <span className="text-xs font-bold" style={{ color: style.color }}>{count}</span>
                    ) : null}
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <Nav />
    </div>
  )
}
