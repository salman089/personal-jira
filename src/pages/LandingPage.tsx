import { KanbanSquare, Link2, Users, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLogo } from '../components/AppLogo'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../hooks/useAuth'

const FEATURES = [
  {
    icon: KanbanSquare,
    title: 'Drag-and-drop board',
    description: 'Move work through Backlog, To Do, In Progress, and Done.',
  },
  {
    icon: Users,
    title: 'Your own account',
    description: 'Everyone registers and manages their own profile -- no gatekeeping.',
  },
  {
    icon: Link2,
    title: 'Shareable task links',
    description: 'Send a direct link to any task, no digging required.',
  },
  {
    icon: Zap,
    title: 'Real-time notifications',
    description: 'Get notified the moment work is assigned to you or a deadline is close.',
  },
]

export function LandingPage() {
  const { user, profileLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !profileLoading) navigate('/workspaces', { replace: true })
  }, [user, profileLoading, navigate])

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(139,92,246,0.15),transparent_60%)]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <AppLogo size="md" />
          Flowboard
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            to="/login"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-zinc-50 sm:px-4 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-20 pt-12 text-center sm:px-6 sm:pt-24">
        <span className="inline-block rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          A project board built for small teams
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Ship work, not overhead.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-zinc-600 dark:text-zinc-400">
          Flowboard is a simple Kanban board for you and your team. Create your
          own account, invite your teammates, and start moving tasks across
          the board together.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500 sm:w-auto"
          >
            Create your account
          </Link>
          <Link
            to="/login"
            className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            Log in
          </Link>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:mt-20 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <Icon className="mb-3 text-violet-600 dark:text-violet-400" size={20} />
              <h3 className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
              <p className="text-sm text-zinc-500">{description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
