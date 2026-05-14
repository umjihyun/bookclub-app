import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser, getMeetingById, getMeetingResponsesByMeeting, getMembersByClub, updateMeeting } from '../storage'
import Nav from '../components/Nav'

export default function ScheduleResult() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [meeting, setMeeting] = useState(() => getMeetingById(meetingId))

  if (!meeting) return <div className="p-6 text-gray-400">일정을 찾을 수 없어요</div>

  const members = getMembersByClub(user.clubId)
  const responses = getMeetingResponsesByMeeting(meetingId)
  const slots = meeting.slots || []

  const slotCounts = slots.map((_, i) => responses.filter(r => r.selectedSlots?.includes(i)).length)
  const maxCount = Math.max(...slotCounts, 0)

  function confirm(slotIndex) {
    const slot = slots[slotIndex]
    updateMeeting(meetingId, { status: 'confirmed', confirmedSlot: slot })
    setMeeting(m => ({ ...m, status: 'confirmed', confirmedSlot: slot }))
  }

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate('/schedule')} className="text-gray-400 text-sm mb-4">← 일정</button>
        <h1 className="text-xl font-bold">{meeting.name}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {meeting.status === 'confirmed' ? '확정된 일정' : `${responses.length}/${members.length}명 응답`}
        </p>
      </div>

      {meeting.status === 'confirmed' && meeting.confirmedSlot && (
        <div className="mx-5 mb-4 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-green-600 font-medium mb-1">확정된 일정</p>
          <p className="text-lg font-bold text-green-800">{meeting.confirmedSlot.date}</p>
          <p className="text-base text-green-700">{meeting.confirmedSlot.timeRange}</p>
        </div>
      )}

      <div className="px-5 flex flex-col gap-3">
        {slots.map((slot, i) => {
          const count = slotCounts[i]
          const isBest = count === maxCount && maxCount > 0
          const isConfirmed = meeting.confirmedSlot?.date === slot.date && meeting.confirmedSlot?.timeRange === slot.timeRange
          const respondents = responses.filter(r => r.selectedSlots?.includes(i))

          return (
            <div key={i} className={`rounded-2xl p-4 border-2 ${isConfirmed ? 'border-green-400 bg-green-50' : isBest ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{slot.date}</p>
                  <p className="text-sm text-gray-500">{slot.timeRange}</p>
                </div>
                <div className="text-right">
                  {isBest && !isConfirmed && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">추천</span>
                  )}
                  {isConfirmed && (
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">확정</span>
                  )}
                  <p className="text-sm font-semibold text-gray-700 mt-1">{count}/{members.length}명</p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${isConfirmed ? 'bg-green-400' : 'bg-blue-400'}`}
                  style={{ width: members.length > 0 ? `${(count / members.length) * 100}%` : '0%' }}
                />
              </div>
              {respondents.length > 0 && (
                <p className="text-xs text-gray-400">
                  {respondents.map(r => {
                    const m = members.find(mb => mb.id === r.memberId)
                    return m?.name
                  }).filter(Boolean).join(', ')}
                </p>
              )}
              {user.role === 'admin' && meeting.status === 'open' && (
                <button
                  onClick={() => confirm(i)}
                  className="mt-2 w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
                >
                  이 날짜로 확정
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Nav />
    </div>
  )
}
