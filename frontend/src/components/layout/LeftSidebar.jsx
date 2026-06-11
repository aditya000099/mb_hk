import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMySubreddits } from '../../api/subreddits'
import useAuthStore from '../../store/authStore'

// ─── Icons ──────────────────────────────────────────────────────────────────

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 3l9 7v11h-6v-7h-6v7H3V10l9-7z" />
  </svg>
)
const PopularIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M16 8l-8 8" /><path d="M16 8v6" /><path d="M16 8h-6" />
  </svg>
)
const NewsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
  </svg>
)
const ExploreIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
)
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" /><path d="M5 12h14" />
  </svg>
)
const ChevronIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
)
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)
const AdvertiseIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 4v16l-7-4-7 4V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const DevIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
)
const GameIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" />
    <circle cx="15.5" cy="11" r="0.5" fill="currentColor" /><circle cx="17.5" cy="13" r="0.5" fill="currentColor" />
    <rect x="2" y="6" width="20" height="12" rx="2" />
  </svg>
)

// ─── Components ──────────────────────────────────────────────────────────────

function NavItem({ to, icon, label, isActive, badge }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors group ${
        isActive ? 'bg-[#272729]' : 'hover:bg-[#272729]'
      }`}
    >
      <span className={`flex items-center justify-center shrink-0 ${isActive ? 'text-white' : 'text-[#d7dadc] group-hover:text-white'}`}>
        {icon}
      </span>
      <span className={`text-sm flex-1 ${isActive ? 'font-bold text-white' : 'text-[#d7dadc] group-hover:text-white'}`}>
        {label}
      </span>
      {badge && (
        <span className="text-[#FF4500] text-[10px] font-bold">{badge}</span>
      )}
    </Link>
  )
}

function Section({ title, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center justify-between w-full px-5 py-1.5 text-[10px] font-bold text-[#818384] hover:text-[#d7dadc] uppercase tracking-wider transition-colors"
      >
        <span>{title}</span>
        <ChevronIcon open={isOpen} />
      </button>
      {isOpen && <div className="mt-0.5 flex flex-col gap-0.5">{children}</div>}
    </div>
  )
}

function SubItem({ to, icon, label, badge }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-colors group hover:bg-[#272729]"
    >
      <span className="flex items-center justify-center shrink-0 text-[#d7dadc] group-hover:text-white">
        {icon}
      </span>
      <span className="text-sm text-[#d7dadc] group-hover:text-white flex-1">{label}</span>
      {badge && <span className="text-[#FF4500] text-[10px] font-bold">{badge}</span>}
    </Link>
  )
}

// Featured game "pill" card — matches the cyan card in the screenshot
function FeaturedGameCard() {
  return (
    <div className="mx-3 my-1 relative">
      <Link
        to="/r/ColorPuzzle"
        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-300 to-cyan-400 hover:opacity-90 transition-opacity"
      >
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6 p-1">
            <div className="bg-red-500 rounded-tl-full" />
            <div className="bg-blue-500 rounded-tr-full" />
            <div className="bg-yellow-400 rounded-bl-full" />
            <div className="bg-green-500 rounded-br-full" />
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-black leading-tight">Color Puzzle</span>
          <span className="text-xs text-black/80 font-medium leading-tight">Stack the colors</span>
          <span className="text-[10px] text-black/60 leading-tight">569K monthly players</span>
        </div>
      </Link>
      <span className="absolute -top-1.5 -right-1.5 bg-[#FF4500] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm leading-tight">
        NEW
      </span>
    </div>
  )
}

// Community avatar helper
function SubAvatar({ sub }) {
  return (
    <div className="w-5 h-5 rounded-full overflow-hidden bg-[#FF4500] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
      {sub.icon_url
        ? <img src={sub.icon_url} alt="" className="w-full h-full object-cover" />
        : sub.name[0]?.toUpperCase()
      }
    </div>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function LeftSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const { data: mySubreddits = [] } = useQuery({
    queryKey: ['my-subreddits'],
    queryFn: getMySubreddits,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })

  const path = location.pathname

  return (
    <aside className="hidden lg:flex flex-col w-[272px] shrink-0 border-r border-[#2A3236] h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto overflow-x-hidden pt-2 pb-8 scrollbar-thin">

      {/* ── Core nav ── */}
      <div className="flex flex-col gap-0.5">
        <NavItem to="/" isActive={path === '/'} label="Home" icon={<HomeIcon />} />
        <NavItem to="/r/popular" isActive={path === '/r/popular'} label="Popular" icon={<PopularIcon />} />
        <NavItem to="/r/news" isActive={path === '/r/news'} label="News" icon={<NewsIcon />} />
        <NavItem to="/search" isActive={path === '/search'} label="Explore" icon={<ExploreIcon />} />
        <NavItem to="/subreddits/create" isActive={path === '/subreddits/create'} label="Start a community" icon={<PlusIcon />} />
      </div>

      <div className="mx-4 my-3 border-t border-[#2A3236]" />

      {/* ── Games on Reddit ── */}
      <Section title="Games on Reddit">
        <FeaturedGameCard />
        <SubItem to="/r/commongames" icon={<span className="text-lg">🏠</span>} label="Common Grounds" />
        <SubItem to="/r/clashknight" icon={<span className="text-lg">🧟</span>} label="Clash Knight" />
        <SubItem to="/search?q=games" icon={<GameIcon />} label="Discover More" />
      </Section>

      <div className="mx-4 my-3 border-t border-[#2A3236]" />

      {/* ── Custom Feeds ── */}
      <Section title="Custom Feeds">
        <SubItem
          to="/submit"
          icon={<PlusIcon />}
          label="Create Custom Feed"
        />
      </Section>

      <div className="mx-4 my-3 border-t border-[#2A3236]" />

      {/* ── Communities ── */}
      <Section title="Communities">
        <SubItem
          to="/subreddits/create"
          icon={<SettingsIcon />}
          label="Manage Communities"
        />
        {/* User's joined communities */}
        {mySubreddits.length > 0 && (
          <>
            {mySubreddits.map(sub => (
              <Link
                key={sub.id}
                to={`/r/${sub.name}`}
                className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-colors group hover:bg-[#272729] ${
                  path === `/r/${sub.name}` ? 'bg-[#272729]' : ''
                }`}
              >
                <SubAvatar sub={sub} />
                <span className="text-sm text-[#d7dadc] group-hover:text-white truncate">
                  r/{sub.name}
                </span>
              </Link>
            ))}
            {/* See all if many */}
            {mySubreddits.length >= 10 && (
              <button
                className="flex items-center gap-3 px-4 py-2 mx-2 text-sm text-[#FF4500] hover:text-[#e03d00] font-bold transition-colors"
                onClick={() => navigate('/settings')}
              >
                See all
              </button>
            )}
          </>
        )}
        {!isAuthenticated && (
          <p className="px-5 py-2 text-xs text-[#82959b]">
            <Link to="/login" className="text-[#FF4500] hover:underline">Log in</Link> to see your communities
          </p>
        )}
        {isAuthenticated && mySubreddits.length === 0 && (
          <p className="px-5 py-2 text-xs text-[#82959b]">
            No communities yet.{' '}
            <Link to="/r/popular" className="text-[#FF4500] hover:underline">Explore</Link>
          </p>
        )}
      </Section>

      <div className="mx-4 my-3 border-t border-[#2A3236]" />

      {/* ── Resources ── */}
      <Section title="Resources">
        <SubItem to="/settings" icon={<InfoIcon />} label="About Reddit" />
        <SubItem to="/submit" icon={<AdvertiseIcon />} label="Advertise" />
        <SubItem to="/settings" icon={<DevIcon />} label="Developer Platform" />
      </Section>

      {/* ── Footer links ── */}
      <div className="px-5 pt-4 mt-2 flex flex-wrap gap-x-2 gap-y-1">
        {['Help', 'About', 'Careers', 'Press', 'Blog', 'Rules', 'Privacy', 'Terms'].map(l => (
          <span key={l} className="text-[10px] text-[#818384] hover:text-[#d7dadc] cursor-pointer transition-colors">
            {l}
          </span>
        ))}
        <span className="text-[10px] text-[#818384] w-full mt-1">Reddit Inc © 2025. All rights reserved.</span>
      </div>
    </aside>
  )
}
