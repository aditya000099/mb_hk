import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { voteComment, deleteComment, editComment } from '../../api/comments'
import { createComment } from '../../api/comments'
import useAuthStore from '../../store/authStore'
import VoteButtons from '../ui/VoteButtons'
import CommentBox from './CommentBox'
import { timeAgo, formatNumber } from '../../utils/time'

export default function CommentItem({ comment, postId, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body || '')
  const [shareToast, setShareToast] = useState(false)
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const editMutation = useMutation({
    mutationFn: (body) => editComment(comment.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setIsEditing(false)
    },
  })

  const replyMutation = useMutation({
    mutationFn: (text) => createComment(postId, { body: text, parent_comment_id: comment.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setShowReply(false)
    },
  })

  const handleVote = async (value) => {
    await voteComment(comment.id, value)
    queryClient.invalidateQueries({ queryKey: ['comments', postId] })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/r/${comment.subreddit_name || ''}/comments/${postId}#comment-${comment.id}`
    try {
      if (navigator.share && window.innerWidth < 768) {
        await navigator.share({ title: 'Reddit comment', url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      }
    } catch {
      // Fallback: prompt with url
      try {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      } catch {
        // clipboard unavailable (HTTP)
        window.prompt('Copy this link:', url)
      }
    }
  }

  const handleEditSubmit = () => {
    const trimmed = editBody.trim()
    if (!trimmed) return
    editMutation.mutate(trimmed)
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
    <div
      id={`comment-${comment.id}`}
      className="relative pl-3 mb-2 group/comment"
      style={{ marginLeft: depth * 16 }}
    >
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
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-[#82959b] italic">· edited</span>
          )}
        </div>

        {/* Body / Edit mode */}
        {isEditing ? (
          <div className="mb-2">
            <textarea
              className="w-full p-2 bg-[#1A282D] border border-[#2A3236] rounded text-sm text-[#d7dadc] resize-y outline-none focus:border-[#FF4500] min-h-[80px]"
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              maxLength={10000}
              autoFocus
            />
            <div className="flex gap-2 mt-1">
              <button
                className="px-3 py-1 rounded-full bg-[#FF4500] text-white text-xs font-bold hover:bg-[#e03d00] transition-colors disabled:opacity-50"
                onClick={handleEditSubmit}
                disabled={editMutation.isPending || !editBody.trim()}
              >
                {editMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                className="px-3 py-1 rounded-full bg-[#272729] text-[#d7dadc] text-xs font-bold hover:bg-[#343435] transition-colors"
                onClick={() => { setIsEditing(false); setEditBody(comment.body || '') }}
              >
                Cancel
              </button>
            </div>
            {editMutation.isError && (
              <p className="text-xs text-red-400 mt-1">Failed to save. Please try again.</p>
            )}
          </div>
        ) : (
          <div className="text-sm text-text-primary leading-relaxed mb-2 break-words">
            {comment.body?.split('\n').map((line, i) => (
              <p key={i} className="mb-1">{line || <br />}</p>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 flex-wrap relative">
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
          {/* Share button */}
          <div className="relative">
            <button
              className="py-1 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary"
              onClick={handleShare}
            >
              Share
            </button>
            {shareToast && (
              <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-[#272729] text-[#d7dadc] text-xs rounded-md whitespace-nowrap shadow-lg z-10 animate-fade-in">
                ✓ Link copied!
              </div>
            )}
          </div>
          <button className="py-1 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary">Report</button>
          {isOwn && !comment.is_deleted && (
            <>
              <button
                className="py-1 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-text-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                className="py-1 px-2 rounded bg-transparent border-none text-xs font-bold text-text-muted cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-danger"
                onClick={() => {
                  if (window.confirm('Delete this comment?')) deleteMutation.mutate()
                }}
              >
                Delete
              </button>
            </>
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

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
