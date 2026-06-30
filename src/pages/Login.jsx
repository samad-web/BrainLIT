import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudent } from '../context/StudentContext.jsx'
import { signInAdmin, getAdminSession, adminConfigured } from '../lib/supabaseAuth.js'
import Logo from '../components/Logo.jsx'

// ONE login for everyone. We try a student login first; if that fails we check
// the single admin account. Students land on the kid dashboard, the admin on
// /admin. (Class creation lives inside the admin dashboard, not here.)
export default function Login() {
  const navigate = useNavigate()
  const { identity, login } = useStudent()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Already signed in → skip the login page and go to the right dashboard.
  useEffect(() => {
    if (identity?.studentId) { navigate('/', { replace: true }); return }
    let on = true
    getAdminSession().then((s) => { if (on && s) navigate('/admin', { replace: true }) })
    return () => { on = false }
  }, [identity, navigate])

  const submit = async (e) => {
    e?.preventDefault()
    setError('')
    if (!username.trim() || !password) return setError('Enter your username and password.')
    setBusy(true)
    try {
      // 1) Try student credentials (username, no email).
      try {
        await login(username, password)
        navigate('/', { replace: true })
        return
      } catch (err) {
        if (err?.kind && err.kind !== 'bad-login') throw err // a real error, not "wrong login"
      }
      // 2) Admin signs in with their email via Supabase Auth.
      if (username.includes('@')) {
        if (!adminConfigured()) { setError('Admin sign-in is not configured.'); return }
        try {
          await signInAdmin(username, password)
          navigate('/admin', { replace: true })
          return
        } catch (e) {
          // Show the real reason for the admin (e.g. "Email not confirmed").
          setError(e?.message || 'Admin sign-in failed.')
          return
        }
      }
      setError('Hmm, that username or password is wrong. Try again!')
    } catch {
      setError('Could not sign in right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Brand hero */}
      <div className="bg-brand text-white">
        <div className="mx-auto max-w-md px-6 py-10 flex flex-col items-center text-center">
          <Logo size={72} />
          <h1 className="mt-4 font-display font-extrabold text-3xl">RACE Coach</h1>
          <p className="mt-1 font-body text-white/90">Sign in to check your prompts!</p>
        </div>
      </div>

      {/* Login card */}
      <div className="flex-1 flex items-start justify-center px-6 -mt-8">
        <form onSubmit={submit} className="w-full max-w-md bg-white border border-neutral-200 rounded-card shadow-soft p-6">
          <h2 className="font-display font-bold text-xl text-indigo-ink">Welcome back! 👋</h2>
          <p className="font-body text-sm text-neutral-500 mt-1">
            Students: use your username. Admin: use your email.
          </p>

          <label className="block mt-5">
            <span className="font-display font-bold text-sm text-indigo-ink">Username or email</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              className="mt-1.5 w-full bg-cream border-2 border-neutral-200 rounded-[14px] px-4 py-3 font-body focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none"
              placeholder="Username or email"
            />
          </label>

          <label className="block mt-4">
            <span className="font-display font-bold text-sm text-indigo-ink">Password</span>
            <div className="mt-1.5 relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-cream border-2 border-neutral-200 rounded-[14px] px-4 py-3 pr-12 font-body focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="••••••"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-display font-bold text-purple-600" tabIndex={-1}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && <p className="mt-4 font-body text-circuit-pink font-bold text-sm">{error}</p>}

          <button type="submit" disabled={busy} className="mt-6 w-full bg-brand text-white rounded-pill shadow-glow font-display font-bold py-3.5 text-lg hover:-translate-y-0.5 transition disabled:opacity-60 disabled:translate-y-0">
            {busy ? 'Signing in…' : 'Log in 🚀'}
          </button>
        </form>
      </div>

      <p className="mx-auto max-w-md text-center text-xs font-body text-neutral-400 px-6 py-6">
        We only store your first name and your practice scores — no emails.
        Please don't type real personal details into your prompts.
      </p>
    </div>
  )
}
