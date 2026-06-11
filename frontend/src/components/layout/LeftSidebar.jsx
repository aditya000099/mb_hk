import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPopularSubreddits } from '../../api/subreddits'

function NavItem({ to, icon, label, isActive, isPill, isNew, subtitle, subtext }) {
  if (isPill) {
    return (
      <Link to={to} className="relative block mx-3 my-1">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-300 to-cyan-400 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 p-1">
              <div className="bg-red-500 rounded-tl-full"></div>
              <div className="bg-blue-500 rounded-tr-full"></div>
              <div className="bg-yellow-500 rounded-bl-full"></div>
              <div className="bg-green-500 rounded-br-full"></div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-black">{label}</span>
            <span className="text-xs text-black/80 font-medium">{subtitle}</span>
            <span className="text-[10px] text-black/60">{subtext}</span>
          </div>
        </div>
        {isNew && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#FF4500] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            NEW
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors group ${isActive ? 'bg-[#272729]' : 'hover:bg-[#272729]'}`}
    >
      <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${isActive ? 'text-white' : 'text-[#d7dadc] group-hover:text-white'}`}>
        {icon}
      </div>
      <span className={`text-sm flex-1 ${isActive ? 'font-bold text-white' : 'text-[#d7dadc] group-hover:text-white'}`}>
        {label}
      </span>
      {isNew && (
        <span className="text-[#FF4500] text-[10px] font-bold">NEW</span>
      )}
    </Link>
  )
}

function Section({ title, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-5 py-2 text-[10px] font-bold text-[#818384] hover:text-[#d7dadc] uppercase tracking-wider transition-colors cursor-pointer"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-1 flex flex-col gap-0.5">
          {children}
        </div>
      )}
    </div>
  )
}

export default function LeftSidebar() {
  const location = useLocation()

  const { data: popularSubreddits } = useQuery({
    queryKey: ['popular-subreddits'],
    queryFn: getPopularSubreddits,
    staleTime: 1000 * 60 * 10,
  })

  return (
    <aside className="hidden lg:flex flex-col w-[272px] shrink-0 border-r border-[#2A3236] h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto overflow-x-hidden pt-3 pb-6">
      <div className="flex flex-col gap-0.5">
        <NavItem
          to="/"
          isActive={location.pathname === '/'}
          label="Home"
          icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 7v11h-6v-7h-6v7H3V10l9-7z" /></svg>}
        />
        <NavItem
          to="/r/popular"
          isActive={location.pathname === '/r/popular'}
          label="Popular"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8l-8 8" /><path d="M16 8v6" /><path d="M16 8h-6" /></svg>}
        />
        <NavItem
          to="/subreddits/create"
          isActive={location.pathname === '/subreddits/create'}
          label="Start a community"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>}
        />
      </div>

      <div className="mx-4 my-2 border-t border-[#2A3236]"></div>

      {popularSubreddits && popularSubreddits.length > 0 && (
        <Section title="TOP COMMUNITIES">
          {popularSubreddits.slice(0, 10).map((sub) => (
            <NavItem
              key={sub.id}
              to={`/r/${sub.name}`}
              label={`r/${sub.name}`}
              icon={
                <div className="w-6 h-6 rounded-full overflow-hidden bg-[#FF4500] flex justify-center items-center text-white text-xs font-bold">
                  {sub.icon_url ? <img src={sub.icon_url} alt="" className="w-full h-full object-cover" /> : sub.name[0]?.toUpperCase()}
                </div>
              }
            />
          ))}
        </Section>
      )}
    </aside>
  )
}
