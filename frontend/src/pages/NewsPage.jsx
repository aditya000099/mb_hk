import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'

// ─── Hacker News API (free, no key needed) ────────────────────────────────────
const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

const fetchIds = (type) =>
  fetch(`${HN_BASE}/${type}.json`).then(r => r.json())

const fetchItem = (id) =>
  fetch(`${HN_BASE}/item/${id}.json`).then(r => r.json())

// Fetch top N stories in parallel
const fetchStories = async (type, count = 30) => {
  const ids = await fetchIds(type)
  const top = ids.slice(0, count)
  const stories = await Promise.all(top.map(fetchItem))
  return stories.filter(Boolean)
}

// Extract domain from URL
const getDomain = (url) => {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return 'news.ycombinator.com' }
}

// Relative time
const timeAgo = (unixTs) => {
  const diff = Math.floor(Date.now() / 1000) - unixTs
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Category badge colour
const CATEGORY_COLORS = {
  'self': 'bg-[#2a3c4a] text-[#4fbddb]',
  'job': 'bg-[#2a3a2a] text-[#46d160]',
  'ask': 'bg-[#3a2a2a] text-[#FF6534]',
  'show': 'bg-[#3a2a3a] text-[#c36dff]',
  'news': 'bg-[#2a3236] text-[#82959b]',
}

const getCategory = (story) => {
  if (!story.url) return 'self'
  if (story.title?.toLowerCase().startsWith('ask hn')) return 'ask'
  if (story.title?.toLowerCase().startsWith('show hn')) return 'show'
  if (story.type === 'job') return 'job'
  return 'news'
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'topstories', label: '🔥 Top', endpoint: 'topstories' },
  { id: 'newstories', label: '✨ New', endpoint: 'newstories' },
  { id: 'beststories', label: '⭐ Best', endpoint: 'beststories' },
  { id: 'askstories', label: '🙋 Ask HN', endpoint: 'askstories' },
  { id: 'showstories', label: '🚀 Show HN', endpoint: 'showstories' },
]

