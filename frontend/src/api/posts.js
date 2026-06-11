import api from './axios'

export const getSubredditPosts = (name, params) => api.get(`/r/${name}/posts`, { params }).then(r => r.data)
export const createPost = (subredditName, data) => api.post(`/r/${subredditName}/posts`, data).then(r => r.data)
export const getPost = (postId) => api.get(`/posts/${postId}`).then(r => r.data)
export const deletePost = (postId) => api.delete(`/posts/${postId}`).then(r => r.data)
export const votePost = (postId, value) => api.post(`/posts/${postId}/vote`, { value }).then(r => r.data)
export const getFeed = (params) => api.get('/feed', { params }).then(r => r.data)
export const getPopularFeed = (params) => api.get('/feed/popular', { params }).then(r => r.data)
