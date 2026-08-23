import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Info,
  MessageSquare,
  User as UserIcon,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import type { AppNotification, NotificationType } from '../types'

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  task_assigned: UserPlus,
  task_status_changed: Info,
  task_due_soon: Clock,
  task_overdue: AlertTriangle,
  task_completed: CheckCircle2,
  task_comment: MessageSquare,
  account: UserIcon,
  system: Info,
}

const TYPE_COLORS: Record<NotificationType, string> = {
  task_assigned: 'text-violet-600 dark:text-violet-400',
  task_status_changed: 'text-blue-600 dark:text-blue-400',
  task_due_soon: 'text-amber-600 dark:text-amber-400',
  task_overdue: 'text-red-600 dark:text-red-400',
  task_completed: 'text-emerald-600 dark:text-emerald-400',
  task_comment: 'text-violet-600 dark:text-violet-400',
  account: 'text-zinc-500',
  system: 'text-zinc-500',
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleClick = (notification: AppNotification) => {
    if (!notification.read) void markAsRead(notification.id)
    setOpen(false)
    if (notification.workspaceId && notification.projectId && notification.taskId) {
      navigate(`/w/${notification.workspaceId}/p/${notification.projectId}/task/${notification.taskId}`)
    } else if (notification.workspaceId) {
      navigate(`/w/${notification.workspaceId}`)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl sm:w-96 dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-white/10">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[55vh] overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-zinc-500">You're all caught up.</p>
              )}
              {notifications.map((notification) => {
                const Icon = TYPE_ICONS[notification.type]
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleClick(notification)}
                    className={`flex w-full items-start gap-3 border-b border-zinc-100 px-4 py-3 text-left transition last:border-0 hover:bg-zinc-50 dark:border-white/5 dark:hover:bg-white/5 ${
                      notification.read ? '' : 'bg-violet-50/60 dark:bg-violet-500/[0.06]'
                    }`}
                  >
                    <Icon size={16} className={`mt-0.5 shrink-0 ${TYPE_COLORS[notification.type]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{notification.title}</p>
                      <p className="truncate text-xs text-zinc-500">{notification.message}</p>
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        {notification.createdAt
                          ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
                          : 'just now'}
                      </p>
                    </div>
                    {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
