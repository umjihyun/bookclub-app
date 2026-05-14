const KEYS = {
  clubs: 'bc_clubs',
  members: 'bc_members',
  books: 'bc_books',
  memberBooks: 'bc_member_books',
  meetings: 'bc_meetings',
  meetingResponses: 'bc_meeting_responses',
  notices: 'bc_notices',
  comments: 'bc_comments',
  voteRounds: 'bc_vote_rounds',
  voteCandidates: 'bc_vote_candidates',
  voteHearts: 'bc_vote_hearts',
  minutes: 'bc_minutes',
  currentUser: 'bc_current_user',
  users: 'bc_users',
}

function get(key) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getList(key) {
  return get(key) || []
}

function saveList(key, list) {
  set(key, list)
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// Current user
export function getCurrentUser() {
  return get(KEYS.currentUser)
}

export function setCurrentUser(user) {
  set(KEYS.currentUser, user)
}

export function clearCurrentUser() {
  localStorage.removeItem(KEYS.currentUser)
}

// Clubs
export function getClubs() {
  return getList(KEYS.clubs)
}

export function createClub({ name, maxMembers }) {
  const clubs = getClubs()
  const club = { id: uid(), name, code: genCode(), maxMembers: parseInt(maxMembers), createdAt: Date.now() }
  saveList(KEYS.clubs, [...clubs, club])
  return club
}

export function updateClub(id, updates) {
  saveList(KEYS.clubs, getClubs().map(c => c.id === id ? { ...c, ...updates } : c))
}

export function getClubByCode(code) {
  return getClubs().find(c => c.code.toUpperCase() === code.toUpperCase()) || null
}

export function saveClubLocally(clubData) {
  const clubs = getClubs()
  if (clubs.find(c => c.id === clubData.id)) return clubs.find(c => c.id === clubData.id)
  const club = {
    id: clubData.id,
    name: clubData.name,
    code: clubData.code,
    maxMembers: clubData.maxMembers,
    imageUrl: clubData.imageUrl || '',
    createdAt: clubData.createdAt,
  }
  saveList(KEYS.clubs, [...clubs, club])
  return club
}

export function getClubById(id) {
  return getClubs().find(c => c.id === id) || null
}

// Members
export function getMembers() {
  return getList(KEYS.members)
}

export function getMembersByClub(clubId) {
  return getMembers().filter(m => m.clubId === clubId)
}

export function createMember({ name, clubId, role }) {
  const members = getMembers()
  const member = { id: uid(), name, clubId, role, joinedAt: Date.now() }
  saveList(KEYS.members, [...members, member])
  return member
}

export function getMemberById(id) {
  return getMembers().find(m => m.id === id) || null
}

export function updateMember(id, updates) {
  saveList(KEYS.members, getMembers().map(m => m.id === id ? { ...m, ...updates } : m))
}

// Books
export function getBooks() {
  return getList(KEYS.books)
}

export function getBooksByClub(clubId) {
  return getBooks().filter(b => b.clubId === clubId)
}

export function getBookById(id) {
  return getBooks().find(b => b.id === id) || null
}

export function createBook({ clubId, title, author, coverUrl, startDate, endDate }) {
  const books = getBooks()
  const book = { id: uid(), clubId, title, author, coverUrl, startDate, endDate, status: 'reading', createdAt: Date.now() }
  saveList(KEYS.books, [...books, book])
  return book
}

export function updateBook(id, updates) {
  const books = getBooks()
  saveList(KEYS.books, books.map(b => b.id === id ? { ...b, ...updates } : b))
}

// MemberBooks
export function getMemberBooks() {
  return getList(KEYS.memberBooks)
}

export function getMemberBook(memberId, bookId) {
  return getMemberBooks().find(mb => mb.memberId === memberId && mb.bookId === bookId) || null
}

export function getMemberBooksByBook(bookId) {
  return getMemberBooks().filter(mb => mb.bookId === bookId)
}

export function upsertMemberBook({ memberId, bookId, read, rating, review }) {
  const all = getMemberBooks()
  const existing = all.findIndex(mb => mb.memberId === memberId && mb.bookId === bookId)
  const updated = { memberId, bookId, read: read ?? false, rating: rating ?? null, review: review ?? '' }
  if (existing >= 0) {
    const next = [...all]
    next[existing] = { ...all[existing], ...updated }
    saveList(KEYS.memberBooks, next)
  } else {
    saveList(KEYS.memberBooks, [...all, updated])
  }
}

// Meetings
export function getMeetings() {
  return getList(KEYS.meetings)
}

export function getMeetingsByClub(clubId) {
  return getMeetings().filter(m => m.clubId === clubId)
}

export function getMeetingById(id) {
  return getMeetings().find(m => m.id === id) || null
}

export function createMeeting({ clubId, name, dates, startHour, endHour }) {
  const meetings = getMeetings()
  const meeting = { id: uid(), clubId, name, dates, startHour, endHour, status: 'open', confirmedSlot: null, createdAt: Date.now() }
  saveList(KEYS.meetings, [...meetings, meeting])
  return meeting
}

export function updateMeeting(id, updates) {
  const meetings = getMeetings()
  saveList(KEYS.meetings, meetings.map(m => m.id === id ? { ...m, ...updates } : m))
}

// MeetingResponses
export function getMeetingResponses() {
  return getList(KEYS.meetingResponses)
}

export function getMeetingResponsesByMeeting(meetingId) {
  return getMeetingResponses().filter(r => r.meetingId === meetingId)
}

export function upsertMeetingResponse({ memberId, meetingId, availability }) {
  const all = getMeetingResponses()
  const existing = all.findIndex(r => r.memberId === memberId && r.meetingId === meetingId)
  const updated = { memberId, meetingId, availability }
  if (existing >= 0) {
    const next = [...all]
    next[existing] = updated
    saveList(KEYS.meetingResponses, next)
  } else {
    saveList(KEYS.meetingResponses, [...all, updated])
  }
}

export function getMeetingResponse(memberId, meetingId) {
  return getMeetingResponses().find(r => r.memberId === memberId && r.meetingId === meetingId) || null
}

// Notices
export function getNotices() {
  return getList(KEYS.notices)
}

export function getNoticesByClub(clubId) {
  return getNotices().filter(n => n.clubId === clubId).sort((a, b) => b.createdAt - a.createdAt)
}

export function getNoticeById(id) {
  return getNotices().find(n => n.id === id) || null
}

export function createNotice({ clubId, title, content, authorId, isNotice = false }) {
  const notices = getNotices()
  const notice = { id: uid(), clubId, title, content, authorId, isNotice, createdAt: Date.now() }
  saveList(KEYS.notices, [...notices, notice])
  return notice
}

export function deleteNotice(id) {
  saveList(KEYS.notices, getNotices().filter(n => n.id !== id))
  saveList(KEYS.comments, getComments().filter(c => c.postId !== id))
}

// Comments
export function getComments() {
  return getList(KEYS.comments)
}

export function getCommentsByPost(postId) {
  return getComments().filter(c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt)
}

export function createComment({ postId, parentId = null, authorId, content }) {
  const all = getComments()
  const comment = { id: uid(), postId, parentId, authorId, content, createdAt: Date.now() }
  saveList(KEYS.comments, [...all, comment])
  return comment
}

export function deleteComment(id) {
  const all = getComments()
  const toDelete = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    all.forEach(c => {
      if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
        toDelete.add(c.id)
        changed = true
      }
    })
  }
  saveList(KEYS.comments, all.filter(c => !toDelete.has(c.id)))
}

