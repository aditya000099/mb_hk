import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function CreatePostShortcut() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()

  if (!user) return null

  return (
    <div className="bg-surface border border-border rounded-sm p-2 mb-4 flex items-center gap-2">
      <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          <span>{user.username?.[0]?.toUpperCase() || 'U'}</span>
        )}
      </div>
      <input
        type="text"
        placeholder="Create Post"
        className="flex-1 bg-input-bg border border-border hover:border-brand hover:bg-surface focus:bg-surface focus:border-brand rounded-md h-10 px-4 text-sm outline-none transition-colors duration-150 cursor-text"
        onClick={() => navigate('/submit')}
        readOnly
      />
      <button className="w-10 h-10 rounded hover:bg-hover flex items-center justify-center text-text-muted transition-colors duration-100" onClick={() => navigate('/submit')}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </button>
      <button className="w-10 h-10 rounded hover:bg-hover flex items-center justify-center text-text-muted transition-colors duration-100" onClick={() => navigate('/submit')}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5.172 8.828a2 2 0 11-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}
