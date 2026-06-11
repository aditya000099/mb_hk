import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'
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
      <PageLayout>
        <div className="w-full max-w-[600px] my-20 mx-auto text-center py-10 px-5 text-text-primary">Loading...</div>
      </PageLayout>
    )
  }

  if (isError || !subreddit) {
    return (
      <PageLayout>
        <div className="w-full max-w-[600px] my-20 mx-auto text-center py-10 px-5">
          <h1 className="text-[20px] mb-3 text-text-primary">Sorry, there aren't any communities on Reddit with that name.</h1>
          <p className="text-text-muted mb-6">This community may have been banned or the community name is incorrect.</p>
          <Link to="/" className="inline-block py-2.5 px-6 bg-brand color-white text-white rounded-pill font-bold no-underline transition-colors duration-100 hover:bg-brand-hover">Go Home</Link>
        </div>
      </PageLayout>
    )
  }

  const bannerStyle = subreddit.banner_url
    ? { backgroundImage: `url(${subreddit.banner_url})` }
    : { background: subreddit.primary_color || 'linear-gradient(to right, #46d160, #FF4500)' }

  return (
    <PageLayout>
      <div className="w-full flex flex-col">
        {/* Banner */}
        <div className="h-[256px] w-full bg-cover bg-center rounded-t-lg" style={bannerStyle} />

        {/* Header strip */}
        <div className="bg-[#0f1113] border-b border-x border-[#2A3236] rounded-b-lg mb-4">
          <div className="w-full py-3 px-5 flex items-center gap-4">
            <div className="w-[72px] h-[72px] rounded-full border-4 border-[#0f1113] bg-[#FF4500] text-white text-[28px] font-bold flex items-center justify-center overflow-hidden mt-[-24px] shrink-0">
              {subreddit.icon_url ? (
                <img src={subreddit.icon_url} alt={subreddit.name} className="w-full h-full object-cover" />
              ) : (
                <span>{subreddit.name[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-[28px] font-bold text-white">{subreddit.display_name || subreddit.name}</h1>
              <span className="text-sm text-[#82959b]">r/{subreddit.name}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex gap-3 lg:gap-6 w-full items-start">
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
      </div>
    </PageLayout>
  )
}
