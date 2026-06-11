import { Link, useNavigate } from 'react-router-dom'
import VoteButtons from '../ui/VoteButtons'
import { timeAgo, formatNumber } from '../../utils/time'
import { votePost } from '../../api/posts'
import useAuthStore from '../../store/authStore'
export default function PostCard({ post, onVoteUpdate }) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const handleVote = async (value) => {
    if (!isAuthenticated) { navigate('/login'); return }
    const result = await votePost(post.id, value)
    if (onVoteUpdate) onVoteUpdate(post.id, result.score, value)
  }

  return (
    <div className="flex bg-surface border border-border rounded-sm mb-2.5 cursor-pointer relative overflow-hidden transition-colors duration-100 hover:border-[#898989] group/card before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-transparent before:transition-colors before:duration-150 group-hover/card:before:bg-brand" onClick={() => navigate(`/r/${post.subreddit_name}/comments/${post.id}`)}>
      <div className="w-10 min-w-[40px] bg-surface-raised flex items-start justify-center pt-2 pb-2 px-1 z-10 border-r border-transparent" onClick={e => e.stopPropagation()}>
        <VoteButtons score={post.score} userVote={post.user_vote} onVote={handleVote} />
      </div>
      <div className="flex-1 pt-2 pb-2 pl-2 pr-4 min-w-0 z-10">
        <div className="flex items-center gap-1 flex-wrap mb-2 text-xs text-text-muted">
          <Link to={`/r/${post.subreddit_name}`} className="font-bold text-text-primary hover:underline" onClick={e => e.stopPropagation()}>
            r/{post.subreddit_name}
          </Link>
          <span className="text-[10px] mx-0.5">•</span>
          <span>
            Posted by{' '}
            <Link to={`/u/${post.author_username}`} className="hover:underline" onClick={e => e.stopPropagation()}>
              u/{post.author_username}
            </Link>
          </span>
          <span className="text-text-muted ml-1">{timeAgo(post.created_at)}</span>
        </div>
        <h2 className="text-[18px] font-medium text-text-primary leading-[22px] mb-2 break-words">{post.title}</h2>
        {post.flair_text && (
          <span className="inline-block py-0.5 px-2 rounded-pill text-xs font-bold text-white mb-2" style={{ background: post.flair_color || 'var(--color-brand)' }}>
            {post.flair_text}
          </span>
        )}
        {post.image_url && (
          <img src={post.image_url} alt={post.title} className="w-full max-h-[512px] object-cover rounded mb-2" />
        )}
        {post.post_type === 'link' && post.url && (
          <a
            href={post.url}
            className="block text-xs text-text-muted underline break-all mb-2"
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {post.url}
          </a>
        )}
        <div className="flex items-center flex-wrap gap-1 mt-1" onClick={e => e.stopPropagation()}>
          <button
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary"
            onClick={() => navigate(`/r/${post.subreddit_name}/comments/${post.id}`)}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            {formatNumber(post.comment_count)} Comments
          </button>
          <button className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </button>
          <button className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
