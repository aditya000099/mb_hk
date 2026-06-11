import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'
import PostCard from '../components/post/PostCard'
import { searchAll } from '../api/search'
import { formatNumber, timeAgo } from '../utils/time'

const TABS = [
  { id: 'posts', label: 'Posts' },
  { id: 'communities', label: 'Communities' },
  { id: 'people', label: 'People' },
]

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
]

const TIME_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') || ''
  const [activeTab, setActiveTab] = useState('posts')
  const [sort, setSort] = useState('relevance')
  const [timeFilter, setTimeFilter] = useState('all')

  // Map tab to API type
  const typeMap = { posts: 'post', communities: 'subreddit', people: 'user' }
  const type = typeMap[activeTab] || 'all'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', q, type, sort, timeFilter],
    queryFn: () => searchAll(q, { type, sort, t: timeFilter }),
    enabled: !!q.trim(),
    staleTime: 1000 * 30,
  })

  const posts = data?.posts || []
  const communities = data?.subreddits || []
  const people = data?.users || []

  const isEmpty = activeTab === 'posts' ? posts.length === 0
    : activeTab === 'communities' ? communities.length === 0
    : people.length === 0

  if (!q.trim()) {
    return (
      <PageLayout>
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-16 h-16 text-[#FF4500] mb-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <h1 className="text-2xl font-bold text-[#d7dadc] mb-2">Search Reddit</h1>
          <p className="text-[#82959b]">Type something in the search bar above to find posts, communities, and people.</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-[#d7dadc]">
            Search results for <span className="text-[#FF4500]">"{q}"</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#2A3236] mb-4 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'text-[#d7dadc] border-[#d7dadc]'
                  : 'text-[#82959b] border-transparent hover:text-[#d7dadc]'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort / filter bar — only for posts */}
        {activeTab === 'posts' && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-1 bg-[#0f1113] rounded-full border border-[#2A3236] p-1">
              {SORTS.map(s => (
                <button
                  key={s.value}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                    sort === s.value ? 'bg-[#272729] text-[#d7dadc]' : 'text-[#82959b] hover:text-[#d7dadc]'
                  }`}
                  onClick={() => setSort(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {sort === 'top' && (
              <select
                className="px-3 py-1.5 text-xs font-bold bg-[#0f1113] border border-[#2A3236] rounded-full text-[#82959b] outline-none cursor-pointer"
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
              >
                {TIME_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0f1113] rounded-2xl border border-[#2A3236] p-5 animate-pulse">
                <div className="h-4 bg-[#272729] rounded-full w-1/3 mb-3" />
                <div className="h-5 bg-[#272729] rounded-full w-3/4 mb-2" />
                <div className="h-4 bg-[#272729] rounded-full w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="text-center py-12 text-[#82959b]">
            <p>Something went wrong. Please try again.</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !isError && (
          <>
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                {posts.length > 0 ? (
                  posts.map(post => <PostCard key={post.id} post={post} />)
                ) : (
                  <EmptyState query={q} type="posts" />
                )}
              </div>
            )}

            {/* Communities Tab */}
            {activeTab === 'communities' && (
              <div className="flex flex-col gap-3">
                {communities.length > 0 ? (
                  communities.map(sub => (
                    <Link
                      key={sub.id || sub.name}
                      to={`/r/${sub.name}`}
                      className="bg-[#0f1113] rounded-2xl border border-[#2A3236] p-4 flex items-center gap-4 transition-colors hover:bg-[#151719] no-underline"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FF4500] flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden">
                        {sub.icon_url
                          ? <img src={sub.icon_url} alt={sub.name} className="w-full h-full object-cover" />
                          : sub.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#d7dadc] text-sm">r/{sub.name}</p>
                        {sub.description && (
                          <p className="text-xs text-[#82959b] line-clamp-2 mt-0.5">{sub.description}</p>
                        )}
                        <p className="text-xs text-[#82959b] mt-1">
                          {formatNumber(sub.member_count)} members
                        </p>
                      </div>
                      <span className="px-4 py-1.5 rounded-full bg-[#FF4500] text-white text-xs font-bold shrink-0 hover:bg-[#e03d00] transition-colors">
                        Visit
                      </span>
                    </Link>
                  ))
                ) : (
                  <EmptyState query={q} type="communities" />
                )}
              </div>
            )}

            {/* People Tab */}
            {activeTab === 'people' && (
              <div className="flex flex-col gap-3">
                {people.length > 0 ? (
                  people.map(user => (
                    <Link
                      key={user.id}
                      to={`/u/${user.username}`}
                      className="bg-[#0f1113] rounded-2xl border border-[#2A3236] p-4 flex items-center gap-4 transition-colors hover:bg-[#151719] no-underline"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#272729] flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden">
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                          : user.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#d7dadc] text-sm">u/{user.username}</p>
                        {user.display_name && (
                          <p className="text-xs text-[#82959b]">{user.display_name}</p>
                        )}
                        <p className="text-xs text-[#82959b] mt-0.5">
                          {formatNumber(user.post_karma + user.comment_karma)} karma
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState query={q} type="people" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
        <div className="bg-[#0f1113] rounded-xl border border-[#2A3236] p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-[#FF4500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <h2 className="text-sm font-bold text-[#d7dadc]">Search Tips</h2>
          </div>
          <ul className="flex flex-col gap-2 text-xs text-[#82959b]">
            <li>• Use specific keywords for better results</li>
            <li>• Filter by Posts, Communities, or People using the tabs</li>
            <li>• Sort posts by Relevance, New, or Top</li>
            <li>• Use time filters when sorting by Top</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  )
}

function EmptyState({ query, type }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-12 h-12 text-[#82959b] mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <h3 className="text-base font-bold text-[#d7dadc] mb-1">No {type} found for "{query}"</h3>
      <p className="text-sm text-[#82959b]">Try different search terms or check the other tabs.</p>
    </div>
  )
}
