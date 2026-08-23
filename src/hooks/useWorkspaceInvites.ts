import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { createInvite, revokeInvite } from '../lib/workspaces'
import type { WorkspaceInvite } from '../types'

export function useWorkspaceInvites(workspaceId: string | undefined) {
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    const invitesQuery = query(collection(db, 'invites'), where('workspaceId', '==', workspaceId))
    const unsubscribe = onSnapshot(
      invitesQuery,
      (snapshot) => {
        setInvites(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as WorkspaceInvite))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [workspaceId])

  const create = async (workspaceName: string, createdBy: string) => {
    if (!workspaceId) return
    return createInvite(workspaceId, workspaceName, createdBy)
  }

  return { invites, loading, create, revoke: revokeInvite }
}
