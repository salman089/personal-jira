import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { TaskComment } from '../types'

function commentsPath(workspaceId: string, projectId: string, taskId: string) {
  return ['workspaces', workspaceId, 'projects', projectId, 'tasks', taskId, 'comments'] as const
}

export function useTaskComments(workspaceId: string, projectId: string, taskId: string) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loading, setLoading] = useState(true)

  // Callers key their component by taskId (see TaskDetailsPanel), so this
  // effect only ever runs once per mount -- no need to reset `loading`
  // here, the initial `true` above already covers it.
  useEffect(() => {
    const commentsQuery = query(
      collection(db, ...commentsPath(workspaceId, projectId, taskId)),
      orderBy('createdAt', 'asc'),
    )
    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        setComments(
          snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as TaskComment),
        )
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [workspaceId, projectId, taskId])

  const addComment = async (authorId: string, authorName: string, authorPhotoURL: string | null, text: string) => {
    if (!text.trim()) return
    await addDoc(collection(db, ...commentsPath(workspaceId, projectId, taskId)), {
      taskId,
      authorId,
      authorName,
      authorPhotoURL,
      text: text.trim(),
      createdAt: serverTimestamp(),
    })
  }

  const deleteComment = async (commentId: string) => {
    await deleteDoc(doc(db, ...commentsPath(workspaceId, projectId, taskId), commentId))
  }

  return { comments, loading, addComment, deleteComment }
}
