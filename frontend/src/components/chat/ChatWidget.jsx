import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFriends, getMessages, sendMessage, toggleFriendRequest } from '../../api/chat';
import useAuthStore from '../../store/authStore';

export default function ChatWidget({ isOpen, onClose }) {
  const [activeFriend, setActiveFriend] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const currentUser = useAuthStore(s => s.user);

  // Fetch friends list
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    enabled: isAuthenticated && isOpen,
    refetchInterval: 5000,
  });

  // Fetch messages if a friend is selected
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeFriend?.id],
    queryFn: () => getMessages(activeFriend?.id),
    enabled: isAuthenticated && !!activeFriend && isOpen,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (content) => sendMessage(activeFriend.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', activeFriend.id]);
      setMessage('');
    }
  });

  const friendMutation = useMutation({
    mutationFn: toggleFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
    }
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-10 w-[340px] h-[450px] bg-[#0b1416] border border-[#2A3236] rounded-t-xl shadow-2xl flex flex-col z-[200] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A3236] bg-[#1A282D]">
        <h3 className="text-white font-bold text-sm">
          {activeFriend ? activeFriend.friend_display_name || activeFriend.friend_username : 'Chat & Friends'}
        </h3>
        <div className="flex gap-2">
          {activeFriend && (
            <button 
              className="text-[#82959b] hover:text-white bg-transparent border-none cursor-pointer"
              onClick={() => setActiveFriend(null)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <button 
            className="text-[#82959b] hover:text-white bg-transparent border-none cursor-pointer"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {!activeFriend ? (
        /* Friends List View */
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-6 text-center text-[#82959b] text-sm">
              You don't have any friends or pending requests yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {friends.map(f => {
                const isPending = f.status === 'pending';
                const isReceiver = f.friend_id === currentUser?.id; // they received the request
                return (
                  <div 
                    key={f.id} 
                    className="flex items-center justify-between p-3 border-b border-[#2A3236] hover:bg-[#1A282D] cursor-pointer transition-colors"
                    onClick={() => {
                      if (!isPending) {
                        setActiveFriend({ 
                          id: f.friend_id === currentUser?.id ? f.user_id : f.friend_id,
                          ...f
                        });
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#272729] flex items-center justify-center shrink-0 overflow-hidden">
                        {f.friend_avatar_url ? (
                          <img src={f.friend_avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-white font-bold">{f.friend_username[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{f.friend_display_name || f.friend_username}</span>
                        <span className="text-[#82959b] text-xs">@{f.friend_username}</span>
                      </div>
                    </div>
                    {isPending && isReceiver && (
                      <button 
                        className="px-3 py-1 bg-[#FF4500] text-white text-xs font-bold rounded-full border-none cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); friendMutation.mutate(f.user_id); }}
                      >
                        Accept
                      </button>
                    )}
                    {isPending && !isReceiver && (
                      <span className="text-xs text-[#82959b] italic">Pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Active Chat View */
        <>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-center text-[#82959b] text-xs my-auto">
                No messages yet. Say hi!
              </div>
            ) : (
              messages.map(msg => {
                const isMine = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${isMine ? 'bg-[#FF4500] text-white rounded-br-sm' : 'bg-[#272729] text-[#d7dadc] rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-[#2A3236] bg-[#0b1416]">
            <form 
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim()) sendMutation.mutate(message.trim());
              }}
            >
              <input 
                type="text" 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#1A282D] border border-[#2A3236] text-white text-sm rounded-full px-4 py-2 outline-none focus:border-[#FF4500]"
              />
              <button 
                type="submit"
                disabled={!message.trim() || sendMutation.isPending}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FF4500] text-white border-none cursor-pointer disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
