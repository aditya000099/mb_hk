import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import Navbar from '../components/layout/Navbar'
import { createSubreddit } from '../api/subreddits'
const NAME_REGEX = /^[a-zA-Z0-9_]{3,21}$/

export default function CreateSubredditPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('public')
  const [nsfw, setNsfw] = useState(false)
  const [nameError, setNameError] = useState('')
  const [serverError, setServerError] = useState('')

  const nameValid = NAME_REGEX.test(name)

  const createMutation = useMutation({
    mutationFn: () => createSubreddit({ name, description, type, nsfw }),
    onSuccess: () => {
      navigate(`/r/${name}`)
    },
    onError: (err) => {
      setServerError(err?.response?.data?.detail || 'Failed to create community. The name may already be taken.')
    },
  })

  const handleNameChange = (e) => {
    const val = e.target.value.replace(/\s/g, '')
    setName(val)
    if (val && !NAME_REGEX.test(val)) {
      setNameError('Community names must be 3–21 characters: letters, numbers, or underscores.')
    } else {
      setNameError('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setServerError('')
    if (!nameValid) { setNameError('Invalid community name.'); return }
    createMutation.mutate()
  }

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-48px)] bg-bg flex justify-center py-10 px-5">
        <div className="w-full max-w-[540px] bg-surface border border-border rounded-md p-8">
          <h1 className="text-[20px] font-bold text-text-primary pb-3 border-b border-border mb-5">Create a Community</h1>
          <p className="text-sm text-text-muted mb-6 -mt-3">
            Community names cannot be changed later. Choose wisely.
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-base font-bold text-text-primary">Name</label>
              <div className={`flex items-center border rounded-sm bg-input-bg overflow-hidden transition-colors duration-150 focus-within:border-brand focus-within:bg-surface ${nameError ? 'border-danger' : 'border-border'}`}>
                <span className="py-0 pr-2 pl-3 text-sm text-text-muted font-bold shrink-0">r/</span>
                <input
                  type="text"
                  className="flex-1 h-11 pr-3 bg-transparent border-none text-sm text-text-primary outline-none"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="community_name"
                  maxLength={21}
                  required
                />
              </div>
              {name && !nameError && (
                <span className="text-xs text-brand font-bold">r/{name}</span>
              )}
              {nameError && <span className="text-xs text-danger">{nameError}</span>}
              <span className="text-xs text-text-muted">{21 - name.length} characters remaining</span>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-base font-bold text-text-primary">Description <span className="text-xs font-normal text-text-muted">(optional)</span></label>
              <textarea
                className="w-full p-3 bg-input-bg border border-border rounded-sm text-sm text-text-primary resize-y outline-none font-inherit leading-relaxed transition-colors duration-150 focus:border-brand focus:bg-surface"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell people what your community is about"
                rows={4}
                maxLength={500}
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-base font-bold text-text-primary">Community Type</label>
              <div className="flex flex-col gap-2">
                {['public', 'restricted', 'private'].map(t => (
                  <label key={t} className="flex items-center gap-3 p-3 border border-border rounded-sm cursor-pointer transition-colors duration-100 hover:border-brand hover:bg-[#ff45001a]">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      checked={type === t}
                      onChange={() => setType(t)}
                      className="w-4 h-4 shrink-0 accent-brand"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-text-primary">
                        {t === 'public' ? '🌍 Public' : t === 'restricted' ? '🔒 Restricted' : '🔐 Private'}
                      </span>
                      <span className="text-xs text-text-muted">
                        {t === 'public'
                          ? 'Anyone can view, post, and comment'
                          : t === 'restricted'
                          ? 'Anyone can view, but only approved users can post'
                          : 'Only approved users can view and contribute'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* NSFW */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-3 p-3 border border-border rounded-sm cursor-pointer">
                <span className="py-0.5 px-2 rounded-pill bg-danger text-white text-xs font-bold shrink-0">NSFW</span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-text-primary">18+ Year Old Community</span>
                  <span className="text-xs text-text-muted">This community is for adults only</span>
                </div>
                <input
                  type="checkbox"
                  checked={nsfw}
                  onChange={e => setNsfw(e.target.checked)}
                  className="w-5 h-5 accent-brand shrink-0"
                />
              </label>
            </div>

            {serverError && <div className="bg-[rgba(217,48,37,0.08)] border border-[rgba(217,48,37,0.3)] rounded-sm py-2.5 px-3.5 text-sm text-danger">{serverError}</div>}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
                disabled={!nameValid || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
