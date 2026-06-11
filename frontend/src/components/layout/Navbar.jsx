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
    <header className="sticky top-0 z-[100] bg-surface border-b border-border h-14 flex items-center">
      <div className="w-full px-5 flex items-center gap-4 justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <svg className="w-8 h-8" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill="#FF4500" />
            <path
              d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.95.68l-2.38-.5a.26.26 0 0 0-.31.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .66-1.13zm-9.83 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.56 2.71a3.54 3.54 0 0 1-2.4.73 3.54 3.54 0 0 1-2.4-.73.25.25 0 0 1 .35-.35 3.05 3.05 0 0 0 2.05.58 3.05 3.05 0 0 0 2.05-.58.25.25 0 0 1 .35.35zm-.16-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"
              fill="white"
            />
          </svg>
          <span className="text-lg font-bold text-text-primary tracking-tight">reddit</span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-[690px] relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="w-full h-10 pl-[38px] pr-4 bg-input-bg border border-transparent hover:border-brand hover:bg-surface rounded-full text-sm text-text-primary outline-none transition-colors duration-150 focus:bg-surface focus:border-brand placeholder:text-text-muted"
              placeholder="Search Reddit"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              autoComplete="off"
            />
          </form>

          {/* Search dropdown */}
          {showDropdown && (
            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface border border-border rounded-md shadow-modal z-[200] overflow-hidden">
              {searchLoading && (
                <div className="p-4 text-sm text-text-muted text-center">Searching...</div>
              )}
              {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="p-4 text-sm text-text-muted text-center">No communities found for "{searchQuery}"</div>
              )}
              {searchResults.map(sub => (
                <Link
                  key={sub.id || sub.name}
                  to={`/r/${sub.name}`}
                  className="flex items-center gap-3 p-3 transition-colors duration-150 hover:bg-hover"
                  onClick={() => { setSearchFocused(false); setSearchQuery('') }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-brand flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {sub.icon_url ? (
                      <img src={sub.icon_url} alt={sub.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{sub.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-text-primary truncate">r/{sub.name}</span>
                    {sub.member_count != null && (
                      <span className="text-xs text-text-muted">
                        {sub.member_count.toLocaleString()} members
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Auth section */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {isAuthenticated ? (
            <>
              <Link to="/submit" className="h-10 px-4 rounded-full text-sm font-bold inline-flex items-center transition-colors duration-150 border border-brand hover:bg-[#ff45001a] bg-transparent text-brand">
                + Create Post
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-2 px-2 py-1 rounded bg-transparent border border-transparent cursor-pointer text-text-primary transition-colors duration-150 hover:border-border hover:bg-hover">
                  <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{user?.username}</span>
                  <svg className="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <div className="hidden group-hover:block absolute top-[calc(100%+4px)] right-0 bg-surface border border-border rounded shadow-modal z-[200] overflow-hidden min-w-[180px]">
                  <Link to={`/u/${user?.username}`} className="block w-full px-4 py-2.5 text-sm text-text-primary text-left bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-hover">
                    👤 Profile
                  </Link>
                  <Link to="/subreddits/create" className="block w-full px-4 py-2.5 text-sm text-text-primary text-left bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-hover">
                    🏘️ Create Community
                  </Link>
                  <Link to="/settings" className="block w-full px-4 py-2.5 text-sm text-text-primary text-left bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-hover">
                    ⚙️ Settings
                  </Link>
                  <div className="h-[1px] bg-border my-1" />
                  <button className="block w-full px-4 py-2.5 text-sm text-danger text-left bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-hover" onClick={handleLogout}>
                    🚪 Log Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="h-10 px-4 rounded-full text-sm font-bold inline-flex items-center transition-colors duration-150 bg-surface text-text-primary hover:bg-hover">
                Log In
              </Link>
              <Link to="/register" className="h-10 px-4 rounded-full text-sm font-bold inline-flex items-center transition-colors duration-150 bg-brand text-white hover:bg-brand-hover">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
