import { Building2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppLogo } from '../components/AppLogo'
import { useAuth } from '../hooks/useAuth'
import { firebaseErrorMessage } from '../lib/firebaseErrors'
import { getInvite, joinWorkspaceViaInvite } from '../lib/workspaces'
import type { WorkspaceInvite } from '../types'

export const PENDING_INVITE_KEY = 'flowboard-pending-invite'

type Status = 'loading' | 'not-found' | 'revoked' | 'ready' | 'joining' | 'error'

export function JoinInvitePage() {
  const { inviteId } = useParams<{ inviteId: string }>()
  const { user, profile, authLoading } = useAuth()
  const navigate = useNavigate()
  const [invite, setInvite] = useState<WorkspaceInvite | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')

  // Remember this invite immediately (regardless of sign-in state) so
  // AuthPage can bring the user right back here once they've signed in or
  // registered. This is a plain localStorage write, not React state, so it
  // doesn't matter that it re-runs on every render where inviteId is set.
  useEffect(() => {
    if (inviteId) window.localStorage.setItem(PENDING_INVITE_KEY, inviteId)
  }, [inviteId])

  const needsSignIn = !authLoading && !user

  useEffect(() => {
    if (!inviteId || !user) return
    window.localStorage.removeItem(PENDING_INVITE_KEY)

    getInvite(inviteId)
      .then((data) => {
        if (!data) {
          setStatus('not-found')
          return
        }
        const invite = data as unknown as WorkspaceInvite
        if (invite.revoked) {
          setStatus('revoked')
          return
        }
        setInvite(invite)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [inviteId, user])

  const handleJoin = async () => {
    if (!inviteId || !user || !profile) return
    setStatus('joining')
    try {
      const workspaceId = await joinWorkspaceViaInvite(inviteId, {
        uid: user.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
      })
      navigate(`/w/${workspaceId}`, { replace: true })
    } catch (err) {
      setError(firebaseErrorMessage(err))
      setStatus('error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
          <AppLogo size="md" />
          Flowboard
        </Link>

        {authLoading && <p className="text-sm text-zinc-500">Loading invite...</p>}
        {!authLoading && user && status === 'loading' && (
          <p className="text-sm text-zinc-500">Loading invite...</p>
        )}

        {status === 'not-found' && <p className="text-sm text-zinc-500">This invite link doesn't exist.</p>}
        {status === 'revoked' && <p className="text-sm text-zinc-500">This invite link has been revoked.</p>}
        {status === 'error' && <p className="text-sm text-red-600 dark:text-red-400">{error || 'Something went wrong.'}</p>}

        {needsSignIn && (
          <>
            <Building2 className="mx-auto mb-3 text-violet-500" size={28} />
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              You need a Flowboard account to accept this invite.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/register"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Create an account
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                Log in
              </Link>
            </div>
          </>
        )}

        {(status === 'ready' || status === 'joining') && user && invite && (
          <>
            <Building2 className="mx-auto mb-3 text-violet-500" size={28} />
            <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">You've been invited to join</p>
            <p className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{invite.workspaceName}</p>
            <button
              type="button"
              onClick={() => void handleJoin()}
              disabled={status === 'joining'}
              className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {status === 'joining' ? 'Joining...' : `Join ${invite.workspaceName}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
