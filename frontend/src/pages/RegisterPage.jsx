import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/auth'
import useAuthStore from '../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    console.log('d')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const newErrors = {}
    if (form.username.length < 3) newErrors.username = 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) newErrors.username = 'Only letters, numbers, _ and - allowed'
    if (!form.email.includes('@')) newErrors.email = 'Enter a valid email'
    if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm) newErrors.confirm = 'Passwords do not match'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const { access_token, refresh_token } = await registerApi({
        username: form.username,
        email: form.email,
        password: form.password,
      })

      // Set tokens so getMe interceptor works
      useAuthStore.getState().setTokens(access_token, refresh_token)

      // Build a lightweight user object from form data (profile fetched on next load)
      const user = { username: form.username, email: form.email, karma: 0, post_karma: 0, comment_karma: 0 }
      setAuth(user, access_token, refresh_token)
      navigate('/', { replace: true })
    } catch (err) {
      setApiError(
        err.response?.data?.detail || 'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-[400px] bg-surface rounded shadow-modal p-8">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <svg className="w-10 h-10" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="10" fill="#FF4500" />
            <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.95.68l-2.38-.5a.26.26 0 0 0-.31.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .66-1.13zm-9.83 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.56 2.71a3.54 3.54 0 0 1-2.4.73 3.54 3.54 0 0 1-2.4-.73.25.25 0 0 1 .35-.35 3.05 3.05 0 0 0 2.05.58 3.05 3.05 0 0 0 2.05-.58.25.25 0 0 1 .35.35zm-.16-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white" />
          </svg>
          <span className="text-[22px] font-bold text-text-primary">reddit</span>
        </div>

        <h1 className="text-lg font-bold text-center mb-1 text-text-primary">Sign up</h1>
        <p className="text-sm text-text-muted text-center mb-6">By continuing, you agree to our User Agreement and Privacy Policy.</p>

        {apiError && <div className="bg-[rgba(217,48,37,0.08)] border border-[rgba(217,48,37,0.3)] rounded p-2.5 text-sm text-danger text-center mb-4">{apiError}</div>}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide" htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className={`h-11 px-3.5 bg-input-bg border rounded text-base text-text-primary outline-none transition-colors w-full focus:bg-surface ${errors.username ? 'border-danger' : 'border-border focus:border-brand'}`}
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
            {errors.username && <span className="text-sm text-danger">{errors.username}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`h-11 px-3.5 bg-input-bg border rounded text-base text-text-primary outline-none transition-colors w-full focus:bg-surface ${errors.email ? 'border-danger' : 'border-border focus:border-brand'}`}
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            {errors.email && <span className="text-sm text-danger">{errors.email}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={`h-11 px-3.5 bg-input-bg border rounded text-base text-text-primary outline-none transition-colors w-full focus:bg-surface ${errors.password ? 'border-danger' : 'border-border focus:border-brand'}`}
              placeholder="Password (min 8 characters)"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {errors.password && <span className="text-sm text-danger">{errors.password}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              className={`h-11 px-3.5 bg-input-bg border rounded text-base text-text-primary outline-none transition-colors w-full focus:bg-surface ${errors.confirm ? 'border-danger' : 'border-border focus:border-brand'}`}
              placeholder="Confirm your password"
              value={form.confirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {errors.confirm && <span className="text-sm text-danger">{errors.confirm}</span>}
          </div>

          <button type="submit" className="h-11 bg-brand text-white border-none rounded-pill text-base font-bold cursor-pointer transition-all mt-1 hover:not:disabled:bg-brand-hover active:not:disabled:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          Already a redditor?{' '}
          <Link to="/login" className="text-brand font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
