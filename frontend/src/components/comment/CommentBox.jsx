import { useState } from 'react'
export default function CommentBox({ onSubmit, onCancel, placeholder = 'What are your thoughts?', autoFocus = false }) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const MAX_CHARS = 10000

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(text.trim())
      setText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col border border-border rounded overflow-hidden bg-surface mb-4" onSubmit={handleSubmit}>
      <textarea
        className="w-full min-h-[100px] p-3 text-sm text-text-primary bg-input-bg border-none resize-y outline-none font-inherit leading-relaxed focus:bg-surface placeholder:text-text-muted"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={MAX_CHARS}
        rows={4}
      />
      <div className="flex items-center justify-between py-2 px-3 bg-surface-raised border-t border-border">
        <span className="text-xs text-text-muted">
          {text.length} / {MAX_CHARS}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              className="py-1.5 px-4 rounded-pill text-sm font-bold cursor-pointer transition-colors duration-100 bg-transparent text-text-muted border border-transparent hover:bg-hover hover:text-text-primary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="py-1.5 px-4 rounded-pill text-sm font-bold cursor-pointer transition-opacity duration-100 bg-brand text-white hover:not:disabled:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!text.trim() || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  )
}
