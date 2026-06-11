import api from './axios'

export const getUser = async (username) => {
  const { data } = await api.get(`/users/${username}`)
  return data
}

export const updateProfile = async (profileData) => {
  const { data } = await api.put('/users/me', profileData)
  return data
}

export const getUserPosts = async (username) => {
  const { data } = await api.get(`/users/${username}/posts`)
  return data.posts
}

export const getUserComments = async (username) => {
  const { data } = await api.get(`/users/${username}/comments`)
  return data.comments
}

export const getSavedItems = async () => {
  const { data } = await api.get('/users/me/saved')
  return data.items
}

export const toggleSavePost = async (postId) => {
  const { data } = await api.post(`/posts/${postId}/save`)
  return data
}

export const toggleSaveComment = async (commentId) => {
  const { data } = await api.post(`/comments/${commentId}/save`)
  return data
}

export const uploadMedia = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.url
}
