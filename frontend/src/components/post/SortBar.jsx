import { useState, useRef, useEffect } from 'react'
const SORT_OPTIONS = [
  { value: 'best', label: 'Best', icon: '⭐' },
  { value: 'hot', label: 'Hot', icon: '🔥' },
  { value: 'new', label: 'New', icon: '✨' },
  { value: 'top', label: 'Top', icon: '📈' },
  { value: 'rising', label: 'Rising', icon: '🚀' },
]

const TIME_FILTERS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
]

export default function SortBar({ sort, setSort, timeFilter, setTimeFilter }) {
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowTimeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSort = (value) => {
    setSort(value)
    if (value !== 'top') setShowTimeDropdown(false)
    if (value === 'top' && setTimeFilter) {
      setShowTimeDropdown(prev => !prev)
    }
  }

  const currentTimeLabel = TIME_FILTERS.find(t => t.value === (timeFilter || 'all'))?.label || 'All Time'

  return (
    <div className="flex items-center gap-1.5 bg-surface border border-border rounded-sm px-3 py-2.5 mb-4">
      {SORT_OPTIONS.map(opt => (
        <div key={opt.value} className="relative" ref={opt.value === 'top' ? dropdownRef : null}>
          <button
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-transparent border-none text-sm font-bold cursor-pointer transition-colors duration-100 ${sort === opt.value ? 'text-[#0079D3] bg-[#f6f7f8]' : 'text-text-muted hover:bg-hover hover:text-text-primary'}`}
            onClick={() => handleSort(opt.value)}
          >
            <span className="text-base">{opt.icon}</span>
            {opt.label}
            {opt.value === 'top' && sort === 'top' && (
              <span className="text-xs font-normal text-inherit ml-0.5">· {currentTimeLabel}</span>
            )}
          </button>
          {opt.value === 'top' && showTimeDropdown && (
            <div className="absolute top-[calc(100%+4px)] left-0 bg-surface border border-border rounded min-w-[140px] shadow-modal z-[100] overflow-hidden">
              {TIME_FILTERS.map(tf => (
                <button
                  key={tf.value}
                  className={`block w-full py-2.5 px-4 text-sm bg-transparent border-none cursor-pointer text-left transition-colors duration-100 hover:bg-hover ${(timeFilter || 'all') === tf.value ? 'text-brand font-bold' : 'text-text-primary'
                    }`}
                  onClick={() => {
                    if (setTimeFilter) setTimeFilter(tf.value)
                    setShowTimeDropdown(false)
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
