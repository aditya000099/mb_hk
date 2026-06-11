import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { logout as logoutApi } from '../../api/auth'
import { searchSubreddits } from '../../api/subreddits'

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    searchSubreddits(debouncedQuery)
      .then(data => {
        setSearchResults(Array.isArray(data) ? data.slice(0, 8) : [])
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false))
  }, [debouncedQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    try {
      await logoutApi()
    } catch {
      // even if API fails, clear local state
    }
    logout()
    navigate('/login')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchFocused(false)
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

        {/* Search bar wrapper with gradient border */}
        <div className="flex-1 max-w-[600px] relative" ref={searchRef}>
          <div className="relative rounded-full p-[1px] bg-gradient-to-r from-[#FF4500] to-[#FFA500]">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#0B1416] rounded-full h-10 w-full overflow-hidden">
              {/* Snoo Icon */}
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

              {/* Divider and Ask button */}
              <div className="flex items-center pr-1">
                <div className="w-[1px] h-5 bg-[#2A3236] mx-2"></div>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-sm font-bold text-white cursor-pointer">
                  <svg className="w-5 h-5 text-[#FF4500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
                  </svg>
                  Ask
                </button>
              </div>
            </form>
          </div>

          {/* Search dropdown */}
          {showDropdown && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0f1113] border border-[#2A3236] rounded-lg shadow-modal z-[200] overflow-hidden">
              {searchLoading && (
                <div className="p-4 text-sm text-[#82959b] text-center">Searching...</div>
              )}
              {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="p-4 text-sm text-[#82959b] text-center">No communities found for "{searchQuery}"</div>
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
                      <span className="text-xs text-[#82959b]">
                        {sub.member_count.toLocaleString()} members
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Auth section / Icons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {isAuthenticated ? (
            <>
              {/* Chat */}
              <button className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer text-white">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <circle cx="8" cy="10" r="1" fill="currentColor" />
                  <circle cx="12" cy="10" r="1" fill="currentColor" />
                  <circle cx="16" cy="10" r="1" fill="currentColor" />
                </svg>
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
              <button className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer text-white">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

              {/* Avatar */}
              <div className="relative group ml-1">
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A282D] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-transparent group-hover:border-[#2A3236]">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 mt-2" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="10" fill="#FF4500" />
                      <path
                        d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.95.68l-2.38-.5a.26.26 0 0 0-.31.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .66-1.13zm-9.83 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.56 2.71a3.54 3.54 0 0 1-2.4.73 3.54 3.54 0 0 1-2.4-.73.25.25 0 0 1 .35-.35 3.05 3.05 0 0 0 2.05.58 3.05 3.05 0 0 0 2.05-.58.25.25 0 0 1 .35.35zm-.16-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"
                        fill="white"
                      />
                    </svg>
                  )}
                </button>
                <div className="hidden group-hover:block absolute top-[calc(100%+8px)] right-0 bg-[#0f1113] border border-[#2A3236] rounded-md shadow-modal z-[200] overflow-hidden min-w-[180px]">
                  <Link to={`/u/${user?.username}`} className="block w-full px-4 py-2.5 text-sm text-white text-left bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-[rgba(255,255,255,0.1)]">
                    👤 Profile
                  </Link>
                  <Link to="/subreddits/create" className="block w-full px-4 py-2.5 text-sm text-white text-left bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-[rgba(255,255,255,0.1)]">
                    🏘️ Create Community
                  </Link>
                  <Link to="/settings" className="block w-full px-4 py-2.5 text-sm text-white text-left bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-[rgba(255,255,255,0.1)]">
                    ⚙️ Settings
                  </Link>
                  <div className="h-[1px] bg-[#2A3236] my-1" />
                  <button className="block w-full px-4 py-2.5 text-sm text-[#d93025] text-left bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-[rgba(255,255,255,0.1)]" onClick={handleLogout}>
                    🚪 Log Out
                  </button>
                </div>
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
    </header>
  )
}
