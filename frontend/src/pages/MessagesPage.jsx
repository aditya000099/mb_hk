import PageLayout from '../components/layout/PageLayout'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function MessagesPage() {
  const user = useAuthStore(s => s.user)

  return (
    <PageLayout>
      <div className="flex-1 min-w-0 max-w-[740px]">
        {/* Header */}
        <div className="bg-[#0f1113] border border-[#2A3236] rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <svg className="w-6 h-6 text-[#FF4500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h1 className="text-lg font-bold text-[#d7dadc]">Messages</h1>
          </div>
          <p className="text-sm text-[#82959b]">Your inbox and direct messages</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#2A3236] mb-4">
          {['Inbox', 'Sent', 'All'].map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-[2px] transition-colors ${
                i === 0
                  ? 'text-[#d7dadc] border-[#d7dadc]'
                  : 'text-[#82959b] border-transparent hover:text-[#d7dadc]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1A282D] flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-[#82959b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h8M8 14h4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#d7dadc] mb-2">Your inbox is empty</h2>
          <p className="text-sm text-[#82959b] max-w-[320px] leading-relaxed mb-6">
            When you receive messages or replies, they'll show up here. Start a conversation by visiting someone's profile.
          </p>
          <Link
            to="/"
            className="px-6 py-2.5 rounded-full bg-[#FF4500] text-white text-sm font-bold hover:bg-[#e03d00] transition-colors"
          >
            Browse Reddit
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
        <div className="bg-[#0f1113] border border-[#2A3236] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold text-[#d7dadc]">u/{user?.username}</p>
              <p className="text-xs text-[#82959b]">Reddit Inbox</p>
            </div>
          </div>
          <div className="h-[1px] bg-[#2A3236] mb-3" />
          <p className="text-xs text-[#82959b] leading-relaxed">
            Manage your messages, post replies, username mentions, and other notifications here.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
