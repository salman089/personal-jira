import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { removeMember, setMemberRole } from '../lib/workspaces'
import type { WorkspaceMember, WorkspaceRole } from '../types'

/** Live-syncs the member list of one workspace, plus role/removal helpers (server enforces admin-only). */
export function useWorkspaceMembers(workspaceId: string | undefined) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    const unsubscribe = onSnapshot(
      collection(db, 'workspaces', workspaceId, 'members'),
      (snapshot) => {
        setMembers(snapshot.docs.map((docSnap) => docSnap.data() as WorkspaceMember))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [workspaceId])

  const setRole = async (uid: string, role: WorkspaceRole) => {
    if (!workspaceId) return
    await setMemberRole(workspaceId, uid, role)
  }

  const remove = async (uid: string) => {
    if (!workspaceId) return
    await removeMember(workspaceId, uid)
  }

  return { members, loading, setRole, remove }
}
