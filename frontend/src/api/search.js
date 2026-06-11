import api from './axios'

export const searchAll = (q, { type = 'all', sort = 'relevance', t = 'all', limit = 25, after } = {}) =>
  api.get('/search', { params: { q, type, sort, t, limit, after } }).then(r => r.data)
