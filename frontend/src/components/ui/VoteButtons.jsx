import { useState } from 'react'
import { formatNumber } from '../../utils/time'
export default function VoteButtons({ score, userVote, onVote, vertical = true }) {
  const [optimisticScore, setOptimisticScore] = useState(score)
  const [optimisticVote, setOptimisticVote] = useState(userVote ?? 0)

  const handleVote = async (value) => {
    const newVote = optimisticVote === value ? 0 : value
    const diff = newVote - optimisticVote
    setOptimisticScore(prev => prev + diff)
    setOptimisticVote(newVote)
    try {
      await onVote(newVote)
    } catch {
      // revert on error
      setOptimisticScore(score)
      setOptimisticVote(userVote ?? 0)
    }
  }

  const isUp = optimisticVote === 1
  const isDown = optimisticVote === -1

  return (
    <div className={`flex items-center gap-1 ${vertical ? 'flex-col' : 'flex-row'}`}>
      <button 
        className={`bg-transparent border-none p-1 rounded-[2px] cursor-pointer flex items-center justify-center transition-colors duration-100 hover:bg-hover hover:text-upvote ${isUp ? 'text-upvote' : 'text-text-muted'}`} 
        onClick={() => handleVote(1)} 
        aria-label="Upvote"
      >
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M10 3l7 8H3l7-8z" /></svg>
      </button>
      <span className={`text-xs font-bold min-w-[24px] text-center transition-colors duration-150 ${isUp ? 'text-upvote' : isDown ? 'text-downvote' : 'text-text-muted'}`}>
        {formatNumber(optimisticScore)}
      </span>
      <button 
        className={`bg-transparent border-none p-1 rounded-[2px] cursor-pointer flex items-center justify-center transition-colors duration-100 hover:bg-hover hover:text-downvote ${isDown ? 'text-downvote' : 'text-text-muted'}`} 
        onClick={() => handleVote(-1)} 
        aria-label="Downvote"
      >
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M10 17l-7-8h14l-7 8z" /></svg>
      </button>
    </div>
  )
}
