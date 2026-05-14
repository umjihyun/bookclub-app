import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser } from './storage'
import Splash from './pages/Splash'
import Login from './pages/Login'
import ClubSelect from './pages/ClubSelect'
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

// 로그인만 필요
function RequireUser({ children }) {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  return children
}

// 로그인 + 활성 클럽 필요
function RequireClub({ children }) {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  if (!user.clubId) return <Navigate to="/clubs" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/clubs" element={<RequireUser><ClubSelect /></RequireUser>} />
        <Route path="/create" element={<RequireUser><CreateClub /></RequireUser>} />
        <Route path="/join" element={<RequireUser><JoinClub /></RequireUser>} />
        <Route path="/home" element={<RequireClub><Home /></RequireClub>} />
        <Route path="/books" element={<RequireClub><BookShelf /></RequireClub>} />
        <Route path="/books/add" element={<RequireClub><AddBook /></RequireClub>} />
        <Route path="/books/:bookId" element={<RequireClub><BookDetail /></RequireClub>} />
        <Route path="/schedule" element={<RequireClub><ScheduleList /></RequireClub>} />
        <Route path="/schedule/create" element={<RequireClub><CreateSchedule /></RequireClub>} />
        <Route path="/schedule/:meetingId/result" element={<RequireClub><ScheduleResult /></RequireClub>} />
        <Route path="/schedule/:meetingId" element={<RequireClub><ScheduleResponse /></RequireClub>} />
        <Route path="/vote" element={<RequireClub><VoteList /></RequireClub>} />
        <Route path="/vote/propose" element={<RequireClub><ProposeBook /></RequireClub>} />
        <Route path="/vote/:candidateId" element={<RequireClub><CandidateDetail /></RequireClub>} />
        <Route path="/notices" element={<RequireClub><NoticeList /></RequireClub>} />
        <Route path="/notices/create" element={<RequireClub><CreateNotice /></RequireClub>} />
        <Route path="/notices/:noticeId" element={<RequireClub><NoticeDetail /></RequireClub>} />
        <Route path="/settings" element={<RequireUser><Settings /></RequireUser>} />
        <Route path="/club" element={<RequireClub><ClubInfo /></RequireClub>} />
        <Route path="/club/edit" element={<RequireClub><EditClub /></RequireClub>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
