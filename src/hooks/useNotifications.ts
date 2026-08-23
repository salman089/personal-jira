import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../lib/firebase'
import { showBrowserNotification } from '../lib/browserNotifications'
import type { AppNotification, NotificationPrefs, NotificationType } from '../types'
import { useAuth } from './useAuth'

const TYPE_TO_PREF: Partial<Record<NotificationType, keyof NotificationPrefs>> = {
  task_assigned: 'taskAssigned',
  task_status_changed: 'taskStatusChanged',
  task_completed: 'taskStatusChanged',
  task_due_soon: 'dueDateReminders',
  task_overdue: 'dueDateReminders',
  task_comment: 'taskComment',
}

function shouldPopBrowserNotification(type: NotificationType, prefs: NotificationPrefs) {
  if (!prefs.browserEnabled) return false
  const prefKey = TYPE_TO_PREF[type]
  // account/system notifications aren't gated by a specific type toggle.
  return prefKey ? prefs[prefKey] : true
}

export function useNotifications() {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const isFirstSnapshot = useRef(true)
  const profileRef = useRef(profile)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  useEffect(() => {
    // No explicit reset here: when `user` goes null, the component tree
    // using this hook (gated behind ProtectedRoute) unmounts anyway, which
    // discards this state along with it.
    if (!user) return

    isFirstSnapshot.current = true
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50),
    )

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as AppNotification)
      setNotifications(list)
      setLoading(false)

      // Pop a browser notification for anything that just arrived -- but
      // never on the very first snapshot (that would re-notify for
      // everything already in someone's history on every page load).
      if (!isFirstSnapshot.current) {
        const prefs = profileRef.current?.notificationPrefs
        if (prefs) {
          for (const change of snapshot.docChanges()) {
            if (change.type !== 'added') continue
            const notification = { id: change.doc.id, ...change.doc.data() } as AppNotification
            if (shouldPopBrowserNotification(notification.type, prefs)) {
              showBrowserNotification(notification.title, notification.message)
            }
          }
        }
      }
      isFirstSnapshot.current = false
    }, () => setLoading(false))

    return unsubscribe
  }, [user])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true })
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read)
    if (unread.length === 0) return
    const batch = writeBatch(db)
    for (const notification of unread) {
      batch.update(doc(db, 'notifications', notification.id), { read: true })
    }
    await batch.commit()
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
