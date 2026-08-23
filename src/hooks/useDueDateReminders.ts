import { useEffect, useRef } from 'react'
import { createNotification } from '../lib/notifications'
import type { AppNotification, Task } from '../types'
import { useAuth } from './useAuth'

const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * Generates "due soon" / "overdue" notifications for the CURRENT user's own
 * tasks. There's no server-side cron in this app, so instead each person's
 * browser checks their own assigned tasks whenever the board loads (and
 * every few minutes while it stays open) and creates a notification for
 * themself if one doesn't already exist yet -- that keeps the write inside
 * Firestore's "you can only create your own notifications in practice"
 * trust model without needing a backend job.
 */
export function useDueDateReminders(tasks: Task[], notifications: AppNotification[]) {
  const { user } = useAuth()
  const notifiedRef = useRef(new Set<string>())

  useEffect(() => {
    notifiedRef.current = new Set(
      notifications
        .filter((n) => n.type === 'task_due_soon' || n.type === 'task_overdue')
        .map((n) => `${n.type}:${n.taskId}`),
    )
  }, [notifications])

  useEffect(() => {
    if (!user) return

    const check = () => {
      const now = Date.now()
      for (const task of tasks) {
        if (task.status === 'done') continue
        if (task.assignedTo !== user.uid && task.createdBy !== user.uid) continue
        if (!task.dueDate) continue

        const dueMs = task.dueDate.toMillis()
        const isOverdue = dueMs < now
        const isDueSoon = !isOverdue && dueMs - now <= DUE_SOON_WINDOW_MS

        if (isOverdue) {
          const key = `task_overdue:${task.id}`
          if (!notifiedRef.current.has(key)) {
            notifiedRef.current.add(key)
            void createNotification({
              userId: user.uid,
              type: 'task_overdue',
              title: 'Task overdue',
              message: `"${task.title}" was due ${task.dueDate.toDate().toLocaleDateString()}`,
              workspaceId: task.workspaceId,
              projectId: task.projectId,
              taskId: task.id,
            })
          }
        } else if (isDueSoon) {
          const key = `task_due_soon:${task.id}`
          if (!notifiedRef.current.has(key)) {
            notifiedRef.current.add(key)
            void createNotification({
              userId: user.uid,
              type: 'task_due_soon',
              title: 'Task deadline approaching',
              message: `"${task.title}" is due ${task.dueDate.toDate().toLocaleDateString()}`,
              workspaceId: task.workspaceId,
              projectId: task.projectId,
              taskId: task.id,
            })
          }
        }
      }
    }

    check()
    const interval = setInterval(check, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [tasks, user])
}