// VoteRounds
export function getVoteRounds() {
  return getList(KEYS.voteRounds)
}

export function getVoteRoundsByClub(clubId) {
  return getVoteRounds().filter(r => r.clubId === clubId).sort((a, b) => a.round - b.round)
}

export function getVoteRoundById(id) {
  return getVoteRounds().find(r => r.id === id) || null
}

export function createVoteRound({ clubId, round }) {
  const rounds = getVoteRounds()
  const vr = { id: uid(), clubId, round, status: 'active', confirmedBookId: null, createdAt: Date.now() }
  saveList(KEYS.voteRounds, [...rounds, vr])
  return vr
}

export function updateVoteRound(id, updates) {
  const rounds = getVoteRounds()
  saveList(KEYS.voteRounds, rounds.map(r => r.id === id ? { ...r, ...updates } : r))
}

export function ensureActiveVoteRound(clubId) {
  const rounds = getVoteRoundsByClub(clubId)
  const active = rounds.find(r => r.status === 'active')
  if (active) return active
  const maxRound = rounds.reduce((m, r) => Math.max(m, r.round), 0)
  return createVoteRound({ clubId, round: maxRound + 1 })
}

// VoteCandidates
export function getVoteCandidates() {
  return getList(KEYS.voteCandidates)
}

