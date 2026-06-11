import api from './axios'

export const getSubreddit = (name) => api.get(`/r/${name}`).then(r => r.data)
export const createSubreddit = (data) => api.post('/r/', data).then(r => r.data)
export const joinSubreddit = (name) => api.post(`/r/${name}/join`).then(r => r.data)
export const getPopularSubreddits = () => api.get('/r/popular').then(r => r.data)
export const searchSubreddits = (q) => api.get(`/r/search?q=${q}`).then(r => r.data)
