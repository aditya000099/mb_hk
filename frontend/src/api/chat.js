import api from './axios'

export const toggleFriendRequest = async (friendId) => {
  const { data } = await api.post(`/chat/friends/${friendId}`);
  return data;
};

export const getFriends = async () => {
  const { data } = await api.get('/chat/friends');
  return data;
};

export const sendMessage = async (recipientId, content) => {
  const { data } = await api.post(`/chat/messages/${recipientId}`, { content });
  return data;
};

export const getMessages = async (otherId) => {
  const { data } = await api.get(`/chat/messages/${otherId}`);
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get('/chat/unread');
  return data;
};

export const getInbox = async () => {
  const { data } = await api.get('/chat/inbox');
  return data;
};
