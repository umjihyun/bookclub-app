import {
  fsWriteUser, fsWriteClub, fsUpdateClub, fsWriteMembership,
  fsWriteMember, fsUpdateMember, fsWriteBook, fsUpdateBook,
  fsWriteMemberBook, fsWriteMeeting, fsUpdateMeeting,
  fsWriteMeetingResponse, fsWriteNotice, fsDeleteNotice,
  fsWriteComment, fsDeleteComments, fsWriteVoteRound,
  fsUpdateVoteRound, fsWriteVoteCandidate, fsDeleteVoteCandidate,
  fsUpdateVoteCandidate, fsToggleHeart,
} from './fsOps'

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
  currentClub: 'bc_current_club',
  users: 'bc_users',
  memberships: 'bc_memberships',
}

function get(key) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : null
  } catch { return null }
}
function set(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function getList(key) { return get(key) || [] }
function saveList(key, list) { set(key, list) }
function uid() { return Math.random().toString(36).slice(2, 10) }
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── Session ────────────────────────────────────────────────────────────────
export function getCurrentUser() {
  const user = get(KEYS.currentUser)
  if (!user) return null
  const club = get(KEYS.currentClub)

  // 항상 bc_users의 실제 id를 우선 사용 (memberId fallback 방지)
  const allUsers = getList(KEYS.users)
  const actualUser = allUsers.find(u =>
    (user.userId && u.id === user.userId) ||
    (!user.userId && u.nickname === user.name)
  )
  const userId = actualUser?.id || user.userId || user.memberId || user.id

  // bc_current_user에 userId 없으면 자동 수정
  if (userId && user.userId !== userId) {
    set(KEYS.currentUser, { userId, name: user.name || user.nickname })
  }

  return { userId, ...user, ...(club || {}) }
}
export function setCurrentUser(user) {
  if (user.userId) {
    set(KEYS.currentUser, { userId: user.userId, name: user.name })
  } else {
    set(KEYS.currentUser, user)
    if (user.clubId) set(KEYS.currentClub, { clubId: user.clubId, memberId: user.memberId, role: user.role })
  }
}
export function setCurrentClub({ clubId, memberId, role }) {
  set(KEYS.currentClub, { clubId, memberId, role })
}
export function clearCurrentClub() { localStorage.removeItem(KEYS.currentClub) }
export function clearCurrentUser() {
  localStorage.removeItem(KEYS.currentUser)
  localStorage.removeItem(KEYS.currentClub)
}

// ── Clubs ──────────────────────────────────────────────────────────────────
export function getClubs() { return getList(KEYS.clubs) }
export function getClubById(id) { return getClubs().find(c => c.id === id) || null }
export function getClubByCode(code) {
  return getClubs().find(c => c.code.toUpperCase() === code.toUpperCase()) || null
}
export function saveClubLocally(clubData) {
  const clubs = getClubs()
  if (clubs.find(c => c.id === clubData.id)) return clubs.find(c => c.id === clubData.id)
  const club = { id: clubData.id, name: clubData.name, code: clubData.code, maxMembers: clubData.maxMembers, imageUrl: clubData.imageUrl || '', createdAt: clubData.createdAt }
  saveList(KEYS.clubs, [...clubs, club])
  return club
}
export function createClub({ name, maxMembers, imageUrl = '' }) {
  const clubs = getClubs()
  const club = { id: uid(), name, code: genCode(), maxMembers: parseInt(maxMembers), imageUrl, createdAt: Date.now() }
  saveList(KEYS.clubs, [...clubs, club])
  fsWriteClub(club)
  return club
}
export function updateClub(id, updates) {
  const club = getClubs().find(c => c.id === id)
  if (!club) return
  saveList(KEYS.clubs, getClubs().map(c => c.id === id ? { ...c, ...updates } : c))
  fsUpdateClub(id, updates)
  // Also update clubs_by_code if name or imageUrl changed
  const updated = { ...club, ...updates }
  fsWriteClub(updated)
}

// ── Members ────────────────────────────────────────────────────────────────
export function getMembers() { return getList(KEYS.members) }
export function getMembersByClub(clubId) { return getMembers().filter(m => m.clubId === clubId) }
export function getMemberById(id) { return getMembers().find(m => m.id === id) || null }

export function ensureMemberExists({ memberId, name, clubId, role }) {
  if (getMemberById(memberId)) return
  const member = { id: memberId, name, clubId, role, joinedAt: Date.now() }
  saveList(KEYS.members, [...getMembers(), member])
  fsWriteMember(member)
}
export function createMember({ name, clubId, role }) {
  const member = { id: uid(), name, clubId, role, joinedAt: Date.now() }
  saveList(KEYS.members, [...getMembers(), member])
  fsWriteMember(member)
  return member
}
export function updateMember(id, updates) {
  const member = getMembers().find(m => m.id === id)
  if (!member) return
  saveList(KEYS.members, getMembers().map(m => m.id === id ? { ...m, ...updates } : m))
  fsUpdateMember(member.clubId, id, updates)
}

export function updateMemberRole(memberId, clubId, newRole) {
  saveList(KEYS.members, getMembers().map(m => m.id === memberId ? { ...m, role: newRole } : m))
  fsUpdateMember(clubId, memberId, { role: newRole })
  const all = getMemberships()
  const ms = all.find(m => m.memberId === memberId && m.clubId === clubId)
  if (ms) {
    saveList(KEYS.memberships, all.map(m => m.memberId === memberId && m.clubId === clubId ? { ...m, role: newRole } : m))
    fsWriteMembership({ ...ms, role: newRole })
  }
}

// ── Books ──────────────────────────────────────────────────────────────────
export function getBooks() { return getList(KEYS.books) }
export function getBooksByClub(clubId) { return getBooks().filter(b => b.clubId === clubId) }
export function getBookById(id) { return getBooks().find(b => b.id === id) || null }
export function createBook({ clubId, title, author, coverUrl, startDate, endDate }) {
  const book = { id: uid(), clubId, title, author, coverUrl, startDate, endDate, status: 'reading', createdAt: Date.now() }
  saveList(KEYS.books, [...getBooks(), book])
  fsWriteBook(book)
  return book
}
export function updateBook(id, updates) {
  const book = getBooks().find(b => b.id === id)
  if (!book) return
  saveList(KEYS.books, getBooks().map(b => b.id === id ? { ...b, ...updates } : b))
  fsUpdateBook(book.clubId, id, updates)
}

// ── MemberBooks ────────────────────────────────────────────────────────────
export function getMemberBooks() { return getList(KEYS.memberBooks) }
export function getMemberBook(memberId, bookId) {
  return getMemberBooks().find(mb => mb.memberId === memberId && mb.bookId === bookId) || null
}
export function getMemberBooksByBook(bookId) { return getMemberBooks().filter(mb => mb.bookId === bookId) }
export function upsertMemberBook({ memberId, bookId, clubId, read, rating, review }) {
  const all = getMemberBooks()
  const idx = all.findIndex(mb => mb.memberId === memberId && mb.bookId === bookId)
  const updated = { memberId, bookId, clubId: clubId || '', read: read ?? false, rating: rating ?? null, review: review ?? '' }
  if (idx >= 0) {
    const next = [...all]; next[idx] = { ...all[idx], ...updated }; saveList(KEYS.memberBooks, next)
  } else {
    saveList(KEYS.memberBooks, [...all, updated])
  }
  if (clubId) fsWriteMemberBook(clubId, updated)
}

// ── Meetings ───────────────────────────────────────────────────────────────
export function getMeetings() { return getList(KEYS.meetings) }
export function getMeetingsByClub(clubId) { return getMeetings().filter(m => m.clubId === clubId) }
export function getMeetingById(id) { return getMeetings().find(m => m.id === id) || null }
export function createMeeting({ clubId, name, dates, startHour, endHour }) {
  const meeting = { id: uid(), clubId, name, dates, startHour, endHour, status: 'open', confirmedSlot: null, createdAt: Date.now() }
  saveList(KEYS.meetings, [...getMeetings(), meeting])
  fsWriteMeeting(meeting)
  return meeting
}
export function updateMeeting(id, updates) {
  const meeting = getMeetings().find(m => m.id === id)
  if (!meeting) return
  saveList(KEYS.meetings, getMeetings().map(m => m.id === id ? { ...m, ...updates } : m))
  fsUpdateMeeting(meeting.clubId, id, updates)
}

// ── Meeting Responses ──────────────────────────────────────────────────────
export function getMeetingResponses() { return getList(KEYS.meetingResponses) }
export function getMeetingResponsesByMeeting(meetingId) { return getMeetingResponses().filter(r => r.meetingId === meetingId) }
export function getMeetingResponse(memberId, meetingId) {
  return getMeetingResponses().find(r => r.memberId === memberId && r.meetingId === meetingId) || null
}
export function upsertMeetingResponse({ memberId, meetingId, clubId, availability }) {
  const all = getMeetingResponses()
  const idx = all.findIndex(r => r.memberId === memberId && r.meetingId === meetingId)
  const updated = { memberId, meetingId, clubId: clubId || '', availability }
  if (idx >= 0) { const next = [...all]; next[idx] = updated; saveList(KEYS.meetingResponses, next) }
  else saveList(KEYS.meetingResponses, [...all, updated])
  if (clubId) fsWriteMeetingResponse(clubId, updated)
}

// ── Notices ────────────────────────────────────────────────────────────────
export function getNotices() { return getList(KEYS.notices) }
export function getNoticesByClub(clubId) { return getNotices().filter(n => n.clubId === clubId).sort((a, b) => b.createdAt - a.createdAt) }
export function getNoticeById(id) { return getNotices().find(n => n.id === id) || null }
export function createNotice({ clubId, title, content, authorId, isNotice = false }) {
  const notice = { id: uid(), clubId, title, content, authorId, isNotice, createdAt: Date.now() }
  saveList(KEYS.notices, [...getNotices(), notice])
  fsWriteNotice(notice)
  return notice
}
export function deleteNotice(id) {
  const notice = getNotices().find(n => n.id === id)
  saveList(KEYS.notices, getNotices().filter(n => n.id !== id))
  saveList(KEYS.comments, getComments().filter(c => c.postId !== id))
  if (notice) fsDeleteNotice(notice.clubId, id)
}

// ── Comments ───────────────────────────────────────────────────────────────
export function getComments() { return getList(KEYS.comments) }
export function getCommentsByPost(postId) { return getComments().filter(c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt) }
export function createComment({ postId, parentId = null, authorId, content, clubId }) {
  const comment = { id: uid(), postId, parentId, authorId, content, clubId: clubId || '', createdAt: Date.now() }
  saveList(KEYS.comments, [...getComments(), comment])
  if (clubId) fsWriteComment(clubId, comment)
  return comment
}
export function deleteComment(id) {
  const all = getComments()
  const toDelete = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    all.forEach(c => { if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) { toDelete.add(c.id); changed = true } })
  }
  const deletedIds = [...toDelete]
  const clubId = all.find(c => c.id === id)?.clubId
  saveList(KEYS.comments, all.filter(c => !toDelete.has(c.id)))
  if (clubId) fsDeleteComments(clubId, deletedIds)
}

