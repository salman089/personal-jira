import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { ToastContext, type ToastVariant } from './toast-context'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  error: 'border-red-500/30 text-red-700 dark:text-red-400',
  info: 'border-violet-500/30 text-violet-700 dark:text-violet-400',
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId++
      setToasts((current) => [...current, { id, message, variant }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant]
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg backdrop-blur-xl dark:bg-zinc-900/95 ${STYLES[toast.variant]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-zinc-700 dark:text-zinc-200">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
