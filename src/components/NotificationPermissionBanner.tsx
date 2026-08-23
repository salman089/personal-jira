import { Bell, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from '../lib/browserNotifications'

const DISMISSED_KEY = 'flowboard-notification-banner-dismissed'

/**
 * A one-time prompt (per device) explaining browser notifications and
 * asking for permission. Only shows when permission is still undecided --
 * once the browser records "granted" or "denied", or the user dismisses
 * this banner, it never asks again (browsers refuse to re-prompt after a
 * denial anyway, and we mirror that for our own "not now" dismissal too).
 */
function shouldShowInitially() {
  if (!isNotificationSupported()) return false
  if (window.localStorage.getItem(DISMISSED_KEY) === '1') return false
  return getNotificationPermission() === 'default'
}

export function NotificationPermissionBanner() {
  const { profile, updateNotificationPrefs } = useAuth()
  const [visible, setVisible] = useState(shouldShowInitially)

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  const handleEnable = async () => {
    const result = await requestNotificationPermission()
    if (result === 'granted') {
      await updateNotificationPrefs({ browserEnabled: true })
    }
    dismiss()
  }

  if (!visible || !profile) return null

  return (
    <div className="mx-4 flex flex-col gap-3 rounded-xl border border-violet-500/20 bg-violet-50 px-4 py-3 text-sm sm:mx-6 sm:flex-row sm:items-center sm:justify-between dark:bg-violet-500/10">
      <div className="flex items-start gap-2.5">
        <Bell size={16} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
        <p className="text-zinc-700 dark:text-zinc-300">
          Turn on browser notifications to hear about assignments, comments, and due dates even
          when this tab isn't in front.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-white/60 dark:text-zinc-400 dark:hover:bg-white/5"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={() => void handleEnable()}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500"
        >
          Enable notifications
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 sm:hidden"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
