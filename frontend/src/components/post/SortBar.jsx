import { useState, useRef, useEffect } from 'react'

const SORT_OPTIONS = [
  { value: 'best', label: 'Best' },
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
  { value: 'rising', label: 'Rising' },
]

const TIME_FILTERS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
]

export default function SortBar({ sort, setSort, timeFilter, setTimeFilter }) {
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  
  const sortRef = useRef(null)
  const timeRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortDropdown(false)
      }
      if (timeRef.current && !timeRef.current.contains(e.target)) {
        setShowTimeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Best'
  const currentTimeLabel = TIME_FILTERS.find(t => t.value === (timeFilter || 'all'))?.label || 'All Time'

  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Sort Dropdown */}
      <div className="relative" ref={sortRef}>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#272729] hover:bg-[#343435] text-[#d7dadc] text-sm font-bold transition-colors"
          onClick={() => setShowSortDropdown(!showSortDropdown)}
        >
          {currentSortLabel}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {showSortDropdown && (
          <div className="absolute top-[calc(100%+8px)] left-0 min-w-[160px] bg-[#0f1113] border border-[#2A3236] rounded-xl shadow-modal z-[100] overflow-hidden py-2">
            <div className="px-4 py-2 text-[13px] font-bold text-[#82959b]">Sort by</div>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  sort === opt.value ? 'bg-[#272729] text-white font-bold' : 'text-[#d7dadc] hover:bg-[#1A282D]'
                }`}
                onClick={() => {
                  setSort(opt.value)
                  setShowSortDropdown(false)
                  if (opt.value === 'top' && !timeFilter) {
                    setTimeFilter('all')
                  }
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time Dropdown (only visible when sorting by Top) */}
      {sort === 'top' && setTimeFilter && (
        <div className="relative" ref={timeRef}>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#272729] hover:bg-[#343435] text-[#d7dadc] text-sm font-bold transition-colors"
            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
          >
            {currentTimeLabel}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {showTimeDropdown && (
            <div className="absolute top-[calc(100%+8px)] left-0 min-w-[160px] bg-[#0f1113] border border-[#2A3236] rounded-xl shadow-modal z-[100] overflow-hidden py-2">
              <div className="px-4 py-2 text-[13px] font-bold text-[#82959b]">Time</div>
              {TIME_FILTERS.map(tf => (
                <button
                  key={tf.value}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    (timeFilter || 'all') === tf.value ? 'bg-[#272729] text-white font-bold' : 'text-[#d7dadc] hover:bg-[#1A282D]'
                  }`}
                  onClick={() => {
                    setTimeFilter(tf.value)
                    setShowTimeDropdown(false)
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Toggle Icon (Placeholder to match image) */}
      <button className="flex items-center gap-1 text-[#82959b] hover:text-[#d7dadc] transition-colors ml-1 cursor-pointer bg-transparent border-none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
  )
}
