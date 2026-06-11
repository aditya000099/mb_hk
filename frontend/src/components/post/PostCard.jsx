import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { timeAgo, formatNumber } from '../../utils/time'
import { votePost, deletePost, editPost } from '../../api/posts'
import { toggleSavePost } from '../../api/users'
import useAuthStore from '../../store/authStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function PostCard({ post, onVoteUpdate, onDelete }) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const currentUser = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  const isOwner = currentUser?.id === post.author_id

  const [localVote, setLocalVote] = useState(post.user_vote || 0)
  const [localScore, setLocalScore] = useState(post.score || 0)
  const [localSaved, setLocalSaved] = useState(post.is_saved || false)
  const [shareToast, setShareToast] = useState(false)

  // Three-dot menu
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editBody, setEditBody] = useState(post.body || '')

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setLocalVote(post.user_vote || 0)
    setLocalScore(post.score || 0)
    setEditTitle(post.title)
    setEditBody(post.body || '')
  }, [post.user_vote, post.score, post.title, post.body])

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleVote = async (value) => {
    if (!isAuthenticated) { navigate('/login'); return }

    let newVote = value;
    let newScore = localScore;

    if (localVote === value) {
      newVote = 0;
      newScore -= value;
    } else {
      if (localVote !== 0) {
        newScore -= localVote;
      }
      newScore += value;
    }

    setLocalVote(newVote)
    setLocalScore(newScore)

    try {
      const result = await votePost(post.id, value)
      if (result.score !== undefined) {
        setLocalScore(result.score)
      }
      if (result.user_vote !== undefined) {
        setLocalVote(result.user_vote)
      }
      if (onVoteUpdate) onVoteUpdate(post.id, result.score, value)
    } catch (e) {
      setLocalVote(post.user_vote || 0)
      setLocalVote(post.user_vote || 0)
      setLocalScore(post.score || 0)
    }
  }

  const handleSave = async (e) => {
    e.stopPropagation()
    if (!isAuthenticated) { navigate('/login'); return }
    const newSaved = !localSaved
    setLocalSaved(newSaved)
    try {
      await toggleSavePost(post.id)
    } catch (err) {
      setLocalSaved(!newSaved)
    }
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/r/${post.subreddit_name}/comments/${post.id}`
    try {
      if (navigator.share && window.innerWidth < 768) {
        await navigator.share({ title: post.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      } catch {
        window.prompt('Copy this link:', url)
      }
    }
  }
  const deleteMutation = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      setShowDeleteConfirm(false)
      setShowMenu(false)
      // Invalidate all feed caches so the post disappears
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['popular'] })
      if (onDelete) onDelete(post.id)
    }
  })

  const editMutation = useMutation({
    mutationFn: () => editPost(post.id, { title: editTitle.trim(), body: editBody }),
    onSuccess: () => {
      setShowEditModal(false)
      setShowMenu(false)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['popular'] })
    }
  })

    <div
      className="post-card rounded-none mb-3 cursor-pointer relative overflow-hidden transition-colors duration-100 p-3 sm:p-4 border-t border-[#2A3236]"
      onClick={() => navigate(`/r/${post.subreddit_name}/comments/${post.id}`)}
    >
      {/* Post Header */}
      <div className="flex justify-between items-center mb-2 z-10">
        <div className="flex items-center gap-2 text-xs text-[#82959b]">
          <div className="w-6 h-6 rounded-full bg-[#272729] flex items-center justify-center overflow-hidden shrink-0">
            {/* Placeholder for Subreddit/User Avatar */}
            <span className="text-[10px] text-white font-bold">{post.subreddit_name[0]?.toUpperCase()}</span>
          </div>
          <div className="flex items-center flex-wrap gap-1">
            <Link to={`/r/${post.subreddit_name}`} className="font-bold text-[#d7dadc] hover:underline" onClick={e => e.stopPropagation()}>
              r/{post.subreddit_name}
            </Link>
            <span className="text-[10px] mx-0.5">•</span>
            <span className="text-[#82959b]">{timeAgo(post.created_at)}</span>
          </div>
        </div>

        {/* 3 Dots Options */}
        <button className="text-[#82959b] pill-btn rounded-full p-1" onClick={e => e.stopPropagation()}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Post Title */}
      <h2 className="text-[18px] sm:text-[20px] font-bold text-[#d7dadc] leading-tight mb-2 break-words">
        {post.title}
      </h2>

      {/* Flair */}
      {post.flair_text && (
        <div className="mb-2">
          <span
            className="inline-block py-0.5 px-2 rounded-full text-xs font-bold mb-1"
            style={{
              background: post.flair_color || '#FFE500',
              color: '#000000'
            }}
          >
            {post.flair_text}
          </span>
        </div>
      )}

      {/* Post Body/Content */}
      {post.post_type === 'link' && post.url && (
        <a
          href={post.url}
          className="block text-sm text-[#8ca4e6] hover:underline break-all mb-3"
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
        >
          {post.url}
        </a>
      )}

      {post.image_url && (
        <div className="mb-3 rounded-xl overflow-hidden bg-black max-h-[512px] flex items-center justify-center">
          <img src={post.image_url} alt={post.title} className="max-w-full max-h-[512px] object-contain" />
        </div>
      )}

      {post.body && (
        <div className="text-sm text-[#82959b] leading-relaxed mb-3 line-clamp-4 break-words">
          {post.body}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center flex-wrap gap-2 mt-2" onClick={e => e.stopPropagation()}>
        {/* Vote Pill */}
        <div className="flex items-center pill-btn rounded-full">
          <button
            className={`p-2 rounded-l-full flex items-center justify-center transition-colors ${localVote === 1 ? 'text-[#FF4500]' : 'text-[#d7dadc] hover:text-[#FF4500]'}`}
            onClick={(e) => { e.stopPropagation(); handleVote(1); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
          <span className={`text-xs font-bold px-1 ${localVote === 1 ? 'text-[#FF4500]' : localVote === -1 ? 'text-[#7193ff]' : 'text-[#d7dadc]'}`}>
            {formatNumber(localScore)}
          </span>
          <button
            className={`p-2 rounded-r-full flex items-center justify-center transition-colors ${localVote === -1 ? 'text-[#7193ff]' : 'text-[#d7dadc] hover:text-[#7193ff]'}`}
            onClick={(e) => { e.stopPropagation(); handleVote(-1); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>

        {/* Comment Pill */}
        <button
          className="flex items-center gap-1.5 py-2 px-3 rounded-full pill-btn text-xs font-bold transition-colors"
          onClick={() => navigate(`/r/${post.subreddit_name}/comments/${post.id}`)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <path d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2v4l4-4h8z"></path>
          </svg>
          {formatNumber(post.comment_count)}
        </button>

        {/* Award Pill */}
        <button className="flex items-center gap-1.5 p-2 rounded-full pill-btn text-xs font-bold transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="12" cy="8" r="6"></circle>
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
          </svg>
        </button>

        {/* Share Pill */}
        <div className="relative">
          <button
            className="flex items-center gap-1.5 py-2 px-3 rounded-full pill-btn text-xs font-bold transition-colors"
            onClick={handleShare}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Share
          </button>
          {shareToast && (
            <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-[#1A282D] text-[#d7dadc] text-xs rounded-md whitespace-nowrap shadow-lg z-10">
              ✓ Link copied!
            </div>
          )}
        </div>

        {/* Save Pill */}
        <button
          className="flex items-center gap-1.5 py-2 px-3 rounded-full pill-btn text-xs font-bold transition-colors"
          onClick={handleSave}
        >
          <svg viewBox="0 0 24 24" fill={localSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          {localSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
