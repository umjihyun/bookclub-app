import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, createMeeting } from '../storage'

export default function CreateSchedule() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [name, setName] = useState('')
  const [dates, setDates] = useState([''])
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(22)

  if (user.role !== 'admin') {
    navigate('/schedule', { replace: true })
    return null
  }

  function addDate() { setDates(d => [...d, '']) }
  function removeDate(i) { setDates(d => d.filter((_, idx) => idx !== i)) }
  function updateDate(i, v) { setDates(d => d.map((x, idx) => idx === i ? v : x)) }

  const validDates = dates.filter(d => d.trim())
  const canSubmit = name.trim() && validDates.length > 0 && endHour > startHour

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    createMeeting({ clubId: user.clubId, name: name.trim(), dates: validDates, startHour, endHour })
    navigate('/schedule', { replace: true })
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="min-h-screen px-6 py-10">
      <button onClick={() => navigate('/schedule')} className="text-gray-400 mb-6 text-sm">← 뒤로</button>
      <h1 className="text-2xl font-bold mb-6">일정 만들기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">일정 이름</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 5월 정기 모임"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">날짜 후보</label>
            <button type="button" onClick={addDate} className="text-sm text-blue-600 font-medium">+ 추가</button>
          </div>
          <div className="flex flex-col gap-2">
            {dates.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="date"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={d}
                  onChange={e => updateDate(i, e.target.value)}
                />
                {dates.length > 1 && (
                  <button type="button" onClick={() => removeDate(i)} className="text-red-400 text-sm px-2 py-1">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">응답 시간대</label>
          <div className="flex items-center gap-3">
            <select
              value={startHour}
              onChange={e => setStartHour(Number(e.target.value))}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {hours.map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
            <span className="text-gray-400 text-sm shrink-0">~</span>
            <select
              value={endHour}
              onChange={e => setEndHour(Number(e.target.value))}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {hours.filter(h => h > startHour).map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">멤버들이 이 시간대 안에서 가능한 시간을 선택해요</p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold disabled:opacity-40 mt-2"
        >
          가능 시간 조사 시작
        </button>
      </form>
    </div>
  )
}
