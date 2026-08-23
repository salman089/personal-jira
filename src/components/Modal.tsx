import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  widthClassName?: string
}

/** Shared glass-effect popup shell used by CreateTaskModal, SettingsPage dialogs, etc. */
export function Modal({ title, onClose, children, widthClassName = 'max-w-lg' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm dark:bg-black/60"
      />
      <div
        className={`relative flex max-h-[92vh] w-full ${widthClassName} flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl sm:p-6 dark:border-white/10 dark:bg-zinc-900/90 dark:backdrop-blur-xl`}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
