import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'
import { createPost } from '../api/posts'
import { getSubreddit, getPopularSubreddits } from '../api/subreddits'
import { uploadMedia } from '../api/users'
const TABS = [
  { id: 'text', label: '📝 Post' },
  { id: 'image', label: '🖼️ Images & Video' },
  { id: 'link', label: '🔗 Link' },
]

export default function SubmitPage() {
  const navigate = useNavigate()
  const { name: routeName } = useParams()

  const [activeTab, setActiveTab] = useState('text')
  const [subredditName, setSubredditName] = useState(routeName || '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const { data: popularSubs } = useQuery({
    queryKey: ['popular-subreddits'],
    queryFn: getPopularSubreddits,
    staleTime: 1000 * 60 * 10,
  })

  const { data: subredditInfo } = useQuery({
    queryKey: ['subreddit', subredditName],
    queryFn: () => getSubreddit(subredditName),
    enabled: !!subredditName && subredditName.length > 1,
    retry: false,
  })

  const submitMutation = useMutation({
    mutationFn: (data) => createPost(subredditName, data),
    onSuccess: (data) => {
      navigate(`/r/${subredditName}/comments/${data.id}`)
    },
    onError: (err) => {
      setError(err?.response?.data?.detail || 'Failed to create post. Please try again.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!subredditName.trim()) { setError('Please select a community.'); return }
    if (!title.trim()) { setError('Please add a title.'); return }

    const data = {
      title: title.trim(),
      post_type: activeTab,
      subreddit_name: subredditName,
    }

    if (activeTab === 'text') data.body = body
    if (activeTab === 'link') {
      if (!url.trim()) { setError('Please add a URL.'); return }
      data.url = url.trim()
    }
    if (activeTab === 'image') {
      if (!imageUrl) { setError('Please upload an image first.'); return }
      data.image_url = imageUrl
    }

    submitMutation.mutate(data)
  }

  const handleImageSelect = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10 MB.')
      return
    }
    setError('')
    setImageUploading(true)
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
    try {
      const url = await uploadMedia(file)
      setImageUrl(url)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Image upload failed. Please try again.')
      setImagePreview('')
    } finally {
      setImageUploading(false)
    }
  }

  return (
    <PageLayout>
      <div className="flex-1 min-w-0 max-w-[740px]">
        <h1 className="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border">Create a Post</h1>

        {/* Community selector */}
        <div className="bg-surface border border-border rounded-sm p-3 mb-3 flex flex-col gap-1.5">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Choose a community</label>
          <select
            className="h-10 px-3 bg-input-bg border border-border rounded-sm text-sm text-text-primary cursor-pointer outline-none focus:border-brand"
            value={subredditName}
            onChange={e => setSubredditName(e.target.value)}
            disabled={!!routeName}
          >
            <option value="">Select a community</option>
            {popularSubs?.map(s => (
              <option key={s.id || s.name} value={s.name}>r/{s.name}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface border border-border rounded-t-sm overflow-hidden mb-0 border-b-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`flex-1 p-3 bg-transparent border-none border-r border-border text-sm font-bold text-text-muted cursor-pointer transition-colors duration-100 border-b-2 border-b-transparent last:border-r-0 hover:bg-hover hover:text-text-primary ${activeTab === tab.id ? 'text-brand border-b-brand bg-surface' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form className="bg-surface border border-border border-t-0 rounded-b-sm p-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col relative">
            <textarea
              className="w-full p-3 bg-input-bg border border-border rounded-sm text-lg font-medium text-text-primary outline-none resize-none font-inherit leading-relaxed transition-colors duration-150 focus:border-brand focus:bg-surface"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={300}
              rows={2}
              required
            />
            <span className="text-xs text-text-muted text-right mt-1">{title.length}/300</span>
          </div>

          {activeTab === 'text' && (
            <div className="flex flex-col relative">
              <textarea
                className="w-full p-3 bg-input-bg border border-border rounded-sm text-sm text-text-primary outline-none resize-y font-inherit leading-relaxed transition-colors duration-150 focus:border-brand focus:bg-surface"
                placeholder="Text (optional)"
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
              />
            </div>
          )}

          {activeTab === 'link' && (
            <div className="flex flex-col relative">
              <input
                type="url"
                className="w-full h-11 p-3 bg-input-bg border border-border rounded-sm text-sm text-text-primary outline-none resize-none font-inherit leading-relaxed transition-colors duration-150 focus:border-brand focus:bg-surface"
                placeholder="URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
          )}

          {activeTab === 'image' && (
            <div
              className="border-2 border-dashed border-[#2A3236] rounded-sm bg-[#0a0d0f] flex flex-col items-center justify-center min-h-[180px] relative cursor-pointer transition-colors hover:border-[#FF4500]"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#FF4500' }}
              onDragLeave={e => e.currentTarget.style.borderColor = ''}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.style.borderColor = ''
                const file = e.dataTransfer.files[0]
                if (file) handleImageSelect(file)
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleImageSelect(e.target.files[0])}
              />
              {imagePreview ? (
                <div className="relative w-full">
                  <img src={imagePreview} alt="preview" className="max-h-[300px] w-full object-contain rounded" />
                  {imageUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                      <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!imageUploading && imageUrl && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      ✓ Uploaded
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full hover:bg-black/80 transition-colors"
                    onClick={e => { e.stopPropagation(); setImagePreview(''); setImageUrl('') }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-[#82959b]">
                  {imageUploading ? (
                    <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-10 h-10 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                  <p className="text-sm font-medium">{imageUploading ? 'Uploading...' : 'Drag & drop or click to upload'}</p>
                  <p className="text-xs">PNG, JPG, GIF, WebP — max 10 MB</p>
                </div>
              )}
            </div>
          )}

          {error && <div className="bg-[rgba(217,48,37,0.08)] border border-[rgba(217,48,37,0.3)] rounded-sm py-2.5 px-3.5 text-sm text-danger">{error}</div>}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              className="py-2 px-6 rounded-pill text-sm font-bold cursor-pointer transition-colors duration-100 bg-transparent text-brand border border-brand hover:bg-[#ff45001a]"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-6 rounded-pill text-sm font-bold cursor-pointer border-none transition-colors duration-100 bg-brand text-white hover:not:disabled:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitMutation.isPending || !title.trim() || !subredditName}
            >
              {submitMutation.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
        <div className="bg-surface border border-border rounded-sm overflow-hidden mb-4">
          <div className="p-3 font-bold text-sm text-white bg-gradient-to-b from-[#46d160] to-brand">
            {subredditName ? `Posting to r/${subredditName}` : 'Posting Guidelines'}
          </div>
          <div className="p-3">
            {subredditInfo?.description && (
              <p className="text-sm text-text-secondary mb-3 leading-relaxed">{subredditInfo.description}</p>
            )}
            <ul className="list-decimal list-inside flex flex-col gap-2">
              <li className="text-sm text-text-primary">Remember the human</li>
              <li className="text-sm text-text-primary">Behave like you would in real life</li>
              <li className="text-sm text-text-primary">Look for the original source of content</li>
              <li className="text-sm text-text-primary">Search for duplicates before posting</li>
              <li className="text-sm text-text-primary">Read the community's rules</li>
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
