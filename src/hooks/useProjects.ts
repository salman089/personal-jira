import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { createProject as createProjectDoc } from '../lib/workspaces'
import type { Project } from '../types'

export function useProjects(workspaceId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    const projectsQuery = query(collection(db, 'workspaces', workspaceId, 'projects'), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        setProjects(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Project))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [workspaceId])

  const createProject = async (name: string, description: string, createdBy: string) => {
    if (!workspaceId) return
    return createProjectDoc(workspaceId, name, description, createdBy)
  }

  return { projects, loading, createProject }
}
