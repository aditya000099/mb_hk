import api from './axios'

export const getComments = (postId, sort = 'best') =>
  api.get(`/posts/${postId}/comments?sort=${sort}`).then(r => r.data)
export const createComment = (postId, data) =>
  api.post(`/posts/${postId}/comments`, data).then(r => r.data)
export const voteComment = (commentId, value) =>
  api.post(`/comments/${commentId}/vote`, { value }).then(r => r.data)
export const deleteComment = (commentId) =>
  api.delete(`/comments/${commentId}`).then(r => r.data)
export const editComment = (commentId, body) =>
  api.put(`/comments/${commentId}`, { body }).then(r => r.data)
