import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser, getMeetingById, getMeetingResponse, upsertMeetingResponse, getMeetingResponsesByMeeting, getMembersByClub } from '../storage'
import Nav from '../components/Nav'

export default function ScheduleResponse() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const meeting = getMeetingById(meetingId)

  const existing = getMeetingResponse(user.memberId, meetingId)
  const [selected, setSelected] = useState(new Set(existing?.selectedSlots || []))

  if (!meeting) return <div className="p-6 text-gray-400">일정을 찾을 수 없어요</div>
  if (meeting.status === 'confirmed') {
    navigate(`/schedule/${meetingId}/result`, { replace: true })
    return null
  }

  const members = getMembersByClub(user.clubId)
  const responses = getMeetingResponsesByMeeting(meetingId)

  function toggle(i) {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function handleSubmit() {
    upsertMeetingResponse({ memberId: user.memberId, meetingId, selectedSlots: [...selected] })
    navigate('/schedule')
  }

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate('/schedule')} className="text-gray-400 text-sm mb-4">← 일정</button>
        <h1 className="text-xl font-bold">{meeting.name}</h1>
        <p className="text-sm text-gray-400 mt-1">가능한 날짜를 모두 선택해주세요</p>
      </div>

      <div className="px-5 flex flex-col gap-3 mb-6">
        {(meeting.slots || []).map((slot, i) => {
          const count = responses.filter(r => r.selectedSlots?.includes(i)).length
          const isSelected = selected.has(i)
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{slot.date}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{slot.timeRange}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{count}명 가능</p>
                  <div className={`w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                    {isSelected && <span className="text-xs font-bold">✓</span>}
                  </div>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: members.length > 0 ? `${(count / members.length) * 100}%` : '0%' }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {user.role === 'admin' && (
        <div className="px-5 mb-4">
          <button
            onClick={() => navigate(`/schedule/${meetingId}/result`)}
            className="w-full py-3 border border-blue-600 text-blue-600 rounded-2xl text-sm font-semibold"
          >
            결과 보기 / 확정하기
          </button>
        </div>
      )}

      <div className="px-5">
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
