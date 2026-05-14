import { useSync } from '../RealtimeProvider'
import { Fragment, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser, getMeetingById, getMeetingResponse, upsertMeetingResponse } from '../storage'
import Nav from '../components/Nav'

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()}\n${days[d.getDay()]}`
}

export default function ScheduleResponse() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  useSync()
  const meeting = getMeetingById(meetingId)

  const existing = getMeetingResponse(user.memberId, meetingId)
  const [avail, setAvail] = useState(() => {
    const init = {}
    if (existing?.availability) {
      for (const [date, hrs] of Object.entries(existing.availability)) {
        init[date] = new Set(hrs)
      }
    }
    return init
  })

  if (!meeting) return <div className="p-6 text-gray-400">일정을 찾을 수 없어요</div>
  if (meeting.status === 'confirmed') {
    navigate(`/schedule/${meetingId}/result`, { replace: true })
    return null
  }

  const dates = meeting.dates || []
  const hours = []
  for (let h = meeting.startHour; h < meeting.endHour; h++) hours.push(h)

  function toggle(date, hour) {
    setAvail(prev => {
      const next = { ...prev }
      const set = new Set(next[date] || [])
      if (set.has(hour)) set.delete(hour)
      else set.add(hour)
      next[date] = set
      return next
    })
  }

  function isSelected(date, hour) {
    return avail[date]?.has(hour) || false
  }

  function handleSubmit() {
    const availability = {}
    for (const [date, set] of Object.entries(avail)) {
      availability[date] = [...set]
    }
    upsertMeetingResponse({ memberId: user.memberId, meetingId, clubId: user.clubId, availability })
    navigate('/schedule')
  }

  return (
    <div className="pb-28">
      <div className="px-5 pt-8 pb-3">
        <button onClick={() => navigate('/schedule')} className="text-gray-400 text-sm mb-4">← 일정</button>
        <h1 className="text-xl font-bold">{meeting.name}</h1>
        <p className="text-sm text-gray-400 mt-1">가능한 시간 칸을 모두 탭해서 선택해주세요</p>
      </div>

      {/* Legend */}
      <div className="px-5 flex items-center gap-2 mb-3 text-xs text-gray-400">
        <div className="w-5 h-5 rounded bg-green-400" />
        <span>가능</span>
        <div className="w-5 h-5 rounded bg-gray-100 border border-gray-200 ml-2" />
        <span>불가</span>
      </div>

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
                const sel = isSelected(date, hour)
                return (
                  <button
                    key={`${date}-${hour}`}
                    onClick={() => toggle(date, hour)}
                    className={`h-10 mx-0.5 my-0.5 rounded-lg transition-colors ${sel ? 'bg-green-400' : 'bg-gray-100'}`}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="px-5 mt-4">
          <button
            onClick={() => navigate(`/schedule/${meetingId}/result`)}
            className="w-full py-3 border border-blue-600 text-blue-600 rounded-2xl text-sm font-semibold"
          >
            결과 보기 / 확정하기
          </button>
        </div>
      )}

      <div className="px-5 mt-3">
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold"
        >
          응답 완료
        </button>
      </div>

      <Nav />
    </div>
  )
}
