import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../components/layout/Navbar'
import SortBar from '../components/post/SortBar'
import PostFeed from '../components/post/PostFeed'
import CreatePostShortcut from '../components/post/CreatePostShortcut'
import { getFeed } from '../api/posts'
import { getPopularSubreddits } from '../api/subreddits'
import useAuthStore from '../store/authStore'
import { formatNumber } from '../utils/time'
export default function HomePage() {
  const [sort, setSort] = useState('best')
  const [timeFilter, setTimeFilter] = useState('all')
  const user = useAuthStore(s => s.user)

  const { data: popularSubreddits } = useQuery({
    queryKey: ['popular-subreddits'],
    queryFn: getPopularSubreddits,
    staleTime: 1000 * 60 * 10,
  })

  return (
    <>
      <Navbar />
      <div className="page-layout">
        {/* Feed */}
        <div className="page-layout__feed">
          {user && <CreatePostShortcut />}
          <SortBar
            sort={sort}
            setSort={setSort}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
          <PostFeed
            fetchFn={({ sort, t, after }) => getFeed({ sort, t, after })}
            sort={sort}
            timeFilter={timeFilter}
            queryKey={['feed', sort, timeFilter]}
          />
        </div>

        {/* Sidebar */}
        <div className="page-layout__sidebar">
          {/* Home card */}
          <div className="bg-surface border border-border rounded-sm overflow-hidden mb-4">
            <div className="h-10 bg-gradient-to-r from-[#46d160] to-brand" />
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2 mt-[-24px]">
                <div className="w-8 h-8 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-bold text-text-primary">u/{user?.username || 'guest'}</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed mb-3">
                Your personal Reddit frontpage. Come here to check in with your favorite communities.
              </p>
              <div className="border-t border-border pt-3 mb-3"></div>
              <Link to="/submit" className="block w-full p-2 rounded-full text-sm font-bold text-center cursor-pointer border-none no-underline transition-colors duration-100 mb-3 bg-brand text-white hover:bg-brand-hover">
                Create Post
              </Link>
              <Link to="/subreddits/create" className="block w-full p-2 rounded-full text-sm font-bold text-center cursor-pointer transition-colors duration-100 mb-1 bg-transparent text-brand border border-brand no-underline hover:bg-[#ff45001a]">
                Create Community
              </Link>
            </div>
          </div>

          {/* Popular communities */}
          {popularSubreddits && popularSubreddits.length > 0 && (
            <div className="bg-surface border border-border rounded-sm overflow-hidden mb-4">
              <div className="p-3 font-bold text-[10px] text-text-muted uppercase tracking-wide bg-surface-raised border-b border-border">Top Communities</div>
              <div className="px-3">
                {popularSubreddits.slice(0, 5).map((sub, i) => (
                  <div key={sub.id || sub.name} className="flex justify-between items-center py-3 border-b border-border text-sm last:border-none">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary w-4 text-center">{i + 1}</span>
                      <svg viewBox="0 0 20 20" className="w-5 h-5 text-text-muted" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-brand shrink-0 flex justify-center items-center text-white text-xs font-bold">
                        {sub.icon_url ? <img src={sub.icon_url} alt="" className="w-full h-full object-cover" /> : sub.name[0]?.toUpperCase()}
                      </div>
                      <Link to={`/r/${sub.name}`} className="text-sm font-medium text-text-primary hover:underline">
                        r/{sub.name}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3">
                <Link to="/r/popular" className="block w-full p-2 rounded-full text-sm font-bold text-center cursor-pointer transition-colors duration-100 bg-transparent text-brand border border-transparent no-underline hover:bg-hover">
                  View All
                </Link>
              </div>
            </div>
          )}

          {/* Footer links */}
          <div className="flex flex-wrap gap-1.5 px-1 mb-2">
            <a href="#" className="text-xs text-text-muted no-underline hover:underline">Help</a>
            <a href="#" className="text-xs text-text-muted no-underline hover:underline">About</a>
            <a href="#" className="text-xs text-text-muted no-underline hover:underline">Careers</a>
            <a href="#" className="text-xs text-text-muted no-underline hover:underline">Press</a>
            <a href="#" className="text-xs text-text-muted no-underline hover:underline">Blog</a>
            <a href="#" className="text-xs text-text-muted no-underline hover:underline">Rules</a>
            <a href="#" className="text-xs text-text-muted no-underline hover:underline">Privacy Policy</a>
            <a href="#" className="text-xs text-text-muted no-underline hover:underline">User Agreement</a>
          </div>
          <p className="text-xs text-text-muted px-1">Reddit © 2026. All rights reserved.</p>
        </div>
      </div>
    </>
  )
}