// ── Vote Rounds ────────────────────────────────────────────────────────────
export function getVoteRounds() { return getList(KEYS.voteRounds) }
export function getVoteRoundsByClub(clubId) { return getVoteRounds().filter(r => r.clubId === clubId).sort((a, b) => a.round - b.round) }
export function getVoteRoundById(id) { return getVoteRounds().find(r => r.id === id) || null }
export function createVoteRound({ clubId, round }) {
  const vr = { id: uid(), clubId, round, status: 'active', confirmedBookId: null, createdAt: Date.now() }
  saveList(KEYS.voteRounds, [...getVoteRounds(), vr])
  fsWriteVoteRound(vr)
  return vr
}
export function updateVoteRound(id, updates) {
  const round = getVoteRounds().find(r => r.id === id)
  if (!round) return
  saveList(KEYS.voteRounds, getVoteRounds().map(r => r.id === id ? { ...r, ...updates } : r))
  fsUpdateVoteRound(round.clubId, id, updates)
}
export function ensureActiveVoteRound(clubId) {
  const rounds = getVoteRoundsByClub(clubId)
  const active = rounds.find(r => r.status === 'active')
  if (active) return active
  return createVoteRound({ clubId, round: rounds.reduce((m, r) => Math.max(m, r.round), 0) + 1 })
}

