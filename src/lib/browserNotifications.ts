/**
 * Thin wrapper around the Web Notification API. This only shows
 * notifications while the browser/tab is open (in the background, another
 * tab focused, minimized, screen off) -- it can't wake up a fully closed
 * browser, since that requires a push server (Firebase Cloud Messaging +
 * Cloud Functions), which this app intentionally doesn't run. See the
 * comment in NotificationPermissionBanner.tsx for the user-facing version
 * of this tradeoff.
 */

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.requestPermission()
}

export function showBrowserNotification(title: string, body: string) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  // Don't bother popping a system notification for something already
  // visible on screen in the notification panel.
  if (document.visibilityState === 'visible') return

  try {
    const notification = new Notification(title, { body, icon: '/favicon.svg' })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch {
    // A handful of mobile browsers throw when constructing Notification
    // directly instead of via a service worker -- nothing useful to do.
  }
}
