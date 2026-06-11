import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import SortBar from '../components/post/SortBar'
import PostFeed from '../components/post/PostFeed'
import { getPopularFeed } from '../api/posts'
export default function PopularPage() {
  const [sort, setSort] = useState('hot')
  const [timeFilter, setTimeFilter] = useState('all')

  return (
    <>
      <Navbar />
      <div className="flex gap-3 lg:gap-6 max-w-[1200px] mx-auto p-0 sm:p-2.5 lg:p-5 items-start">
        <div className="flex-1 min-w-0 max-w-[740px]">
          <div className="bg-surface border border-border rounded p-4 mb-2.5">
            <h1 className="text-[20px] font-bold text-text-primary mb-1">Popular Posts</h1>
            <p className="text-sm text-text-muted">The most popular content on Reddit</p>
          </div>
          <SortBar
            sort={sort}
            setSort={setSort}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
          <PostFeed
            fetchFn={({ sort, t, after }) => getPopularFeed({ sort, t, after })}
            sort={sort}
            timeFilter={timeFilter}
            queryKey={['popular-feed', sort, timeFilter]}
          />
        </div>
        <div className="hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
          <div className="bg-surface border border-border rounded overflow-hidden mb-4">
            <div className="p-3 font-bold text-sm text-white bg-gradient-to-b from-[#46d160] to-brand">Popular Communities</div>
            <div className="p-3">
              <p className="text-sm text-text-muted">
                Browse the most active communities on Reddit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
