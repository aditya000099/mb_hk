import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

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
  
  return (
    <aside className="hidden lg:flex flex-col w-[272px] shrink-0 border-r border-[#2A3236] h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto overflow-x-hidden pt-3 pb-6">
      <div className="flex flex-col gap-0.5">
        <NavItem 
          to="/" 
          isActive={location.pathname === '/'} 
          label="Home" 
          icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 7v11h-6v-7h-6v7H3V10l9-7z"/></svg>} 
        />
        <NavItem 
          to="/r/popular" 
          isActive={location.pathname === '/r/popular'} 
          label="Popular" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8l-8 8"/><path d="M16 8v6"/><path d="M16 8h-6"/></svg>} 
        />
        <NavItem 
          to="/news" 
          isActive={location.pathname === '/news'} 
          label="News" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h4"/></svg>} 
        />
        <NavItem 
          to="/explore" 
          isActive={location.pathname === '/explore'} 
          label="Explore" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><path d="M12 2v8"/><path d="M22 12h-8"/><path d="M12 22v-8"/><path d="M2 12h8"/></svg>} 
        />
        <NavItem 
          to="/subreddits/create" 
          isActive={location.pathname === '/subreddits/create'} 
          label="Start a community" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>} 
        />
      </div>

      <div className="mx-4 my-2 border-t border-[#2A3236]"></div>

      <Section title="GAMES ON REDDIT">
        <NavItem 
          to="/games/color-puzzle"
          isPill
          isNew
          label="Color Puzzle"
          subtitle="Stack the colors"
          subtext="561K monthly players"
        />
        <NavItem 
          to="/games/common-grounds" 
          label="Common Grounds" 
          icon={
            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden">
              <span className="text-xl">🏠</span>
            </div>
          } 
        />
        <NavItem 
          to="/games/clash-knight" 
          label="Clash Knight" 
          icon={
            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden">
              <span className="text-xl">🥷</span>
            </div>
          } 
        />
        <NavItem 
          to="/games" 
          label="Discover More" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>} 
        />
      </Section>

      <div className="mx-4 my-2 border-t border-[#2A3236]"></div>

      <Section title="REDDIT PRO">
        <NavItem 
          to="/pro/dashboard" 
          label="Dashboard" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>} 
        />
        <NavItem 
          to="/pro/performance" 
          label="Performance" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} 
        />
        <NavItem 
          to="/pro/trends" 
          label="Trends" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} 
        />
        <NavItem 
          to="/pro/links" 
          label="Links" 
          isNew
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} 
        />
      </Section>

      <div className="mx-4 my-2 border-t border-[#2A3236]"></div>

      <Section title="MODERATION" defaultOpen={false}>
        <NavItem 
          to="/mod" 
          label="Mod Queue" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} 
        />
      </Section>
    </aside>
  )
}
