import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { createNotification } from '../lib/notifications'
import { STATUS_COLUMNS, type NewTask, type Task, type TaskUpdate } from '../types'
import { useAuth } from './useAuth'

function statusLabel(status: string) {
  return STATUS_COLUMNS.find((column) => column.id === status)?.label ?? status
}

/** Live-syncs a project's tasks and exposes create/update/delete helpers. */
export function useTasks(workspaceId: string | undefined, projectId: string | undefined) {
  const { user, profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId || !projectId) return
    const tasksQuery = query(
      collection(db, 'workspaces', workspaceId, 'projects', projectId, 'tasks'),
      orderBy('createdAt', 'desc'),
    )
    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        setTasks(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }) as Task),
        )
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [workspaceId, projectId])

  const actorName = profile?.displayName ?? 'Someone'

  const createTask = async (task: NewTask) => {
    if (!workspaceId || !projectId) return
    const docRef = await addDoc(collection(db, 'workspaces', workspaceId, 'projects', projectId, 'tasks'), {
      ...task,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    if (task.assignedTo && task.assignedTo !== user?.uid) {
      await createNotification({
        userId: task.assignedTo,
        type: 'task_assigned',
        title: 'New task assigned to you',
        message: `${actorName} assigned you "${task.title}"`,
        workspaceId,
        projectId,
        taskId: docRef.id,
      })
    }
  }

  const updateTask = async (id: string, changes: TaskUpdate) => {
    if (!workspaceId || !projectId) return
    const before = tasks.find((task) => task.id === id)

    await updateDoc(doc(db, 'workspaces', workspaceId, 'projects', projectId, 'tasks', id), {
      ...changes,
      updatedAt: serverTimestamp(),
    })

    if (!before) return

    if (
      changes.assignedTo !== undefined &&
      changes.assignedTo !== before.assignedTo &&
      changes.assignedTo &&
      changes.assignedTo !== user?.uid
    ) {
      await createNotification({
        userId: changes.assignedTo,
        type: 'task_assigned',
        title: 'New task assigned to you',
        message: `${actorName} assigned you "${before.title}"`,
        workspaceId,
        projectId,
        taskId: id,
      })
    }

    if (changes.status !== undefined && changes.status !== before.status) {
      const recipients = new Set([before.createdBy, before.assignedTo])
      recipients.delete('')
      if (user?.uid) recipients.delete(user.uid)

      for (const recipientId of recipients) {
        if (changes.status === 'done') {
          await createNotification({
            userId: recipientId,
            type: 'task_completed',
            title: 'Task completed',
            message: `${actorName} marked "${before.title}" as done`,
            workspaceId,
            projectId,
            taskId: id,
          })
        } else {
          await createNotification({
            userId: recipientId,
            type: 'task_status_changed',
            title: 'Task status changed',
            message: `${actorName} moved "${before.title}" to ${statusLabel(changes.status)}`,
            workspaceId,
            projectId,
            taskId: id,
          })
        }
      }
    }
  }

  const deleteTask = async (id: string) => {
    if (!workspaceId || !projectId) return
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'projects', projectId, 'tasks', id))
  }

  return { tasks, loading, createTask, updateTask, deleteTask }
}
