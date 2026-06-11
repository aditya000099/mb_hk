import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'
import SortBar from '../components/post/SortBar'
import PostFeed from '../components/post/PostFeed'
import { getFeed, getPopularFeed } from '../api/posts'
import useAuthStore from '../store/authStore'
import { timeAgo } from '../utils/time'

export default function HomePage() {
  const [sort, setSort] = useState('best')
  const [timeFilter, setTimeFilter] = useState('all')
  const user = useAuthStore(s => s.user)

  // Fetch some "recent" posts to populate the right sidebar dynamically
  const { data: recentPosts } = useQuery({
    queryKey: ['recent-posts'],
    queryFn: () => getPopularFeed({ sort: 'new', limit: 5 }),
    staleTime: 1000 * 60,
  })

  return (
    <PageLayout>
      {/* Feed */}
      <div className="page-layout__feed">
        {/* {user && <CreatePostShortcut />} */}
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
      <div className="page-layout__sidebar hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
        {/* Recent Posts */}
        <div className="bg-[#0f1113] border border-[#2A3236] rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between p-4 pb-2">
            <span className="font-bold text-[10px] text-[#82959b] uppercase tracking-wider">Recent Posts</span>
            <button className="text-[12px] text-[#7193ff] font-bold hover:underline">Clear</button>
          </div>
          <div className="flex flex-col">
            {recentPosts?.length > 0 ? recentPosts.map(post => (
              <Link to={`/r/${post.subreddit_name}/comments/${post.id}`} key={post.id} className="p-4 border-b border-[#2A3236] last:border-none hover:bg-[#1A282D] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-[#272729] flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-white font-bold">{post.subreddit_name[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-bold text-[#d7dadc]">r/{post.subreddit_name}</span>
                  <span className="text-[10px] text-[#82959b]">• {timeAgo(post.created_at)}</span>
                </div>
                <h3 className="text-sm font-bold text-[#d7dadc] mb-1 line-clamp-2 leading-tight">{post.title}</h3>
                <div className="text-xs text-[#82959b] flex items-center gap-2">
                  <span>{post.score} upvotes</span>
                  <span>•</span>
                  <span>{post.comment_count} comments</span>
                </div>
              </Link>
            )) : (
              <div className="p-4 text-xs text-[#82959b]">No recent posts.</div>
            )}
          </div>
        </div>

        {/* Footer links */}
        <div className="flex flex-wrap gap-2 px-2 mb-2">
          <a href="#" className="text-xs text-[#82959b] hover:underline">Help</a>
          <a href="#" className="text-xs text-[#82959b] hover:underline">About</a>
          <a href="#" className="text-xs text-[#82959b] hover:underline">Careers</a>
          <a href="#" className="text-xs text-[#82959b] hover:underline">Press</a>
          <a href="#" className="text-xs text-[#82959b] hover:underline">Blog</a>
          <a href="#" className="text-xs text-[#82959b] hover:underline">Rules</a>
          <a href="#" className="text-xs text-[#82959b] hover:underline">Privacy Policy</a>
          <a href="#" className="text-xs text-[#82959b] hover:underline">User Agreement</a>
        </div>
        <p className="text-xs text-[#82959b] px-2">Reddit © 2026. All rights reserved.</p>
      </div>
    </PageLayout>
  )
}