// ─── Story Card ───────────────────────────────────────────────────────────────
function StoryCard({ story, rank }) {
  const [voted, setVoted] = useState(false)
  const [score, setScore] = useState(story.score || 0)
  const category = getCategory(story)
  const domain = story.url ? getDomain(story.url) : null

  const handleVote = (e) => {
    e.preventDefault()
    setVoted(v => !v)
    setScore(s => voted ? s - 1 : s + 1)
  }

  const handleTitleClick = () => {
    if (story.url) window.open(story.url, '_blank', 'noopener,noreferrer')
    else window.open(`https://news.ycombinator.com/item?id=${story.id}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex gap-0 bg-[#0f1113] border border-[#2A3236] rounded-xl mb-2.5 overflow-hidden hover:border-[#82959b] transition-colors group">
      {/* Vote column */}
      <div className="flex flex-col items-center pt-3 pb-3 px-3 gap-1 bg-[#0a0c0e] shrink-0 w-12 rounded-l-xl">
        <button
          onClick={handleVote}
          className={`flex flex-col items-center p-0.5 rounded transition-colors ${voted ? 'text-[#FF4500]' : 'text-[#818384] hover:text-[#FF4500]'}`}
          title="Upvote"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill={voted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
        <span className={`text-xs font-bold leading-none ${voted ? 'text-[#FF4500]' : 'text-[#d7dadc]'}`}>
          {score > 999 ? `${(score / 1000).toFixed(1)}k` : score}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-3 pr-4">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {rank && (
            <span className="text-xs font-mono text-[#82959b] w-5 text-center shrink-0">#{rank}</span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[category]}`}>
            {category}
          </span>
          {domain && (
            <span className="text-xs text-[#82959b]">({domain})</span>
          )}
          <span className="text-xs text-[#818384] ml-auto shrink-0">
            {story.time ? timeAgo(story.time) : ''}
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-sm font-semibold text-[#d7dadc] leading-snug mb-2 cursor-pointer hover:text-[#FF4500] transition-colors"
          onClick={handleTitleClick}
        >
          {story.title}
        </h2>

        {/* Footer actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-[#818384]">
            by <span className="text-[#FF4500] hover:underline cursor-pointer">{story.by}</span>
          </span>
          <a
            href={`https://news.ycombinator.com/item?id=${story.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#818384] hover:text-[#d7dadc] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {story.descendants ?? 0} comments
          </a>
          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#818384] hover:text-[#d7dadc] transition-colors ml-auto"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Visit
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex gap-0 bg-[#0f1113] border border-[#2A3236] rounded-xl mb-2.5 overflow-hidden animate-pulse">
      <div className="w-12 bg-[#0a0c0e] shrink-0" />
      <div className="flex-1 p-3 pr-4">
        <div className="flex gap-2 mb-2">
          <div className="h-4 w-12 bg-[#2A3236] rounded-full" />
          <div className="h-4 w-24 bg-[#2A3236] rounded-full" />
          <div className="h-4 w-16 bg-[#2A3236] rounded-full ml-auto" />
        </div>
        <div className="h-4 bg-[#2A3236] rounded mb-1.5" />
        <div className="h-4 bg-[#2A3236] rounded w-3/4 mb-3" />
        <div className="flex gap-3">
          <div className="h-3 w-16 bg-[#2A3236] rounded-full" />
          <div className="h-3 w-20 bg-[#2A3236] rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function NewsSidebar({ activeTab }) {
  return (
    <div className="space-y-4">
      {/* About */}
      <div className="bg-[#0f1113] border border-[#2A3236] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A3236] flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#FF4500]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="text-sm font-bold text-[#d7dadc]">About r/news</span>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#82959b] leading-relaxed mb-3">
            Top stories from <span className="text-[#FF4500] font-semibold">Hacker News</span> — live updates, tech news, science, and world events. Powered by the{' '}
            <a href="https://github.com/HackerNews/API" target="_blank" rel="noopener noreferrer" className="text-[#FF4500] hover:underline">
              HN Firebase API
            </a>.
          </p>
          <div className="grid grid-cols-2 gap-2 text-center">
            {[['Live', 'Updates'], ['Free', 'API'], ['No Ads', ''], ['24/7', 'News']].map(([a, b]) => (
              <div key={a + b} className="bg-[#1A282D] rounded-lg p-2">
                <div className="text-xs font-bold text-white">{a}</div>
                {b && <div className="text-[10px] text-[#82959b]">{b}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source tags */}
      <div className="bg-[#0f1113] border border-[#2A3236] rounded-xl p-4">
        <h3 className="text-sm font-bold text-[#d7dadc] mb-3">Legend</h3>
        <div className="flex flex-col gap-2">
          {Object.entries({
            'news': 'External article',
            'ask': 'Ask HN discussion',
            'show': 'Show HN project',
            'job': 'Job posting',
            'self': 'Text post',
          }).map(([cat, desc]) => (
            <div key={cat} className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[cat]}`}>
                {cat}
              </span>
              <span className="text-xs text-[#82959b]">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HN link */}
      <a
        href="https://news.ycombinator.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#FF4500] text-white text-sm font-bold hover:bg-[#e03d00] transition-colors"
      >
        Open Hacker News ↗
      </a>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const [activeTab, setActiveTab] = useState('topstories')

  const { data: stories = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['hn-news', activeTab],
    queryFn: () => fetchStories(activeTab, 30),
    staleTime: 1000 * 60 * 3,   // 3 min
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })

  return (
    <PageLayout>
      {/* Feed column */}
      <div className="flex-1 min-w-0 max-w-[740px]">

        {/* Header */}
        <div className="bg-[#0f1113] border border-[#2A3236] rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF4500] flex items-center justify-center text-white font-black text-lg shrink-0">
                Y
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#d7dadc] leading-tight">r/news</h1>
                <p className="text-xs text-[#82959b]">Powered by Hacker News · Live feed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-yellow-400 animate-pulse' : 'bg-[#46d160]'}`} />
              <span className="text-xs text-[#82959b]">{isFetching ? 'Refreshing…' : 'Live'}</span>
              <button
                onClick={() => refetch()}
                className="px-3 py-1.5 text-xs font-bold text-[#FF4500] border border-[#FF4500] rounded-full hover:bg-[rgba(255,69,0,0.1)] transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0f1113] border border-[#2A3236] rounded-xl p-1.5 mb-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FF4500] text-white shadow-md'
                  : 'text-[#82959b] hover:text-[#d7dadc] hover:bg-[#1A282D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stories */}
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stories.length === 0 ? (
          <div className="bg-[#0f1113] border border-[#2A3236] rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📰</div>
            <p className="text-[#82959b] text-sm">No stories found. Try another tab.</p>
          </div>
        ) : (
          stories.map((story, i) => (
            <StoryCard key={story.id} story={story} rank={i + 1} />
          ))
        )}
      </div>

      {/* Right sidebar */}
      <div className="hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
        <NewsSidebar activeTab={activeTab} />
      </div>
    </PageLayout>
  )
}
