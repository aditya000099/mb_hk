import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../components/layout/Navbar'
import SortBar from '../components/post/SortBar'
import PostFeed from '../components/post/PostFeed'
import AboutSidebar from '../components/subreddit/AboutSidebar'
import { getSubreddit } from '../api/subreddits'
import { getSubredditPosts } from '../api/posts'
export default function SubredditPage() {
  const { name } = useParams()
  const [sort, setSort] = useState('hot')
  const [timeFilter, setTimeFilter] = useState('all')

  const { data: subreddit, isLoading, isError } = useQuery({
    queryKey: ['subreddit', name],
    queryFn: () => getSubreddit(name),
    retry: 1,
  })

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-[600px] my-20 mx-auto text-center py-10 px-5 text-text-primary">Loading...</div>
      </>
    )
  }

  if (isError || !subreddit) {
    return (
      <>
        <Navbar />
        <div className="max-w-[600px] my-20 mx-auto text-center py-10 px-5">
          <h1 className="text-[20px] mb-3 text-text-primary">Sorry, there aren't any communities on Reddit with that name.</h1>
          <p className="text-text-muted mb-6">This community may have been banned or the community name is incorrect.</p>
          <Link to="/" className="inline-block py-2.5 px-6 bg-brand color-white text-white rounded-pill font-bold no-underline transition-colors duration-100 hover:bg-brand-hover">Go Home</Link>
        </div>
      </>
    )
  }

  const bannerStyle = subreddit.banner_url
    ? { backgroundImage: `url(${subreddit.banner_url})` }
    : { background: subreddit.primary_color || 'linear-gradient(to right, #46d160, #FF4500)' }

  return (
    <>
      <Navbar />

      {/* Banner */}
      <div className="h-[256px] bg-cover bg-center" style={bannerStyle} />

      {/* Header strip */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-[1200px] mx-auto py-3 px-5 flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-full border-4 border-surface bg-brand text-white text-[28px] font-bold flex items-center justify-center overflow-hidden mt-[-24px] shrink-0">
            {subreddit.icon_url ? (
              <img src={subreddit.icon_url} alt={subreddit.name} className="w-full h-full object-cover" />
            ) : (
              <span>{subreddit.name[0].toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[28px] font-bold text-text-primary">{subreddit.display_name || subreddit.name}</h1>
            <span className="text-sm text-text-muted">r/{subreddit.name}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-3 lg:gap-6 max-w-[1200px] mx-auto p-0 sm:p-2.5 lg:p-5 items-start mt-4">
        <div className="flex-1 min-w-0 max-w-[740px]">
          <SortBar
            sort={sort}
            setSort={setSort}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
          <PostFeed
            fetchFn={({ sort, t, after }) =>
              getSubredditPosts(name, { sort, t, after })
            }
            sort={sort}
            timeFilter={timeFilter}
            queryKey={['posts', name, sort, timeFilter]}
          />
        </div>
        <div className="hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
          <AboutSidebar subreddit={subreddit} />
        </div>
      </div>
    </>
  )
}
