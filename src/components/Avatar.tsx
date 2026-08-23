const SIZE_CLASSES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-16 w-16 text-xl',
} as const

interface Props {
  name: string
  photoURL?: string | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Shows a user's photo when we have one (their Google account photo, or a
 * custom upload), and otherwise falls back to a colored circle with their
 * initials -- never a broken image icon.
 */
export function Avatar({ name, photoURL, size = 'md', className = '' }: Props) {
  const sizeClass = SIZE_CLASSES[size]

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-violet-500/15 font-medium text-violet-700 dark:text-violet-300 ${sizeClass} ${className}`}
    >
      {initials(name || '?')}
    </div>
  )
}
