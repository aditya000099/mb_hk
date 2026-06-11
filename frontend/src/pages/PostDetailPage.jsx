import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/layout/Navbar'
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
    await votePost(postId, value)
    queryClient.invalidateQueries({ queryKey: ['post', postId] })
  }

  if (postLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-[600px] my-20 mx-auto text-center py-10 px-5 text-text-muted">Loading post...</div>
      </>
    )
  }

  if (postError || !post) {
    return (
      <>
        <Navbar />
        <div className="max-w-[600px] my-20 mx-auto text-center py-10 px-5 text-text-muted">
          <h1>Post not found</h1>
          <Link to="/">Go Home</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="flex gap-3 lg:gap-6 max-w-[1200px] mx-auto p-0 sm:p-2.5 lg:p-5 items-start">
        <div className="flex-1 min-w-0 max-w-[740px]">
          {/* Post */}
          <div className="flex bg-surface border border-border rounded mb-4">
            <div className="w-10 min-w-[40px] bg-surface-raised flex items-start justify-center py-2 px-1 rounded-l">
              <VoteButtons
                score={post.score}
                userVote={post.user_vote}
                onVote={handleVote}
                vertical={true}
              />
            </div>
            <div className="flex-1 py-3 px-4 min-w-0">
              <div className="flex items-center gap-1 flex-wrap mb-2 text-xs text-text-muted">
                <Link to={`/r/${post.subreddit_name}`} className="font-bold text-text-primary text-xs hover:underline">
                  r/{post.subreddit_name}
                </Link>
                <span className="text-text-muted">•</span>
                <span>
                  Posted by{' '}
                  <Link to={`/u/${post.author_username}`} className="hover:underline">
                    u/{post.author_username}
                  </Link>
                </span>
                <span className="text-text-muted">•</span>
                <span>{timeAgo(post.created_at)}</span>
              </div>

              <h1 className="text-[22px] font-medium text-text-primary leading-[1.3] mb-3 break-words">{post.title}</h1>

              {post.flair_text && (
                <span
                  className="inline-block py-0.5 px-2 rounded-pill text-xs font-semibold text-white mb-3"
                  style={{ background: post.flair_color || 'var(--color-brand)' }}
                >
                  {post.flair_text}
                </span>
              )}

              {post.image_url && (
                <img src={post.image_url} alt={post.title} className="w-full max-h-[512px] object-contain rounded mb-3 bg-black" />
              )}

              {post.post_type === 'link' && post.url && (
                <a
                  href={post.url}
                  className="text-sm text-downvote break-all block mb-3 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔗 {post.url}
                </a>
              )}

              {post.body && (
                <div className="text-sm text-text-primary leading-[1.7] mb-3 break-words">
                  {post.body.split('\n').map((line, i) => (
                    <p key={i} className="mb-1.5">{line || <br />}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1 flex-wrap">
                <span className="flex items-center gap-1 py-1.5 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">
                  💬 {formatNumber(post.comment_count)} Comments
                </span>
                <button className="flex items-center gap-1 py-1.5 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">Share</button>
                <button className="flex items-center gap-1 py-1.5 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">Save</button>
                <button className="flex items-center gap-1 py-1.5 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">Hide</button>
                <button className="flex items-center gap-1 py-1.5 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">Report</button>
              </div>
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
      </div>
    </>
  )
}
