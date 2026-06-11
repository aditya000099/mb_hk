import PageLayout from '../components/layout/PageLayout'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getInbox } from '../api/chat'
import useAuthStore from '../store/authStore'
import useChatStore from '../store/chatStore'
import { formatDistanceToNow } from 'date-fns'

export default function MessagesPage() {
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const openChat = useChatStore(s => s.openChat)

  const { data: inbox = [], isLoading } = useQuery({
    queryKey: ['inbox'],
    queryFn: getInbox,
    enabled: isAuthenticated,
    refetchInterval: 5000,
  })

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
          <button className="px-4 py-2.5 text-sm font-bold border-b-2 -mb-[2px] transition-colors text-[#d7dadc] border-[#d7dadc]">
            Inbox
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#0f1113] border border-[#2A3236] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-[#82959b] text-sm">Loading messages...</div>
          ) : inbox.length === 0 ? (
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
          ) : (
            <div className="flex flex-col">
              {inbox.map((conversation) => (
                <div 
                  key={conversation.friend_id} 
                  className="flex items-start gap-4 p-4 border-b border-[#2A3236] hover:bg-[#1A282D] transition-colors cursor-pointer"
                  onClick={() => openChat({
                    id: conversation.friend_id,
                    friend_username: conversation.friend_username,
                    friend_display_name: conversation.friend_display_name,
                    friend_avatar_url: conversation.friend_avatar_url,
                  })}
                >
                  <div className="w-12 h-12 rounded-full bg-[#272729] flex items-center justify-center shrink-0 overflow-hidden text-white font-bold text-lg hover:opacity-80">
                    {conversation.friend_avatar_url ? (
                      <img src={conversation.friend_avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      conversation.friend_username[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-[#d7dadc] font-bold text-sm truncate">
                        {conversation.friend_display_name || conversation.friend_username}
                        <span className="text-[#82959b] font-normal ml-2">@{conversation.friend_username}</span>
                      </div>
                      <span className="text-xs text-[#82959b] shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conversation.latest_message_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-white font-bold' : 'text-[#82959b]'}`}>
                        {conversation.latest_message}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="bg-[#FF4500] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {conversation.unread_count} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
