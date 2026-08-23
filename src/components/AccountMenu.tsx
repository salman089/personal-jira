import { Building2, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Avatar'
import { ThemeToggle } from './ThemeToggle'

export function AccountMenu() {
  const { profile, signOutUser } = useAuth()
  const [open, setOpen] = useState(false)

  if (!profile) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full transition hover:ring-2 hover:ring-violet-500/30"
        aria-label="Account menu"
      >
        <Avatar name={profile.displayName} photoURL={profile.photoURL} size="md" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-white/10">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{profile.displayName}</p>
              <p className="truncate text-xs text-zinc-500">{profile.email}</p>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Appearance</span>
              <ThemeToggle />
            </div>

            <div className="border-t border-zinc-200 p-1 dark:border-white/10">
              <Link
                to="/workspaces"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                <Building2 size={15} />
                Workspaces
              </Link>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                <Settings size={15} />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
