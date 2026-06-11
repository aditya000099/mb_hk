import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { joinSubreddit } from '../../api/subreddits'
import useAuthStore from '../../store/authStore'
import { timeAgo, formatNumber } from '../../utils/time'
export default function AboutSidebar({ subreddit }) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  const joinMutation = useMutation({
    mutationFn: () => joinSubreddit(subreddit.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddit', subreddit.name] })
    },
  })

  const handleJoin = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    joinMutation.mutate()
  }

  const isOwner = user?.id === subreddit?.creator_id
  const isMember = subreddit?.is_member

  return (
    <div className="bg-surface border border-border rounded overflow-hidden mb-4">
      {/* Header */}
      <div className="pt-12 px-3 pb-3 font-bold text-sm bg-gradient-to-b from-[#46d160] to-brand color-white text-white">
        <span>r/{subreddit.name}</span>
      </div>

      <div className="p-3">
        {/* Description */}
        {subreddit.description && (
          <p className="text-sm text-text-primary leading-relaxed mb-3">{subreddit.description}</p>
        )}

        {/* Divider */}
        <div className="h-[1px] bg-border my-3" />

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-bold text-text-primary">{formatNumber(subreddit.member_count ?? 0)}</span>
            <span className="text-xs text-text-muted">Members</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-bold text-text-primary">
              {Math.floor(Math.random() * 100) + 1}
            </span>
            <span className="text-xs text-text-muted">Online</span>
          </div>
        </div>

        <div className="h-[1px] bg-border my-3" />

        {/* Cake day */}
        {subreddit.created_at && (
          <div className="text-[13px] text-text-secondary">
            🎂 Created {timeAgo(subreddit.created_at)}
          </div>
        )}

        <div className="h-[1px] bg-border my-3" />

        {/* Buttons */}
        <Link
          to={`/r/${subreddit.name}/submit`}
          className="block w-full p-2 rounded-pill text-sm font-bold text-center cursor-pointer border-none transition-colors duration-100 mb-2 no-underline bg-brand text-white hover:bg-brand-hover"
        >
          Create Post
        </Link>

        {!isOwner && (
          <button
            className={`block w-full p-2 rounded-pill text-sm font-bold text-center cursor-pointer transition-colors duration-100 mb-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              isMember 
                ? 'bg-transparent text-brand border border-brand hover:bg-[#ff45001a]' 
                : 'bg-brand text-white border-none hover:bg-brand-hover'
            }`}
            onClick={handleJoin}
            disabled={joinMutation.isPending}
          >
            {isMember ? 'Leave' : 'Join'}
          </button>
        )}

        {/* Rules link */}
        <div className="h-[1px] bg-border my-3" />
        <div className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">COMMUNITY RULES</div>
        <p className="text-[13px] text-text-secondary leading-snug">Be respectful and follow Reddit's content policy.</p>
      </div>
    </div>
  )
}
