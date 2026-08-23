import { arrayRemove, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Workspace, WorkspaceRole } from '../types'
import { useAuth } from './useAuth'

export interface WorkspaceWithRole extends Workspace {
  myRole: WorkspaceRole
}

/**
 * Every workspace the current user belongs to, with their role in each.
 * Reads the list from the user's own profile (profile.workspaceIds) rather
 * than a collectionGroup query -- see the comment on that field for why.
 */
export function useWorkspaces() {
  const { user, profile } = useAuth()
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([])
  const [error, setError] = useState(false)
  // Profiles created before this field existed won't have it in Firestore
  // at all (the TS type says it's always an array, but that's only true
  // for docs written by the current code) -- default defensively.
  const workspaceIds = profile?.workspaceIds ?? []
  const workspaceIdsKey = workspaceIds.join(',')

  useEffect(() => {
    if (!user || !profile) return
    let cancelled = false

    const unsubscribers = workspaceIds.map((workspaceId) =>
      onSnapshot(
        doc(db, 'workspaces', workspaceId, 'members', user.uid),
        async (memberSnap) => {
          if (cancelled) return
          if (!memberSnap.exists()) {
            // Stale entry (removed by an admin, or the workspace is gone) -- drop it.
            setWorkspaces((current) => current.filter((w) => w.id !== workspaceId))
            await updateDoc(doc(db, 'users', user.uid), { workspaceIds: arrayRemove(workspaceId) }).catch(() => {})
            return
          }

          const workspaceSnap = await getDoc(doc(db, 'workspaces', workspaceId))
          if (cancelled || !workspaceSnap.exists()) return

          const entry: WorkspaceWithRole = {
            ...(workspaceSnap.data() as Workspace),
            id: workspaceSnap.id,
            myRole: memberSnap.data().role as WorkspaceRole,
          }
          setWorkspaces((current) => [...current.filter((w) => w.id !== workspaceId), entry])
        },
        () => setError(true),
      ),
    )

    return () => {
      cancelled = true
      for (const unsubscribe of unsubscribers) unsubscribe()
    }
    // workspaceIdsKey (not profile.workspaceIds directly) so this only
    // re-subscribes when the actual ids change, not on every profile write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, workspaceIdsKey])

  return { workspaces, loading: !profile, error }
}
