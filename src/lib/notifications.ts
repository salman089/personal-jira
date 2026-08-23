import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { NotificationType } from '../types'

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  workspaceId?: string | null
  projectId?: string | null
  taskId?: string | null
}

/**
 * Writes an in-app notification for `userId`. There's no backend in this
 * app, so this is called directly by whichever teammate's action triggered
 * the event (e.g. the person assigning a task writes the notification for
 * the assignee) -- see firestore.rules for the trust tradeoff that implies.
 * Never notifies someone about their own action.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  workspaceId = null,
  projectId = null,
  taskId = null,
}: CreateNotificationInput) {
  if (!userId) return
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    message,
    workspaceId,
    projectId,
    taskId,
    read: false,
    createdAt: serverTimestamp(),
  })
}
