import { AlertTriangle, Building2, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountMenu } from '../components/AccountMenu'
import { AppLogo } from '../components/AppLogo'
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal'
import { NotificationCenter } from '../components/NotificationCenter'
import { useAuth } from '../hooks/useAuth'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { createWorkspace } from '../lib/workspaces'

export function WorkspacesHome() {
  const { user, profile } = useAuth()
  const { workspaces, loading, error } = useWorkspaces()
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const handleCreate = async (name: string) => {
    if (!user || !profile) return
    const { workspaceId, projectId } = await createWorkspace(name, {
      uid: user.uid,
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
    })
    navigate(`/w/${workspaceId}/p/${projectId}`)
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-white/10">
        <div className="flex items-center gap-2 font-semibold">
          <AppLogo size="md" />
          <span className="hidden sm:inline">Flowboard</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-base font-semibold">Your workspaces</h1>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <Plus size={14} />
            New
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle size={16} className="shrink-0" />
            Couldn't load your workspaces. Try refreshing the page.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          {!loading && !error && workspaces.length === 0 && (
            <div className="px-5 py-8 text-center">
              <Building2 className="mx-auto mb-2 text-zinc-400" size={22} />
              <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">No workspaces yet</p>
              <p className="mb-4 text-xs text-zinc-500">
                Create one to start a board with your team, or use an invite link someone sent you.
              </p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Create your workspace
              </button>
            </div>
          )}

          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => navigate(`/w/${workspace.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-white/5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Building2 size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{workspace.name}</p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] capitalize text-zinc-500 dark:bg-white/5">
                  {workspace.myRole}
                </span>
                <ChevronRight size={15} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
              </button>
            ))}
          </div>
        </div>
      </main>

      {creating && <CreateWorkspaceModal onCreate={handleCreate} onClose={() => setCreating(false)} />}
    </div>
  )
}