export function getVoteCandidatesByRound(roundId) {
  return getVoteCandidates().filter(c => c.roundId === roundId)
}

export function getVoteCandidateById(id) {
  return getVoteCandidates().find(c => c.id === id) || null
}

export function createVoteCandidate({ roundId, clubId, title, author, reason, imageUrl, link, proposerId }) {
  const cands = getVoteCandidates()
  const cand = { id: uid(), roundId, clubId, title, author, reason, imageUrl: imageUrl || '', link: link || '', proposerId, createdAt: Date.now() }
  saveList(KEYS.voteCandidates, [...cands, cand])
  return cand
}

export function deleteVoteCandidate(id) {
  saveList(KEYS.voteCandidates, getVoteCandidates().filter(c => c.id !== id))
  saveList(KEYS.voteHearts, getVoteHearts().filter(h => h.candidateId !== id))
}

export function moveCandidatesToRound(candidateIds, newRoundId) {
  const cands = getVoteCandidates()
  saveList(KEYS.voteCandidates, cands.map(c => candidateIds.includes(c.id) ? { ...c, roundId: newRoundId } : c))
}

// VoteHearts
export function getVoteHearts() {
  return getList(KEYS.voteHearts)
}

export function getHeartsByCandidate(candidateId) {
  return getVoteHearts().filter(h => h.candidateId === candidateId)
}

export function toggleHeart({ candidateId, memberId }) {
  const hearts = getVoteHearts()
  const existing = hearts.findIndex(h => h.candidateId === candidateId && h.memberId === memberId)
  if (existing >= 0) {
    saveList(KEYS.voteHearts, hearts.filter((_, i) => i !== existing))
    return false
  } else {
    saveList(KEYS.voteHearts, [...hearts, { candidateId, memberId }])
    return true
  }
}

export function hasHeart(candidateId, memberId) {
  return getVoteHearts().some(h => h.candidateId === candidateId && h.memberId === memberId)
}

// Minutes
export function getMinutes() {
  return getList(KEYS.minutes)
}

export function getMinutesByBook(bookId) {
  return getMinutes().filter(m => m.bookId === bookId).sort((a, b) => b.uploadedAt - a.uploadedAt)
}

export function addMinutes({ bookId, clubId, fileName, fileData, uploaderId }) {
  const all = getMinutes()
  const m = { id: uid(), bookId, clubId, fileName, fileData, uploaderId, uploadedAt: Date.now() }
  saveList(KEYS.minutes, [...all, m])
  return m
}

// Users (for login persistence)
export function getUsers() {
  return getList(KEYS.users)
}

export function createUser({ nickname, pin, clubId, memberId, role }) {
  const users = getUsers()
  const existing = users.findIndex(u => u.nickname === nickname)
  const user = { id: uid(), nickname, pin, clubId, memberId, role }
  if (existing >= 0) {
    const next = [...users]
    next[existing] = { ...users[existing], ...user }
    saveList(KEYS.users, next)
  } else {
    saveList(KEYS.users, [...users, user])
  }
  return user
}

export function verifyUser(nickname, pin) {
  const user = getUsers().find(u => u.nickname === nickname && u.pin === pin)
  return user || null
}

export function getUserByMemberId(memberId) {
  return getUsers().find(u => u.memberId === memberId) || null
}

export function updateUserProfile(memberId, { nickname, pin }) {
  saveList(KEYS.users, getUsers().map(u => u.memberId === memberId ? { ...u, nickname, pin } : u))
  updateMember(memberId, { name: nickname })
  const cur = getCurrentUser()
  if (cur?.memberId === memberId) setCurrentUser({ ...cur, name: nickname })
}
