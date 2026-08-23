import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLogo } from '../components/AppLogo'
import { GoogleIcon } from '../components/GoogleIcon'
import { useAuth } from '../hooks/useAuth'
import { firebaseErrorMessage } from '../lib/firebaseErrors'
import { PENDING_INVITE_KEY } from './JoinInvitePage'

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500'

interface Props {
  mode: 'login' | 'register'
}

export function AuthPage({ mode }: Props) {
  const { user, profileLoading, signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth()
  const navigate = useNavigate()
  const isRegister = mode === 'register'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  useEffect(() => {
    if (!user || profileLoading) return
    const pendingInvite = window.localStorage.getItem(PENDING_INVITE_KEY)
    navigate(pendingInvite ? `/join/${pendingInvite}` : '/workspaces', { replace: true })
  }, [user, profileLoading, navigate])

  const handleGoogle = async () => {
    setError('')
    setGoogleSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(firebaseErrorMessage(err))
    } finally {
      setGoogleSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (isRegister) {
      if (!name.trim()) return setError('Please enter your name.')
      if (password.length < 6) return setError('Password must be at least 6 characters.')
      if (password !== confirmPassword) return setError('Passwords do not match.')
    }

    setSubmitting(true)
    try {
      if (isRegister) {
        await registerWithEmail(name.trim(), email.trim(), password)
      } else {
        await signInWithEmail(email.trim(), password)
      }
    } catch (err) {
      setError(firebaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(139,92,246,0.12),transparent_60%)]" />

      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
          <AppLogo size="md" />
          Flowboard
        </Link>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-white/[0.03]">
          <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mb-6 text-sm text-zinc-500">
            {isRegister ? 'Join your team on Flowboard.' : 'Log in to your Flowboard workspace.'}
          </p>

          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={googleSubmitting}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <GoogleIcon size={16} />
            {googleSubmitting ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            <span className="text-xs text-zinc-400">or</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Jordan Lee"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400">
                  Log in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400">
                  Create one
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
