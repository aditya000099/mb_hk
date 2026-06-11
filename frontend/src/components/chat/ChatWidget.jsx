import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInbox, getMessages, sendMessage } from '../../api/chat';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import { format } from 'date-fns';

export default function ChatWidget() {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const currentUser = useAuthStore(s => s.user);
  
  const { isOpen, activeFriend, setActiveFriend, closeChat } = useChatStore();

  // Fetch inbox list instead of friends
  const { data: inbox = [] } = useQuery({
    queryKey: ['inbox'],
    queryFn: getInbox,
    enabled: isAuthenticated && isOpen,
    refetchInterval: 5000,
  });

  // Fetch messages if a friend is selected
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeFriend?.id],
    queryFn: () => getMessages(activeFriend?.id),
    enabled: isAuthenticated && !!activeFriend && isOpen,
    refetchInterval: 1000,
  });

  const sendMutation = useMutation({
    mutationFn: (content) => sendMessage(activeFriend.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', activeFriend.id]);
      queryClient.invalidateQueries(['inbox']);
      setMessage('');
    }
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-10 w-[700px] h-[550px] bg-[#0b1416] border border-[#2A3236] rounded-t-xl shadow-2xl flex flex-row z-[200] overflow-hidden">
      
      {/* Left Pane (Sidebar) */}
      <div className="w-[280px] flex flex-col border-r border-[#2A3236] shrink-0 bg-[#0b1416]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A3236]">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <h3 className="text-white font-bold text-sm">Chats</h3>
          </div>
          <div className="flex gap-2">
            <button className="text-[#d7dadc] hover:bg-[#1A282D] p-1 rounded-md transition-colors border-none bg-transparent cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </button>
            <button className="text-[#d7dadc] hover:bg-[#1A282D] p-1 rounded-md transition-colors border-none bg-transparent cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
            <button className="text-[#d7dadc] hover:bg-[#1A282D] p-1 rounded-md transition-colors border-none bg-transparent cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-col py-2 border-b border-[#2A3236]">
          <div className="flex items-center justify-between px-4 py-2 hover:bg-[#1A282D] cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#d7dadc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <span className="text-[#d7dadc] font-bold text-sm">Requests</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-[#FF4500] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">1</span>
              <svg className="w-4 h-4 text-[#82959b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2 hover:bg-[#1A282D] cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#d7dadc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 10h8M8 14h4" /></svg>
              <span className="text-[#d7dadc] font-bold text-sm">Threads</span>
            </div>
            <svg className="w-4 h-4 text-[#82959b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </div>

        {/* Inbox List */}
        <div className="flex-1 overflow-y-auto">
          {inbox.length === 0 ? (
            <div className="p-6 text-center text-[#82959b] text-xs">
              No conversations yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {inbox.map(conversation => {
                const isActive = activeFriend?.id === conversation.friend_id;
                return (
                  <div 
                    key={conversation.friend_id} 
                    className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${isActive ? 'bg-[#1A282D]' : 'hover:bg-[#1A282D]'}`}
                    onClick={() => setActiveFriend({
                      id: conversation.friend_id,
                      friend_username: conversation.friend_username,
                      friend_display_name: conversation.friend_display_name,
                      friend_avatar_url: conversation.friend_avatar_url,
                    })}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#272729] flex items-center justify-center shrink-0 overflow-hidden relative">
                      {conversation.friend_avatar_url ? (
                        <img src={conversation.friend_avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-white font-bold">{conversation.friend_username[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[#d7dadc] font-bold text-sm truncate pr-2">
                          {conversation.friend_display_name || conversation.friend_username}
                        </span>
                        <span className="text-[#82959b] text-[10px] shrink-0">
                          {format(new Date(conversation.latest_message_at), 'MMM d')}
                        </span>
                      </div>
                      <span className={`text-xs truncate ${conversation.unread_count > 0 ? 'text-white font-bold' : 'text-[#82959b]'}`}>
                        {conversation.latest_message}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane (Active Chat) */}
      <div className="flex-1 flex flex-col bg-[#0b1416]">
        {activeFriend ? (
          <>
            {/* Active Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A3236]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#272729] flex items-center justify-center shrink-0 overflow-hidden">
                  {activeFriend.friend_avatar_url ? (
                    <img src={activeFriend.friend_avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-white font-bold">{activeFriend.friend_username[0]?.toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-white font-bold text-sm">{activeFriend.friend_display_name || activeFriend.friend_username}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-[#82959b] hover:text-white bg-transparent border-none cursor-pointer">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button className="text-[#82959b] hover:text-white bg-transparent border-none cursor-pointer">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button className="text-[#82959b] hover:text-white bg-transparent border-none cursor-pointer" onClick={closeChat}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="text-center text-[#82959b] text-xs my-auto">No messages yet.</div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showHeader = !prevMsg || prevMsg.sender_id !== msg.sender_id || (new Date(msg.created_at) - new Date(prevMsg.created_at) > 300000); // 5 mins

                  return (
                    <div key={msg.id} className="flex flex-col gap-1 w-full">
                      {showHeader ? (
                        <div className={`flex items-end gap-3 mt-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {isMine ? (
                            <>
                              <div className="flex items-baseline gap-2">
                                <span className="text-[#d7dadc] font-bold text-sm">{currentUser?.username}</span>
                                <span className="text-[#82959b] text-[10px]">{format(new Date(msg.created_at), 'h:mm a')}</span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center shrink-0 overflow-hidden">
                                {currentUser?.avatar_url ? (
                                  <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs text-white font-bold">{currentUser?.username?.[0]?.toUpperCase()}</span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-full bg-[#272729] flex items-center justify-center shrink-0 overflow-hidden">
                                {activeFriend.friend_avatar_url ? (
                                  <img src={activeFriend.friend_avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs text-white font-bold">{activeFriend.friend_username[0]?.toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-[#d7dadc] font-bold text-sm">{activeFriend.friend_display_name || activeFriend.friend_username}</span>
                                <span className="text-[#82959b] text-[10px]">{format(new Date(msg.created_at), 'h:mm a')}</span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : null}
                      <div className={`px-[44px] text-[15px] ${isMine ? 'text-right text-[#d7dadc]' : 'text-left text-[#d7dadc]'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-[#0b1416]">
              <form 
                className="relative flex items-center w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) sendMutation.mutate(message.trim());
                }}
              >
                <input 
                  type="text" 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Message"
                  className="w-full bg-[#1A282D] text-[#d7dadc] text-sm rounded-xl px-5 py-3.5 pr-12 outline-none border-none placeholder:text-[#82959b] focus:bg-[#272729] transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!message.trim() || sendMutation.isPending}
                  className="absolute right-3 text-[#FF4500] hover:text-[#e03d00] bg-transparent border-none cursor-pointer disabled:opacity-50 p-1"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-[#1A282D] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#82959b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Welcome to Chats</h3>
            <p className="text-[#82959b] text-sm leading-relaxed max-w-[280px]">
              Select a conversation from the left to start messaging, or click the new chat icon to find a friend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
