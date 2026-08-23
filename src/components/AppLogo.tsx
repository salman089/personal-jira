const SIZE_CLASSES = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
} as const

/** The app's actual favicon mark, reused as the in-app logo wherever branding appears. */
export function AppLogo({ size = 'md', className = '' }: { size?: keyof typeof SIZE_CLASSES; className?: string }) {
  return <img src="/favicon.svg" alt="" className={`${SIZE_CLASSES[size]} ${className}`} />
}