// ── Vote Candidates ────────────────────────────────────────────────────────
export function getVoteCandidates() { return getList(KEYS.voteCandidates) }
export function getVoteCandidatesByRound(roundId) { return getVoteCandidates().filter(c => c.roundId === roundId) }
export function getVoteCandidateById(id) { return getVoteCandidates().find(c => c.id === id) || null }
export function createVoteCandidate({ roundId, clubId, title, author, reason, imageUrl, link, proposerId }) {
  const cand = { id: uid(), roundId, clubId, title, author, reason, imageUrl: imageUrl || '', link: link || '', proposerId, createdAt: Date.now() }
  saveList(KEYS.voteCandidates, [...getVoteCandidates(), cand])
  fsWriteVoteCandidate(cand)
  return cand
}
export function deleteVoteCandidate(id) {
  const cand = getVoteCandidates().find(c => c.id === id)
  saveList(KEYS.voteCandidates, getVoteCandidates().filter(c => c.id !== id))
  saveList(KEYS.voteHearts, getVoteHearts().filter(h => h.candidateId !== id))
  if (cand) fsDeleteVoteCandidate(cand.clubId, id)
}
export function moveCandidatesToRound(candidateIds, newRoundId) {
  saveList(KEYS.voteCandidates, getVoteCandidates().map(c => {
    if (!candidateIds.includes(c.id)) return c
    const updated = { ...c, roundId: newRoundId }
    fsUpdateVoteCandidate(c.clubId, c.id, { roundId: newRoundId })
    return updated
  }))
}

