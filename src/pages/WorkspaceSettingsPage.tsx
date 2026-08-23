import { AlertTriangle, ArrowLeft, Check, Copy, Link2, ShieldCheck, Trash2, UserMinus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useWorkspace } from '../hooks/useWorkspace'
import { useWorkspaceInvites } from '../hooks/useWorkspaceInvites'
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers'
import { firebaseErrorMessage } from '../lib/firebaseErrors'
import { deleteWorkspaceCascade, renameWorkspace } from '../lib/workspaces'
import type { WorkspaceRole } from '../types'

const TABS = ['General', 'Members', 'Invite links'] as const
type Tab = (typeof TABS)[number]

const fieldClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100'
const cardClass = 'rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]'

function buildInviteLink(inviteId: string) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/join/${inviteId}`
}

export function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { user } = useAuth()
  const { workspace, isAdmin, isOwner } = useWorkspace(workspaceId)
  const { members, setRole, remove } = useWorkspaceMembers(workspaceId)
  const { invites, create: createInvite, revoke: revokeInvite } = useWorkspaceInvites(workspaceId)
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Always starts on 'Members' (safe for everyone) rather than branching on
  // isAdmin here: that role comes from an async subscription that hasn't
  // resolved on the very first render, so an admin-only initial value would
  // never actually take effect -- and worse, without the isAdmin check
  // added to the tab CONTENT below, it briefly exposed the rename/delete
  // controls to non-admins too. Admins can just click "General" themselves.
  const [tab, setTab] = useState<Tab>('Members')
  const [name, setName] = useState(workspace?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (!workspaceId || !workspace || !user) return null

  // Everyone can see who's in the workspace; only admins/owners get the
  // General and Invite links tabs (renaming, deleting, and inviting).
  const visibleTabs = isAdmin ? TABS : (['Members'] as const)

  const handleSaveName = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setSavingName(true)
    try {
      await renameWorkspace(workspaceId, name.trim())
      showToast('Workspace renamed', 'success')
    } catch (err) {
      showToast(firebaseErrorMessage(err), 'error')
    } finally {
      setSavingName(false)
    }
  }

  const handleCreateInvite = async () => {
    setCreatingInvite(true)
    try {
      await createInvite(workspace.name, user.uid)
      showToast('Invite link created', 'success')
    } catch (err) {
      showToast(firebaseErrorMessage(err), 'error')
    } finally {
      setCreatingInvite(false)
    }
  }

  const handleCopyInvite = async (inviteId: string) => {
    await navigator.clipboard.writeText(buildInviteLink(inviteId))
    setCopiedId(inviteId)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleSetRole = async (uid: string, role: WorkspaceRole) => {
    try {
      await setRole(uid, role)
    } catch (err) {
      showToast(firebaseErrorMessage(err), 'error')
    }
  }

  const handleRemoveMember = async (uid: string) => {
    if (!window.confirm('Remove this person from the workspace?')) return
    try {
      await remove(uid)
    } catch (err) {
      showToast(firebaseErrorMessage(err), 'error')
    }
  }

  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== workspace.name) return
    setDeleting(true)
    try {
      await deleteWorkspaceCascade(workspaceId)
      navigate('/workspaces', { replace: true })
    } catch (err) {
      showToast(firebaseErrorMessage(err), 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 px-4 py-4 sm:px-6 dark:border-white/10">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/w/${workspaceId}`)}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-white/10"
            aria-label="Back to projects"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="truncate text-base font-semibold">{workspace.name} settings</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-white/10">
          {visibleTabs.map((tabName) => (
            <button
              key={tabName}
              type="button"
              onClick={() => setTab(tabName)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                tab === tabName
                  ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tabName}
            </button>
          ))}
        </div>

        {tab === 'General' && isAdmin && (
          <div className="space-y-4">
            <div className={cardClass}>
              <form onSubmit={handleSaveName} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Workspace name
                  </label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
                </div>
                <button
                  type="submit"
                  disabled={savingName || !name.trim() || name === workspace.name}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {savingName ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </div>

            {isOwner && (
              <div className={`${cardClass} border-red-500/20`}>
                <div className="mb-4 flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Delete this workspace</p>
                    <p className="text-sm text-zinc-500">
                      Permanently deletes every project, task, and comment in this workspace. This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="max-w-sm space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Type "{workspace.name}" to confirm
                    </label>
                    <input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteWorkspace()}
                    disabled={deleting || deleteConfirmText !== workspace.name}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Permanently delete workspace'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Members' && (
          <div className={cardClass}>
            <ul className="space-y-1">
              {members.map((member) => (
                <li
                  key={member.uid}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={member.displayName} photoURL={member.photoURL} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                        {member.displayName} {member.uid === user.uid && <span className="text-zinc-400">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {member.role === 'owner' ? (
                      <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400">
                        <ShieldCheck size={12} />
                        Owner
                      </span>
                    ) : (
                      isOwner && (
                        <button
                          type="button"
                          onClick={() => void handleSetRole(member.uid, member.role === 'admin' ? 'member' : 'admin')}
                          className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-white dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10"
                        >
                          {member.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        </button>
                      )
                    )}
                    {member.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveMember(member.uid)}
                        className="rounded-md p-1.5 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
                        aria-label="Remove member"
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'Invite links' && isAdmin && (
          <div className={cardClass}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-zinc-500">Anyone with an active link can join as a member.</p>
              <button
                type="button"
                onClick={() => void handleCreateInvite()}
                disabled={creatingInvite}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                <Link2 size={14} />
                New link
              </button>
            </div>

            <ul className="space-y-2">
              {invites
                .filter((invite) => !invite.revoked)
                .map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]"
                  >
                    <code className="min-w-0 flex-1 truncate text-xs text-zinc-500">{buildInviteLink(invite.id)}</code>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void handleCopyInvite(invite.id)}
                        className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white dark:hover:bg-white/10"
                        aria-label="Copy invite link"
                      >
                        {copiedId === invite.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void revokeInvite(invite.id)}
                        className="rounded-md p-1.5 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
                        aria-label="Revoke invite link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              {invites.filter((invite) => !invite.revoked).length === 0 && (
                <p className="py-4 text-center text-sm text-zinc-400">No active invite links.</p>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
