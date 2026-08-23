import { Laptop, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import type { ThemeMode } from '../types'

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Laptop },
]

/** A segmented light/dark/system control. Used in the header and in Settings. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode } = useTheme()

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-white/10 dark:bg-white/5 ${className}`}
      role="radiogroup"
      aria-label="Appearance"
    >
      {OPTIONS.map(({ mode: optionMode, label, icon: Icon }) => (
        <button
          key={optionMode}
          type="button"
          role="radio"
          aria-checked={mode === optionMode}
          title={label}
          onClick={() => setMode(optionMode)}
          className={`flex items-center justify-center rounded-md p-1.5 transition ${
            mode === optionMode
              ? 'bg-white text-violet-600 shadow-sm dark:bg-zinc-800 dark:text-violet-400'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Icon size={15} />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}
