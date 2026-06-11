import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'
import { createPost } from '../api/posts'
import { getSubreddit, getPopularSubreddits } from '../api/subreddits'
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
  const [error, setError] = useState('')

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

    submitMutation.mutate(data)
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
            <div className="h-[120px] bg-surface-raised border-2 border-dashed border-border rounded-sm flex items-center justify-center text-text-muted text-sm flex-col relative">
              <p>Image & video upload coming soon.</p>
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
