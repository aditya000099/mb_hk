import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login as loginApi, getMe } from '../api/auth'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({ username_or_email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { access_token, refresh_token } = await loginApi(form)
      // Set tokens first so the Axios interceptor can attach the header
      useAuthStore.getState().setTokens(access_token, refresh_token)
      // Now fetch full user profile
      const profile = await getMe()
      setAuth(profile, access_token, refresh_token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Invalid credentials. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-[400px] bg-surface rounded shadow-modal p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <svg className="w-10 h-10" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="10" fill="#FF4500" />
            <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.95.68l-2.38-.5a.26.26 0 0 0-.31.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .66-1.13zm-9.83 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.56 2.71a3.54 3.54 0 0 1-2.4.73 3.54 3.54 0 0 1-2.4-.73.25.25 0 0 1 .35-.35 3.05 3.05 0 0 0 2.05.58 3.05 3.05 0 0 0 2.05-.58.25.25 0 0 1 .35.35zm-.16-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
          </svg>
          <span className="text-[22px] font-bold text-text-primary">reddit</span>
        </div>

        <h1 className="text-lg font-bold text-center mb-1 text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-muted text-center mb-6">By continuing, you agree to our User Agreement and Privacy Policy.</p>

        {error && <div className="bg-[rgba(217,48,37,0.08)] border border-[rgba(217,48,37,0.3)] rounded p-2.5 text-sm text-danger text-center mb-4">{error}</div>}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide" htmlFor="username_or_email">Username or Email</label>
            <input
              id="username_or_email"
              name="username_or_email"
              type="text"
              className="h-11 px-3.5 bg-input-bg border border-border rounded text-base text-text-primary outline-none transition-colors w-full focus:border-brand focus:bg-surface"
              placeholder="Username or email"
              value={form.username_or_email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="h-11 px-3.5 bg-input-bg border border-border rounded text-base text-text-primary outline-none transition-colors w-full focus:border-brand focus:bg-surface"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="h-11 bg-brand text-white border-none rounded-pill text-base font-bold cursor-pointer transition-all mt-1 hover:not:disabled:bg-brand-hover active:not:disabled:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          New to Reddit?{' '}
          <Link to="/register" className="text-brand font-bold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
