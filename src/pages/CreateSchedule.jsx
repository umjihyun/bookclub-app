import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, createMeeting } from '../storage'

export default function CreateSchedule() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [name, setName] = useState('')
  const [slots, setSlots] = useState([{ date: '', timeRange: '' }])

  if (user.role !== 'admin') {
    navigate('/schedule', { replace: true })
    return null
  }

  function addSlot() {
    setSlots(s => [...s, { date: '', timeRange: '' }])
  }

  function removeSlot(i) {
    setSlots(s => s.filter((_, idx) => idx !== i))
  }

  function updateSlot(i, field, value) {
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, [field]: value } : slot))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validSlots = slots.filter(s => s.date && s.timeRange)
    if (!name.trim() || validSlots.length === 0) return
    createMeeting({ clubId: user.clubId, name: name.trim(), slots: validSlots })
    navigate('/schedule', { replace: true })
  }

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
            <button type="button" onClick={addSlot} className="text-sm text-blue-600 font-medium">+ 추가</button>
          </div>
          <div className="flex flex-col gap-3">
            {slots.map((slot, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">후보 {i + 1}</span>
                  {slots.length > 1 && (
                    <button type="button" onClick={() => removeSlot(i)} className="text-xs text-red-400">삭제</button>
                  )}
                </div>
                <input
                  type="date"
                  className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={slot.date}
                  onChange={e => updateSlot(i, 'date', e.target.value)}
                />
                <input
                  type="text"
                  className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="예: 19:00~21:00"
                  value={slot.timeRange}
                  onChange={e => updateSlot(i, 'timeRange', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || slots.every(s => !s.date || !s.timeRange)}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold disabled:opacity-40"
        >
          투표 시작하기
        </button>
      </form>
    </div>
  )
}
