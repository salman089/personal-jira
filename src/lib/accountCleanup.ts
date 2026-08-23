import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { db, storage } from './firebase'
import { removeUserFromAllWorkspaces } from './workspaces'

/**
 * Cleans up a user's data before their account is deleted, so the database
 * doesn't end up with dangling references:
 *  - Unassigns them from any task they were assigned, in every workspace
 *    they belonged to (looked up per-workspace/per-project rather than via
 *    a collectionGroup query -- see removeUserFromAllWorkspaces for why
 *    that pattern doesn't work here).
 *  - Removes their membership from every workspace they belonged to.
 *  - Deletes their notification inbox.
 *  - Best-effort deletes their uploaded avatar.
 * Tasks/comments they created or wrote are left in place (like GitHub or
 * Slack, history from a deleted account stays visible) -- the UI falls back
 * to "Deleted user" wherever a uid no longer resolves to a live profile.
 */
export async function cleanupUserData(uid: string, workspaceIds: string[]) {
  for (const workspaceId of workspaceIds) {
    const projectsSnap = await getDocs(collection(db, 'workspaces', workspaceId, 'projects')).catch(() => null)
    if (!projectsSnap) continue

    for (const projectDoc of projectsSnap.docs) {
      const assignedTasks = await getDocs(
        query(
          collection(db, 'workspaces', workspaceId, 'projects', projectDoc.id, 'tasks'),
          where('assignedTo', '==', uid),
        ),
      ).catch(() => null)
      if (!assignedTasks || assignedTasks.docs.length === 0) continue

      const batch = writeBatch(db)
      for (const taskDoc of assignedTasks.docs) batch.update(taskDoc.ref, { assignedTo: '' })
      await batch.commit()
    }
  }

  const notifications = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)))
  if (notifications.docs.length > 0) {
    const batch = writeBatch(db)
    for (const notificationDoc of notifications.docs) batch.delete(notificationDoc.ref)
    await batch.commit()
  }

  await removeUserFromAllWorkspaces(uid, workspaceIds)

  try {
    // Race against a timeout: if Storage isn't set up for this project (its
    // rules were never deployed, or the bucket doesn't exist), this call
    // can hang instead of rejecting quickly -- and account deletion should
    // never be blocked indefinitely by a best-effort avatar cleanup step.
    await Promise.race([
      deleteObject(ref(storage, `avatars/${uid}/photo`)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
  } catch {
    // No avatar uploaded, or Storage isn't reachable -- either way, not fatal.
  }

  await deleteDoc(doc(db, 'users', uid))
}
