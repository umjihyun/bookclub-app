import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser } from './storage'
import Splash from './pages/Splash'
import Login from './pages/Login'
import CreateClub from './pages/CreateClub'
import JoinClub from './pages/JoinClub'
import Home from './pages/Home'
import BookShelf from './pages/BookShelf'
import BookDetail from './pages/BookDetail'
import AddBook from './pages/AddBook'
import ScheduleList from './pages/ScheduleList'
import CreateSchedule from './pages/CreateSchedule'
import ScheduleResponse from './pages/ScheduleResponse'
import ScheduleResult from './pages/ScheduleResult'
import VoteList from './pages/VoteList'
import CandidateDetail from './pages/CandidateDetail'
import ProposeBook from './pages/ProposeBook'
import NoticeList from './pages/NoticeList'
import NoticeDetail from './pages/NoticeDetail'
import CreateNotice from './pages/CreateNotice'
import Settings from './pages/Settings'
import ClubInfo from './pages/ClubInfo'
import EditClub from './pages/EditClub'

function RequireUser({ children }) {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={<CreateClub />} />
        <Route path="/join" element={<JoinClub />} />
        <Route path="/home" element={<RequireUser><Home /></RequireUser>} />
        <Route path="/books" element={<RequireUser><BookShelf /></RequireUser>} />
        <Route path="/books/add" element={<RequireUser><AddBook /></RequireUser>} />
        <Route path="/books/:bookId" element={<RequireUser><BookDetail /></RequireUser>} />
        <Route path="/schedule" element={<RequireUser><ScheduleList /></RequireUser>} />
        <Route path="/schedule/create" element={<RequireUser><CreateSchedule /></RequireUser>} />
        <Route path="/schedule/:meetingId/result" element={<RequireUser><ScheduleResult /></RequireUser>} />
        <Route path="/schedule/:meetingId" element={<RequireUser><ScheduleResponse /></RequireUser>} />
        <Route path="/vote" element={<RequireUser><VoteList /></RequireUser>} />
        <Route path="/vote/propose" element={<RequireUser><ProposeBook /></RequireUser>} />
        <Route path="/vote/:candidateId" element={<RequireUser><CandidateDetail /></RequireUser>} />
        <Route path="/notices" element={<RequireUser><NoticeList /></RequireUser>} />
        <Route path="/notices/create" element={<RequireUser><CreateNotice /></RequireUser>} />
        <Route path="/notices/:noticeId" element={<RequireUser><NoticeDetail /></RequireUser>} />
        <Route path="/settings" element={<RequireUser><Settings /></RequireUser>} />
        <Route path="/club" element={<RequireUser><ClubInfo /></RequireUser>} />
        <Route path="/club/edit" element={<RequireUser><EditClub /></RequireUser>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
