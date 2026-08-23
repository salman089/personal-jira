import { ArrowLeft, ChevronRight, FolderKanban, Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AccountMenu } from '../components/AccountMenu'
import { AppLogo } from '../components/AppLogo'
import { CreateProjectModal } from '../components/CreateProjectModal'
import { NotificationCenter } from '../components/NotificationCenter'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useWorkspace } from '../hooks/useWorkspace'

export function ProjectsHome() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { user } = useAuth()
  const { workspace, isAdmin, loading: workspaceLoading } = useWorkspace(workspaceId)
  const { projects, loading: projectsLoading, createProject } = useProjects(workspaceId)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const handleCreate = async (name: string, description: string) => {
    if (!user) return
    const projectId = await createProject(name, description, user.uid)
    if (projectId) navigate(`/w/${workspaceId}/p/${projectId}`)
  }

  if (!workspaceLoading && !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-center dark:bg-zinc-950">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Workspace not found</p>
          <Link to="/workspaces" className="text-sm text-violet-600 hover:text-violet-500 dark:text-violet-400">
            Back to your workspaces
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/workspaces" className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10">
            <ArrowLeft size={16} />
          </Link>
          <AppLogo size="sm" className="shrink-0" />
          <span className="truncate font-semibold">{workspace?.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NotificationCenter />
          {isAdmin && workspaceId && (
            <Link
              to={`/w/${workspaceId}/settings`}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 sm:px-3 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              <Settings size={15} />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-2 text-sm font-medium text-white transition hover:bg-violet-500 sm:px-3"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New project</span>
          </button>
          <div className="border-l border-zinc-200 pl-2 sm:pl-3 dark:border-white/10">
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-base font-semibold">Projects</h1>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          {!projectsLoading && projects.length === 0 && (
            <div className="px-5 py-8 text-center">
              <FolderKanban className="mx-auto mb-2 text-zinc-400" size={22} />
              <p className="mb-4 text-sm text-zinc-500">No projects yet.</p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Create a project
              </button>
            </div>
          )}

          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/w/${workspaceId}/p/${project.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-white/5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <FolderKanban size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{project.name}</p>
                  {project.description && (
                    <p className="truncate text-xs text-zinc-500">{project.description}</p>
                  )}
                </div>
                <ChevronRight size={15} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
              </Link>
            ))}
          </div>
        </div>
      </main>

      {creating && <CreateProjectModal onCreate={handleCreate} onClose={() => setCreating(false)} />}
    </div>
  )
}
