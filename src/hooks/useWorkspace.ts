import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Workspace, WorkspaceRole } from '../types'
import { useAuth } from './useAuth'

/** Live-syncs a single workspace doc plus the current user's role in it. */
export function useWorkspace(workspaceId: string | undefined) {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [myRole, setMyRole] = useState<WorkspaceRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId || !user) return

    const unsubWorkspace = onSnapshot(
      doc(db, 'workspaces', workspaceId),
      (snapshot) => {
        setWorkspace(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Workspace) : null)
        setLoading(false)
      },
      () => {
        setWorkspace(null)
        setLoading(false)
      },
    )

    const unsubMembership = onSnapshot(
      doc(db, 'workspaces', workspaceId, 'members', user.uid),
      (snapshot) => {
        setMyRole(snapshot.exists() ? (snapshot.data().role as WorkspaceRole) : null)
      },
      () => setMyRole(null),
    )

    return () => {
      unsubWorkspace()
      unsubMembership()
    }
  }, [workspaceId, user])

  const isAdmin = myRole === 'owner' || myRole === 'admin'
  const isOwner = myRole === 'owner'

  return { workspace, myRole, isAdmin, isOwner, loading }
}
