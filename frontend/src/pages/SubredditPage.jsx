import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'
import SortBar from '../components/post/SortBar'
import PostFeed from '../components/post/PostFeed'
import AboutSidebar from '../components/subreddit/AboutSidebar'
import { getSubreddit, joinSubreddit } from '../api/subreddits'
import { getSubredditPosts } from '../api/posts'
import useAuthStore from '../store/authStore'

export default function SubredditPage() {
  const { name } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [sort, setSort] = useState('hot')
  const [timeFilter, setTimeFilter] = useState('all')

  const { data: subreddit, isLoading, isError } = useQuery({
    queryKey: ['subreddit', name],
    queryFn: () => getSubreddit(name),
    retry: 1,
  })

  const joinMutation = useMutation({
    mutationFn: () => joinSubreddit(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddit', name] })
    },
  })

  const handleJoin = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    joinMutation.mutate()
  }

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

  const isMember = subreddit.is_member

  return (
    <PageLayout>
      <div className="w-full flex flex-col max-w-[1120px] mx-2">
        {/* Banner Block */}
        <div className="h-[80px] md:h-[72px] w-full bg-[#1A282D] rounded-lg mt-2 lg:mt-2" />

        {/* Header strip */}
        <div className="w-full px-4 md:px-6 pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">

          <div className="flex items-center gap-4">
            {/* Avatar overlapping banner */}
            <div className="w-[72px] h-[72px] rounded-full border-4 border-[#0B1416] bg-white text-black text-[24px] font-bold flex items-center justify-center overflow-hidden mt-[-36px] shrink-0 z-10">
              {subreddit.icon_url ? (
                <img src={subreddit.icon_url} alt={subreddit.name} className="w-full h-full object-cover" />
              ) : (
                <span>r/</span>
              )}
            </div>
            {/* Title */}
            <h1 className="text-[28px] font-bold text-white mt-1">r/{subreddit.display_name || subreddit.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/r/${subreddit.name}/submit`}
              className="px-4 py-2 rounded-full border border-white text-white font-bold text-sm flex items-center justify-center transition-colors hover:bg-white/10 no-underline"
            >
              <span className="mr-1.5 text-lg leading-none">+</span> Create Post
            </Link>

            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-colors border-none cursor-pointer disabled:opacity-50 ${isMember
                ? 'bg-transparent text-white border border-white hover:bg-white/10'
                : 'bg-[#0045AC] text-white hover:bg-[#0045AC]/90'
                }`}
            >
              {isMember ? 'Joined' : 'Join'}
            </button>

            <button className="w-9 h-9 rounded-full border border-white text-white flex items-center justify-center bg-transparent cursor-pointer hover:bg-white/10">
              <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5">
                <path d="M5.5 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm6 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm4.5 1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
            </button>
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
