import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { voteComment, deleteComment } from '../../api/comments'
import { createComment } from '../../api/comments'
import useAuthStore from '../../store/authStore'
import VoteButtons from '../ui/VoteButtons'
import CommentBox from './CommentBox'
import { timeAgo, formatNumber } from '../../utils/time'
export default function CommentItem({ comment, postId, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const replyMutation = useMutation({
    mutationFn: (text) => createComment(postId, { body: text, parent_id: comment.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setShowReply(false)
    },
  })

  const handleVote = async (value) => {
    await voteComment(comment.id, value)
  }

  const isOwn = user?.id === comment.author_id

  const avatarLetter = comment.author_username?.[0]?.toUpperCase() || 'U'

  if (collapsed) {
    return (
      <div className="relative pl-3 mb-2" style={{ marginLeft: depth * 16 }}>
        <button className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-1 rounded transition-colors duration-100 hover:bg-hover" onClick={() => setCollapsed(false)}>
          <div className="w-6 h-6 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center shrink-0">{avatarLetter}</div>
          <span className="text-xs text-text-muted">
            <strong>u/{comment.author_username}</strong>
            {' · '}
            {formatNumber(comment.score ?? 0)} points
            {comment.replies?.length > 0 && ` · ${comment.replies.length} replies`}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="relative pl-3 mb-2 group/comment" style={{ marginLeft: depth * 16 }}>
      {/* Thread line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px] cursor-pointer rounded-[1px] bg-border transition-colors duration-100 hover:bg-brand group-hover/comment:bg-border"
        title="Collapse thread"
        onClick={() => setCollapsed(true)}
      />

      <div className="pt-1">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <div className="w-6 h-6 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center shrink-0">{avatarLetter}</div>
          <span className="text-xs font-bold text-text-primary">u/{comment.author_username}</span>
          <span className="text-xs text-text-muted">{formatNumber(comment.score ?? 0)} points</span>
          <span className="text-xs text-text-muted">{timeAgo(comment.created_at)}</span>
        </div>

        {/* Body */}
        <div className="text-sm text-text-primary leading-relaxed mb-2 break-words">
          {comment.body?.split('\n').map((line, i) => (
            <p key={i} className="mb-1">{line || <br />}</p>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-wrap">
          <VoteButtons
            score={comment.score ?? 0}
            userVote={comment.user_vote ?? 0}
            onVote={handleVote}
            vertical={false}
          />
          {isAuthenticated && (
            <button
              className="py-1 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary"
              onClick={() => setShowReply(prev => !prev)}
            >
              Reply
            </button>
          )}
          <button className="py-1 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">Share</button>
          <button className="py-1 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">Report</button>
          {isOwn && (
            <button
              className="py-1 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-danger"
              onClick={() => {
                if (window.confirm('Delete this comment?')) deleteMutation.mutate()
              }}
            >
              Delete
            </button>
          )}
        </div>

        {/* Reply box */}
        {showReply && (
          <div className="mt-2">
            <CommentBox
              onSubmit={(text) => replyMutation.mutateAsync(text)}
              onCancel={() => setShowReply(false)}
              placeholder={`Reply to u/${comment.author_username}...`}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  )
}
