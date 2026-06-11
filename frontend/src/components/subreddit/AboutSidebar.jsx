import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { formatNumber } from '../../utils/time'

export default function AboutSidebar({ subreddit }) {
  // Use date-fns to format like "Oct 12, 2023"
  const createdStr = subreddit.created_at 
    ? format(new Date(subreddit.created_at), 'MMM d, yyyy')
    : 'Unknown'

  // Generate a fake online count for the "contributions" stat
  const contributions = Math.floor(Math.random() * 50) + 10

  return (
    <div className="bg-[#0B1416] rounded-lg overflow-hidden flex flex-col">
      <div className="p-4">
        {/* Title */}
        <h2 className="font-bold text-base text-text-primary mb-2">
          {subreddit.display_name || subreddit.name}
        </h2>
        
        {/* Description */}
        <p className="text-sm text-text-secondary leading-snug mb-4">
          {subreddit.description || `Welcome to ${subreddit.display_name || subreddit.name}.`}
        </p>

        {/* Details List */}
        <div className="flex flex-col gap-3 text-sm text-text-secondary mb-4">
          <div className="flex items-center gap-2">
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5">
              <path d="M14.5 3A1.5 1.5 0 0 1 16 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 15.5v-11A1.5 1.5 0 0 1 5.5 3V2a.5.5 0 0 1 1 0v1h7V2a.5.5 0 0 1 1 0v1Zm-9 1A.5.5 0 0 0 5 4.5v11a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-9ZM6 7h8v1H6V7Zm0 3h8v1H6v-1Zm0 3h5v1H6v-1Z" />
            </svg>
            <span>Created {createdStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm4.58 4A4.32 4.32 0 0 1 15 7.5a16.85 16.85 0 0 1-2.22 8 6.49 6.49 0 0 0 1.8-9.5Zm-1.89-2A17 17 0 0 0 10 16.96 17 17 0 0 0 7.31 4a6.49 6.49 0 0 1 5.38 0ZM5.42 6a6.49 6.49 0 0 0-1.8 9.5A16.85 16.85 0 0 1 5 7.5c0-.52.14-1.03.42-1.5Z" />
            </svg>
            <span>Public</span>
          </div>
        </div>

        <div className="h-[1px] bg-[#2A3236] my-4" />

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-base font-bold text-text-primary">
              {formatNumber(subreddit.member_count ?? 0)}
            </span>
            <span className="text-xs text-text-muted">Members</span>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-base font-bold text-text-primary">
              {contributions}
            </span>
            <span className="text-xs text-text-muted">Online</span>
          </div>
        </div>

        <div className="h-[1px] bg-[#2A3236] my-4" />

        {/* Moderators */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Moderators
          </div>
          
          <button className="w-full py-2 px-4 rounded-full bg-[#2A3236] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#3d484d] transition-colors flex items-center justify-center gap-2">
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
              <path d="M18 5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15V5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 18 5ZM4 5v1.4l5.36 3.8a1 1 0 0 0 1.15 0L16 6.45V5H4Zm12 10V8.2l-5.14 3.65a2 2 0 0 1-2.32 0L4 8.24V15h12Z"/>
            </svg>
            Message Mods
          </button>

          {/* Moderator List mock */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-white font-bold hover:underline cursor-pointer">
                u/username
              </span>
              <span className="text-xs text-text-muted">Creator</span>
            </div>
          </div>

          <button className="w-full py-2 px-4 rounded-full bg-[#2A3236] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#3d484d] transition-colors mt-2">
            View all moderators
          </button>
        </div>
      </div>
    </div>
  )
}