// ── Vote Hearts ────────────────────────────────────────────────────────────
export function getVoteHearts() { return getList(KEYS.voteHearts) }
export function getHeartsByCandidate(candidateId) { return getVoteHearts().filter(h => h.candidateId === candidateId) }
export function hasHeart(candidateId, memberId) { return getVoteHearts().some(h => h.candidateId === candidateId && h.memberId === memberId) }
export function toggleHeart({ candidateId, memberId, clubId }) {
  const hearts = getVoteHearts()
  const idx = hearts.findIndex(h => h.candidateId === candidateId && h.memberId === memberId)
  if (idx >= 0) {
    saveList(KEYS.voteHearts, hearts.filter((_, i) => i !== idx))
    if (clubId) fsToggleHeart(clubId, memberId, candidateId, false)
    return false
  } else {
    saveList(KEYS.voteHearts, [...hearts, { candidateId, memberId, clubId: clubId || '' }])
    if (clubId) fsToggleHeart(clubId, memberId, candidateId, true)
    return true
  }
}

// ── Minutes (localStorage only — base64 too large for Firestore) ───────────
export function getMinutes() { return getList(KEYS.minutes) }
export function getMinutesByBook(bookId) { return getMinutes().filter(m => m.bookId === bookId).sort((a, b) => b.uploadedAt - a.uploadedAt) }
export function addMinutes({ bookId, clubId, fileName, fileData, uploaderId }) {
  const m = { id: uid(), bookId, clubId, fileName, fileData, uploaderId, uploadedAt: Date.now() }
  saveList(KEYS.minutes, [...getMinutes(), m])
  return m
}

// ── Users ──────────────────────────────────────────────────────────────────
export function getUsers() { return getList(KEYS.users) }
export function createUser({ nickname, pin }) {
  const users = getUsers()
  const existing = users.find(u => u.nickname === nickname)
  if (existing) {
    saveList(KEYS.users, users.map(u => u.nickname === nickname ? { ...u, pin } : u))
    const updated = { ...existing, pin }
    fsWriteUser(updated)
    return existing
  }
  const user = { id: uid(), nickname, pin }
  saveList(KEYS.users, [...users, user])
  fsWriteUser(user)
  return user
}
export function verifyUser(nickname, pin) {
  return getUsers().find(u => u.nickname === nickname && u.pin === pin) || null
}
export function getUserByMemberId(memberId) {
  const m = getMemberships().find(m => m.memberId === memberId)
  if (m) return getUsers().find(u => u.id === m.userId) || null
  return getUsers().find(u => u.memberId === memberId) || null
}
export function updateUserProfile(userId, { nickname, pin }) {
  saveList(KEYS.users, getUsers().map(u => u.id === userId ? { ...u, nickname, pin } : u))
  const updated = getUsers().find(u => u.id === userId)
  if (updated) fsWriteUser(updated)
  getMemberships().filter(m => m.userId === userId).forEach(m => updateMember(m.memberId, { name: nickname }))
  const oldUser = getUsers().find(u => u.id === userId)
  if (oldUser?.memberId) updateMember(oldUser.memberId, { name: nickname })
  const cur = get(KEYS.currentUser)
  if (cur && (cur.userId === userId || cur.id === userId)) set(KEYS.currentUser, { ...cur, name: nickname })
}

// ── Memberships ────────────────────────────────────────────────────────────
export function getMemberships() { return getList(KEYS.memberships) }
export function getUserMemberships(userId) {
  if (!userId) return []
  const direct = getMemberships().filter(m => m.userId === userId)
  const user = getUsers().find(u => u.id === userId || u.memberId === userId)
  if (user?.clubId && user?.memberId && !direct.find(m => m.clubId === user.clubId)) {
    return [...direct, { userId, clubId: user.clubId, memberId: user.memberId, role: user.role || 'member' }]
  }
  const cur = get(KEYS.currentUser)
  if (cur && (cur.userId === userId || cur.memberId === userId) && cur.clubId && !direct.find(m => m.clubId === cur.clubId)) {
    return [...direct, { userId, clubId: cur.clubId, memberId: cur.memberId, role: cur.role || 'member' }]
  }
  return direct
}
export function addMembership({ userId, clubId, memberId, role }) {
  // 항상 bc_users의 실제 id 사용
  const allUsers = getList(KEYS.users)
  const actualUser = allUsers.find(u => u.id === userId || u.nickname === getCurrentUser()?.name)
  const realUserId = actualUser?.id || userId

  const all = getMemberships()
  if (all.find(m => m.userId === realUserId && m.clubId === clubId)) return
  const m = { userId: realUserId, clubId, memberId, role }
  saveList(KEYS.memberships, [...all, m])
  fsWriteMembership(m)

  // 해당 클럽 migration 재실행 허용 (올바른 userId로 다시 씀)
  localStorage.removeItem(`bc_migrated_${clubId}`)
}
