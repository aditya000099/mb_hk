import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'
import VoteButtons from '../components/ui/VoteButtons'
import CommentBox from '../components/comment/CommentBox'
import CommentThread from '../components/comment/CommentThread'
import { getPost, votePost } from '../api/posts'
import { getComments, createComment } from '../api/comments'
import useAuthStore from '../store/authStore'
import { timeAgo, formatNumber } from '../utils/time'
const COMMENT_SORTS = [
  { value: 'best', label: 'Best' },
  { value: 'top', label: 'Top' },
  { value: 'new', label: 'New' },
  { value: 'controversial', label: 'Controversial' },
  { value: 'old', label: 'Old' },
  { value: 'qa', label: 'Q&A' },
]

export default function PostDetailPage() {
  const { name, postId } = useParams()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [commentSort, setCommentSort] = useState('best')
  const queryClient = useQueryClient()

  const { data: post, isLoading: postLoading, isError: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId),
  })

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId, commentSort],
    queryFn: () => getComments(postId, commentSort),
    enabled: !!postId,
  })

  const commentMutation = useMutation({
    mutationFn: (text) => createComment(postId, { body: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const handleVote = async (value) => {
    if (!isAuthenticated) return // Could also redirect to login if we import useNavigate

    // Optimistically update the cache
    queryClient.setQueryData(['post', postId], (old) => {
      if (!old) return old
      let newVote = value
      let newScore = old.score

      if (old.user_vote === value) {
        newVote = 0
        newScore -= value
      } else {
        if (old.user_vote !== 0) {
          newScore -= old.user_vote
        }
        newScore += value
      }

      return {
        ...old,
        user_vote: newVote,
        score: newScore
      }
    })

    try {
      await votePost(postId, value)
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    } catch (e) {
      // If error, invalidate to refetch correct state
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    }
  }

  if (postLoading) {
    return (
      <PageLayout>
        <div className="max-w-[600px] my-20 mx-auto text-center py-10 px-5 text-text-muted">Loading post...</div>
      </PageLayout>
    )
  }

  if (postError || !post) {
    return (
      <PageLayout>
        <div className="max-w-[600px] my-20 mx-auto text-center py-10 px-5 text-text-muted">
          <h1>Post not found</h1>
          <Link to="/">Go Home</Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="flex-1 min-w-0 max-w-[740px]">
        <div className="bg-[#0f1113] rounded-2xl mb-4 border border-[#2A3236] p-4 sm:p-5">
          {/* Post Header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-xs text-[#82959b]">
              <div className="w-8 h-8 rounded-full bg-[#272729] flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-[12px] text-white font-bold">{post.subreddit_name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex items-center flex-wrap gap-1">
                <Link to={`/r/${post.subreddit_name}`} className="font-bold text-[#d7dadc] text-sm hover:underline">
                  r/{post.subreddit_name}
                </Link>
                <span className="text-[10px] mx-1">•</span>
                <span>
                  <Link to={`/u/${post.author_username}`} className="hover:underline">
                    u/{post.author_username}
                  </Link>
                </span>
                <span className="text-[10px] mx-1">•</span>
                <span>{timeAgo(post.created_at)}</span>
              </div>
            </div>
            
            <button className="text-[#82959b] hover:bg-[#272729] rounded-full p-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>

          {/* Post Title */}
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[#d7dadc] leading-[1.3] mb-3 break-words">
            {post.title}
          </h1>

          {/* Flair */}
          {post.flair_text && (
            <div className="mb-3">
              <span 
                className="inline-block py-1 px-3 rounded-full text-xs font-bold" 
                style={{ background: post.flair_color || '#FFE500', color: '#000000' }}
              >
                {post.flair_text}
              </span>
            </div>
          )}

          {/* Post Body/Content */}
          {post.post_type === 'link' && post.url && (
            <a
              href={post.url}
              className="flex items-center gap-2 text-sm text-[#8ca4e6] hover:underline break-all mb-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>👉</span> {post.url}
            </a>
          )}

          {post.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black max-h-[600px] flex items-center justify-center">
              <img src={post.image_url} alt={post.title} className="max-w-full max-h-[600px] object-contain" />
            </div>
          )}

          {post.body && (
            <div className="text-sm sm:text-base text-[#d7dadc] leading-[1.6] mb-4 break-words">
              {post.body.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line || <br />}</p>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center flex-wrap gap-2 mt-2 pt-2 border-t border-[#2A3236]">
            {/* Vote Pill */}
            <div className="flex items-center bg-[#272729] hover:bg-[#343435] rounded-full">
              <button 
                className={`p-2 sm:p-2.5 rounded-l-full flex items-center justify-center transition-colors ${post.user_vote === 1 ? 'text-[#FF4500]' : 'text-[#d7dadc] hover:text-[#FF4500]'}`}
                onClick={() => handleVote(1)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              </button>
              <span className={`text-sm font-bold px-2 ${post.user_vote === 1 ? 'text-[#FF4500]' : post.user_vote === -1 ? 'text-[#7193ff]' : 'text-[#d7dadc]'}`}>
                {formatNumber(post.score)}
              </span>
              <button 
                className={`p-2 sm:p-2.5 rounded-r-full flex items-center justify-center transition-colors ${post.user_vote === -1 ? 'text-[#7193ff]' : 'text-[#d7dadc] hover:text-[#7193ff]'}`}
                onClick={() => handleVote(-1)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </button>
            </div>

            {/* Comment Pill */}
            <button className="flex items-center gap-1.5 py-2 px-4 sm:py-2.5 sm:px-4 rounded-full bg-[#272729] hover:bg-[#343435] text-sm font-bold text-[#d7dadc] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <path d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2v4l4-4h8z"></path>
              </svg>
              {formatNumber(post.comment_count)}
            </button>

            {/* Award Pill */}
            <button className="flex items-center gap-1.5 p-2 sm:p-2.5 rounded-full bg-[#272729] hover:bg-[#343435] text-sm font-bold text-[#d7dadc] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="8" r="6"></circle>
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
              </svg>
            </button>

            {/* Share Pill */}
            <button className="flex items-center gap-1.5 py-2 px-4 sm:py-2.5 sm:px-4 rounded-full bg-[#272729] hover:bg-[#343435] text-sm font-bold text-[#d7dadc] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Comment area */}
        <div className="bg-surface border border-border rounded p-4">
          {/* Comment box */}
          {isAuthenticated && (
            <div className="mb-4">
              <p className="text-xs text-text-muted mb-1">
                Comment as{' '}
                <span className="text-brand font-bold">
                  u/{useAuthStore.getState().user?.username}
                </span>
              </p>
              <CommentBox
                onSubmit={(text) => commentMutation.mutateAsync(text)}
                placeholder="What are your thoughts?"
              />
            </div>
          )}

          {/* Sort bar */}
          <div className="flex items-center gap-1 flex-wrap py-2 border-y border-border mb-4">
            <span className="text-xs font-bold text-text-muted mr-1">Sort By:</span>
            {COMMENT_SORTS.map(s => (
              <button
                key={s.value}
                className={`flex items-center gap-1 py-1.5 px-3 rounded-pill bg-transparent border-none text-sm font-bold text-text-muted cursor-pointer transition-colors duration-100 ${commentSort === s.value ? 'text-brand bg-hover' : 'hover:bg-hover hover:text-text-primary'}`}
                onClick={() => setCommentSort(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Comments */}
          {commentsLoading ? (
            <div className="text-center p-8 text-text-muted text-sm">Loading comments...</div>
          ) : comments && (Array.isArray(comments) ? comments : comments.comments)?.length > 0 ? (
            <CommentThread
              comments={Array.isArray(comments) ? comments : comments.comments}
              postId={postId}
              depth={0}
            />
          ) : (
            <div className="text-center p-8 text-text-muted text-sm">
              <p>No comments yet. Be the first to share what you think!</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
        <div className="bg-surface border border-border rounded-sm overflow-hidden mb-4">
          <div className="p-3 font-bold text-sm text-white" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}>
            About r/{post.subreddit_name}
          </div>
          <div className="p-3">
            <Link to={`/r/${post.subreddit_name}`} className="block w-full p-2 rounded-pill bg-brand color-white text-white text-center text-sm font-bold no-underline transition-colors duration-100 hover:bg-brand-hover">
              Visit r/{post.subreddit_name}
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
