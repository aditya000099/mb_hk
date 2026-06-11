import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { logout as logoutApi } from '../../api/auth'
import { searchSubreddits } from '../../api/subreddits'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUnreadCount, getPendingRequests, toggleFriendRequest } from '../../api/chat'
import ChatWidget from '../chat/ChatWidget'
import useChatStore from '../../store/chatStore'

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// Reusable profile menu row
function ProfileMenuItem({ icon, label, subtitle, subtitleColor = 'text-[#82959b]', to, onClick }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
      onClick={onClick}
    >
      <span className="text-[#d7dadc] shrink-0">{icon}</span>
      <span className="flex flex-col">
        <span className="text-sm text-[#d7dadc] leading-tight">{label}</span>
        {subtitle && <span className={`text-xs leading-tight mt-0.5 ${subtitleColor}`}>{subtitle}</span>}
      </span>
    </Link>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  
  const { isOpen: chatOpen, openChat, closeChat } = useChatStore()
  
  const searchRef = useRef(null)

  const queryClient = useQueryClient()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 10000,
  })

  // Pending friend requests — powers the notification bell badge
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: getPendingRequests,
    enabled: isAuthenticated,
    refetchInterval: 15000,
  })

  const totalNotifCount = pendingRequests.length

  const acceptFriendMutation = useMutation({
    mutationFn: (senderId) => toggleFriendRequest(senderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    }
  })

  // Notifications dropdown
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef(null)

  // Profile dropdown
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef(null)

  // Display mode — persisted to localStorage, applied as class on <html>
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved !== 'light' : true
  })

  // Apply / remove 'light' class on <html> whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch subreddit suggestions when typing
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    searchSubreddits(debouncedQuery)
      .then(data => setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false))
  }, [debouncedQuery])

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    try { await logoutApi() } catch { /* clear local state anyway */ }
    logout()
    navigate('/login')
  }

  // Submit search → go to SearchPage
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
      setSearchFocused(false)
      setSearchQuery('')
    }
  }

  // Ask button → submit search or focus input
  const handleAsk = () => {
    const q = searchQuery.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
      setSearchFocused(false)
      setSearchQuery('')
    } else {
      searchRef.current?.querySelector('input')?.focus()
    }
  }

  const showDropdown = searchFocused && (searchResults.length > 0 || searchLoading || searchQuery.length >= 2)

  return (
    <header className="sticky top-0 z-[100] bg-[#0B1416] border-b border-[#2A3236] h-14 flex items-center">
      <div className="w-full px-5 flex items-center gap-80 justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <svg className="w-8 h-8" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill="#FF4500" />
            <path
              d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.95.68l-2.38-.5a.26.26 0 0 0-.31.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .66-1.13zm-9.83 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.56 2.71a3.54 3.54 0 0 1-2.4.73 3.54 3.54 0 0 1-2.4-.73.25.25 0 0 1 .35-.35 3.05 3.05 0 0 0 2.05.58 3.05 3.05 0 0 0 2.05-.58.25.25 0 0 1 .35.35zm-.16-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"
              fill="white"
            />
          </svg>
          <span className="text-xl font-bold text-white tracking-tight">reddit</span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-[600px] relative" ref={searchRef}>
          <div className="relative rounded-full p-[1px] bg-gradient-to-r from-[#FF4500] to-[#FFA500]">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#0B1416] rounded-full h-10 w-full overflow-hidden">
              {/* Snoo icon */}
              <div className="pl-3 pr-2 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="10" fill="#FF4500" />
                  <path
                    d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.95.68l-2.38-.5a.26.26 0 0 0-.31.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .66-1.13zm-9.83 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.56 2.71a3.54 3.54 0 0 1-2.4.73 3.54 3.54 0 0 1-2.4-.73.25.25 0 0 1 .35-.35 3.05 3.05 0 0 0 2.05.58 3.05 3.05 0 0 0 2.05-.58.25.25 0 0 1 .35.35zm-.16-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"
                    fill="white"
                  />
                </svg>
              </div>

              <input
                type="text"
                className="flex-1 h-full bg-transparent border-none text-sm text-white outline-none placeholder:text-[#82959b]"
                placeholder="Find anything"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                autoComplete="off"
              />

              {/* Divider + Ask button */}
              <div className="flex items-center pr-1">
                <div className="w-[1px] h-5 bg-[#2A3236] mx-2" />
                <button
                  type="button"
                  onClick={handleAsk}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-sm font-bold text-white cursor-pointer"
                >
                  <svg className="w-5 h-5 text-[#FF4500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
                  </svg>
                  Ask
                </button>
              </div>
            </form>
          </div>

          {/* Search suggestions dropdown */}
          {showDropdown && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0f1113] border border-[#2A3236] rounded-lg shadow-modal z-[200] overflow-hidden">
              {searchLoading && (
                <div className="p-4 text-sm text-[#82959b] text-center">Searching...</div>
              )}
              {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="p-4 text-sm text-[#82959b] text-center">
                  No communities found — press Enter to search all of Reddit
                </div>
              )}
              {searchResults.map(sub => (
                <Link
                  key={sub.id || sub.name}
                  to={`/r/${sub.name}`}
                  className="flex items-center gap-3 p-3 transition-colors duration-150 hover:bg-[rgba(255,255,255,0.1)]"
                  onClick={() => { setSearchFocused(false); setSearchQuery('') }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FF4500] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {sub.icon_url ? (
                      <img src={sub.icon_url} alt={sub.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{sub.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate">r/{sub.name}</span>
                    {sub.member_count != null && (
                      <span className="text-xs text-[#82959b]">{sub.member_count.toLocaleString()} members</span>
                    )}
                  </div>
                </Link>
              ))}
              {/* View all results link */}
              {searchQuery.trim().length >= 2 && (
                <button
                  className="w-full text-left px-3 py-3 text-sm text-[#FF4500] font-bold hover:bg-[rgba(255,255,255,0.05)] transition-colors border-t border-[#2A3236]"
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                    setSearchFocused(false)
                    setSearchQuery('')
                  }}
                >
                  Search for "{searchQuery.trim()}" →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {isAuthenticated ? (
            <>
              {/* Advertise / Create Post shortcut */}
              <Link
                to="/submit"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer text-white"
                title="Create a post"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <path d="M7 15V9l4 6V9" />
                  <path d="M14 9h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3V9z" />
                </svg>
              </Link>

              {/* Chat */}
              <button
                className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#2A3236] transition-colors cursor-pointer text-white border-none bg-transparent"
                onClick={() => chatOpen ? closeChat() : openChat()}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <circle cx="8" cy="10" r="1" fill="currentColor" />
                  <circle cx="12" cy="10" r="1" fill="currentColor" />
                  <circle cx="16" cy="10" r="1" fill="currentColor" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-[#FF4500] text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full border-2 border-[#0B1416]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Create */}
              <Link to="/submit" className="flex items-center gap-1.5 px-3 h-10 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                <span className="text-sm font-bold">Create</span>
              </Link>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer text-white"
                  title="Notifications"
                  onClick={() => setShowNotifications(p => !p)}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {totalNotifCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-[#FF4500] text-white text-[9px] font-bold px-1 rounded-full border-2 border-[#0B1416] animate-pulse">
                      {totalNotifCount > 9 ? '9+' : totalNotifCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute top-[calc(100%+8px)] right-0 w-[360px] bg-[#0f1113] border border-[#2A3236] rounded-xl shadow-modal z-[200] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A3236]">
                      <h3 className="text-sm font-bold text-[#d7dadc]">
                        Notifications
                        {totalNotifCount > 0 && (
                          <span className="ml-2 bg-[#FF4500] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {totalNotifCount}
                          </span>
                        )}
                      </h3>
                      <button
                        className="text-xs text-[#FF4500] font-bold hover:underline"
                        onClick={() => setShowNotifications(false)}
                      >
                        Close
                      </button>
                    </div>

                    {/* Friend Requests Section */}
                    {pendingRequests.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-[#1A282D] border-b border-[#2A3236]">
                          <span className="text-[10px] font-bold text-[#82959b] uppercase tracking-wider">Friend Requests</span>
                        </div>
                        {pendingRequests.map(req => (
                          <div key={req.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#2A3236] hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                            {/* Sender avatar */}
                            <div className="w-10 h-10 rounded-full bg-[#FF4500] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                              {req.friend_avatar_url
                                ? <img src={req.friend_avatar_url} alt="" className="w-full h-full object-cover" />
                                : req.friend_username?.[0]?.toUpperCase()
                              }
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#d7dadc] truncate">
                                {req.friend_display_name || req.friend_username}
                              </p>
                              <p className="text-xs text-[#82959b]">
                                u/{req.friend_username} · wants to be friends
                              </p>
                            </div>
                            {/* Accept / Decline */}
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                className="px-2.5 py-1 bg-[#FF4500] text-white text-xs font-bold rounded-full hover:bg-[#e03d00] transition-colors border-none cursor-pointer disabled:opacity-50"
                                onClick={() => acceptFriendMutation.mutate(req.user_id)}
                                disabled={acceptFriendMutation.isPending}
                              >
                                Accept
                              </button>
                              <button
                                className="px-2.5 py-1 bg-[#272729] text-[#d7dadc] text-xs font-bold rounded-full hover:bg-[#363638] transition-colors border-none cursor-pointer"
                                onClick={() => {
                                  // Decline = toggle again (removes pending request on sender side isn't possible from receiver)
                                  // We mark as accepted then immediately ignored; best UX is to just dismiss locally
                                  queryClient.setQueryData(['pendingRequests'], (old) =>
                                    (old || []).filter(r => r.id !== req.id)
                                  )
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty state — only if no pending requests */}
                    {pendingRequests.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-[#1A282D] flex items-center justify-center mb-3">
                          <svg className="w-7 h-7 text-[#82959b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-[#d7dadc] mb-1">You're all caught up!</p>
                        <p className="text-xs text-[#82959b] leading-relaxed">
                          Friend requests and notifications will appear here.
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-[#2A3236] px-4 py-2.5">
                      <Link
                        to="/messages"
                        className="text-xs text-[#FF4500] font-bold hover:underline"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all messages →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar + Profile Dropdown */}
              <div className="relative ml-1" ref={profileRef}>
                {/* Avatar button */}
                <button
                  className={`flex items-center justify-center w-8 h-8 rounded-full overflow-hidden cursor-pointer transition-all border-2 ${
                    showProfile ? 'border-[#FF4500]' : 'border-transparent hover:border-[#818384]'
                  }`}
                  onClick={() => setShowProfile(p => !p)}
                  title="Profile & settings"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-full h-full" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="10" fill="#FF4500" />
                      <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.95.68l-2.38-.5a.26.26 0 0 0-.31.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .66-1.13zm-9.83 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.56 2.71a3.54 3.54 0 0 1-2.4.73 3.54 3.54 0 0 1-2.4-.73.25.25 0 0 1 .35-.35 3.05 3.05 0 0 0 2.05.58 3.05 3.05 0 0 0 2.05-.58.25.25 0 0 1 .35.35zm-.16-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white" />
                    </svg>
                  )}
                </button>

                {/* Profile Dropdown Panel */}
                {showProfile && (
                  <div className="absolute top-[calc(100%+10px)] right-0 w-[260px] bg-[#1c1c1e] border border-[#2A3236] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-[300] overflow-hidden">

                    {/* ── View Profile ── */}
                    <Link
                      to={`/u/${user?.username}`}
                      className="flex items-center gap-3 px-4 py-4 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                      onClick={() => setShowProfile(false)}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-[#FF4500]">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-full h-full" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="10" fill="#FF4500" />
                            <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.95.68l-2.38-.5a.26.26 0 0 0-.31.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .66-1.13zm-9.83 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.56 2.71a3.54 3.54 0 0 1-2.4.73 3.54 3.54 0 0 1-2.4-.73.25.25 0 0 1 .35-.35 3.05 3.05 0 0 0 2.05.58 3.05 3.05 0 0 0 2.05-.58.25.25 0 0 1 .35.35zm-.16-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#d7dadc] leading-tight">View Profile</span>
                        <span className="text-xs text-[#82959b] leading-tight">u/{user?.username}</span>
                      </div>
                    </Link>

                    <div className="h-[1px] bg-[#2A3236]" />

                    {/* ── Edit Avatar ── */}
                    <ProfileMenuItem
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H5v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10h1.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
                        </svg>
                      }
                      label="Edit Avatar"
                      to={`/u/${user?.username}`}
                      onClick={() => setShowProfile(false)}
                    />

                    {/* ── Drafts ── */}
                    <ProfileMenuItem
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      }
                      label="Drafts"
                      to="/submit"
                      onClick={() => setShowProfile(false)}
                    />

                    <div className="h-[1px] bg-[#2A3236]" />

                    {/* ── Achievements ── */}
                    <div className="bg-[rgba(255,255,255,0.04)]">
                      <ProfileMenuItem
                        icon={
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <circle cx="12" cy="8" r="6" />
                            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                          </svg>
                        }
                        label="Achievements"
                        subtitle="3 unlocked"
                        subtitleColor="text-[#FF4500]"
                        to={`/u/${user?.username}`}
                        onClick={() => setShowProfile(false)}
                      />
                    </div>

                    <div className="h-[1px] bg-[#2A3236]" />

                    {/* ── Earn ── */}
                    <ProfileMenuItem
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v12" />
                          <path d="M9 9h4.5a2.5 2.5 0 0 1 0 5H9v3" />
                        </svg>
                      }
                      label="Earn"
                      subtitle="Earn cash on Reddit"
                      to="/r/popular"
                      onClick={() => setShowProfile(false)}
                    />

                    {/* ── Premium ── */}
                    <ProfileMenuItem
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      }
                      label="Premium"
                      to="/r/popular"
                      onClick={() => setShowProfile(false)}
                    />

                    {/* ── Display Mode ── */}
                    <button
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                      onClick={() => setDarkMode(p => !p)}
                    >
                      <span className="text-[#d7dadc] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <rect x="1" y="5" width="22" height="14" rx="7" />
                          <circle cx={darkMode ? '16' : '8'} cy="12" r="4" fill="currentColor" className="transition-all duration-200" />
                        </svg>
                      </span>
                      <span className="text-sm text-[#d7dadc] text-left flex-1">Display Mode</span>
                      <span className="text-[10px] text-[#82959b] font-medium">{darkMode ? 'Dark' : 'Light'}</span>
                    </button>

                    <div className="h-[1px] bg-[#2A3236]" />

                    {/* ── Log Out ── */}
                    <button
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                      onClick={() => { setShowProfile(false); handleLogout() }}
                    >
                      <span className="text-[#d7dadc] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </span>
                      <span className="text-sm text-[#d7dadc] text-left">Log Out</span>
                    </button>

                    <div className="h-[1px] bg-[#2A3236]" />

                    {/* ── Advertise ── */}
                    <ProfileMenuItem
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M5 3l14 9-14 9V3z" />
                          <circle cx="19" cy="5" r="2" />
                        </svg>
                      }
                      label="Advertise on Reddit"
                      to="/submit"
                      onClick={() => setShowProfile(false)}
                    />

                    {/* ── Try Reddit Pro ── */}
                    <Link
                      to="/r/popular"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                      onClick={() => setShowProfile(false)}
                    >
                      <span className="text-[#d7dadc] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </span>
                      <span className="text-sm text-[#d7dadc] flex-1">Try Reddit Pro</span>
                      <span className="text-[10px] font-bold bg-[#FF4500] text-white px-1.5 py-0.5 rounded-sm">BETA</span>
                    </Link>

                    <div className="h-[1px] bg-[#2A3236]" />

                    {/* ── Settings ── */}
                    <ProfileMenuItem
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      }
                      label="Settings"
                      to="/settings"
                      onClick={() => setShowProfile(false)}
                    />

                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="h-10 px-4 rounded-full text-sm font-bold inline-flex items-center transition-colors duration-150 bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.2)]">
                Log In
              </Link>
              <Link to="/register" className="h-10 px-4 rounded-full text-sm font-bold inline-flex items-center transition-colors duration-150 bg-[#FF4500] text-white hover:bg-[#e03d00]">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
      {isAuthenticated && <ChatWidget isOpen={chatOpen} onClose={() => closeChat()} />}
    </header>
  )
}
