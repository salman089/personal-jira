import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type { WorkspaceRole } from '../types'

interface BasicProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
}

function memberDocData(profile: BasicProfile, role: WorkspaceRole, invitedVia?: string) {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    role,
    joinedAt: serverTimestamp(),
    ...(invitedVia ? { invitedVia } : {}),
  }
}

function addWorkspaceToProfile(uid: string, workspaceId: string) {
  return updateDoc(doc(db, 'users', uid), { workspaceIds: arrayUnion(workspaceId) })
}

/**
 * Creates a workspace, adds the creator as its owner, and seeds a default
 * "General" project so there's somewhere to put tasks immediately. These
 * are separate sequential writes (not a batch) on purpose: the security
 * rule for the owner's member doc checks the workspace doc already exists,
 * which only holds true once that first write has actually committed -- a
 * batch would evaluate all writes against the database as it was before
 * any of them landed, and fail.
 */
export async function createWorkspace(name: string, profile: BasicProfile) {
  const workspaceRef = await addDoc(collection(db, 'workspaces'), {
    name: name.trim(),
    createdBy: profile.uid,
    createdAt: serverTimestamp(),
  })

  // If any of the next writes fail (e.g. a dropped connection), don't
  // leave a workspace behind with no owner and no project -- delete it
  // again rather than leaving an orphaned, inaccessible workspace.
  try {
    await setDoc(doc(db, 'workspaces', workspaceRef.id, 'members', profile.uid), memberDocData(profile, 'owner'))
    await addWorkspaceToProfile(profile.uid, workspaceRef.id)

    const projectRef = await addDoc(collection(db, 'workspaces', workspaceRef.id, 'projects'), {
      workspaceId: workspaceRef.id,
      name: 'General',
      description: '',
      createdBy: profile.uid,
      createdAt: serverTimestamp(),
    })

    return { workspaceId: workspaceRef.id, projectId: projectRef.id }
  } catch (err) {
    await deleteDoc(workspaceRef).catch(() => {})
    throw err
  }
}

export async function createInvite(workspaceId: string, workspaceName: string, createdBy: string) {
  const inviteRef = await addDoc(collection(db, 'invites'), {
    workspaceId,
    workspaceName,
    createdBy,
    createdAt: serverTimestamp(),
    revoked: false,
  })
  return inviteRef.id
}

export async function revokeInvite(inviteId: string) {
  await updateDoc(doc(db, 'invites', inviteId), { revoked: true })
}

/** Looks up an invite by its token without joining anything -- used by the join-preview screen. */
export async function getInvite(inviteId: string) {
  const snap = await getDoc(doc(db, 'invites', inviteId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Adds `profile` as a member of the invite's workspace. Throws a user-facing message if the invite is bad. */
export async function joinWorkspaceViaInvite(inviteId: string, profile: BasicProfile) {
  const inviteSnap = await getDoc(doc(db, 'invites', inviteId))
  if (!inviteSnap.exists()) throw new Error('This invite link is invalid or has expired.')
  const invite = inviteSnap.data() as { workspaceId: string; revoked: boolean }
  if (invite.revoked) throw new Error('This invite link has been revoked.')

  const memberRef = doc(db, 'workspaces', invite.workspaceId, 'members', profile.uid)
  const existing = await getDoc(memberRef)
  if (!existing.exists()) {
    await setDoc(memberRef, memberDocData(profile, 'member', inviteId))
  }
  // Always sync (not just on first join) -- cheap, and self-heals a
  // profile whose workspaceIds somehow missed this one.
  await addWorkspaceToProfile(profile.uid, invite.workspaceId)
  return invite.workspaceId
}

export async function createProject(workspaceId: string, name: string, description: string, createdBy: string) {
  const projectRef = await addDoc(collection(db, 'workspaces', workspaceId, 'projects'), {
    workspaceId,
    name: name.trim(),
    description: description.trim(),
    createdBy,
    createdAt: serverTimestamp(),
  })
  return projectRef.id
}

export async function renameWorkspace(workspaceId: string, name: string) {
  await updateDoc(doc(db, 'workspaces', workspaceId), { name: name.trim() })
}

export async function setMemberRole(workspaceId: string, uid: string, role: WorkspaceRole) {
  await updateDoc(doc(db, 'workspaces', workspaceId, 'members', uid), { role })
}

/**
 * Removes someone else's membership (admin action). This can't also clean
 * up their users/{uid}.workspaceIds -- only they can write their own
 * profile -- so it's left to self-heal: useWorkspaces() drops any id that
 * no longer resolves to a real membership when it next loads for them.
 */
export async function removeMember(workspaceId: string, uid: string) {
  await deleteDoc(doc(db, 'workspaces', workspaceId, 'members', uid))
}

/** Leaving is a self-action, so unlike removeMember() it also cleans up your own profile's workspace list. */
export async function leaveWorkspace(workspaceId: string, uid: string) {
  await deleteDoc(doc(db, 'workspaces', workspaceId, 'members', uid))
  await updateDoc(doc(db, 'users', uid), { workspaceIds: arrayRemove(workspaceId) })
}

/**
 * Deletes a workspace and everything nested under it. Firestore doesn't
 * cascade-delete subcollections on its own, and there's no backend here to
 * do it server-side, so this walks the tree client-side: the workspace
 * doc itself first, then every task's comments, every task, every
 * project, every invite, and every member last.
 *
 * That order matters: deleting the workspace doc requires the caller to
 * still be its owner-member, so it has to happen BEFORE their own member
 * doc is removed -- deleting members first, then trying to delete the
 * workspace doc, means that last delete evaluates against a database
 * state where the caller no longer looks like a member at all. Deleting
 * the root doc first doesn't affect the subcollection cleanup below,
 * since none of those rules check whether the parent doc still exists.
 */
export async function deleteWorkspaceCascade(workspaceId: string) {
  await deleteDoc(doc(db, 'workspaces', workspaceId))

  const projectsSnap = await getDocs(collection(db, 'workspaces', workspaceId, 'projects'))

  for (const projectDoc of projectsSnap.docs) {
    const tasksSnap = await getDocs(collection(db, 'workspaces', workspaceId, 'projects', projectDoc.id, 'tasks'))
    for (const taskDoc of tasksSnap.docs) {
      const comments = await getDocs(
        collection(db, 'workspaces', workspaceId, 'projects', projectDoc.id, 'tasks', taskDoc.id, 'comments'),
      )
      const commentBatch = writeBatch(db)
      for (const commentDoc of comments.docs) commentBatch.delete(commentDoc.ref)
      if (comments.docs.length > 0) await commentBatch.commit()
      await deleteDoc(taskDoc.ref)
    }
    await deleteDoc(projectDoc.ref)
  }

  // Invites before members, for the same reason the workspace doc came
  // first: revoking/deleting invites requires the caller to still be an
  // admin member, so it has to happen before their own membership is gone.
  const invitesSnap = await getDocs(query(collection(db, 'invites'), where('workspaceId', '==', workspaceId)))
  const inviteBatch = writeBatch(db)
  for (const inviteDoc of invitesSnap.docs) inviteBatch.delete(inviteDoc.ref)
  if (invitesSnap.docs.length > 0) await inviteBatch.commit()

  // Members absolutely last -- this includes the caller's own membership.
  const membersSnap = await getDocs(collection(db, 'workspaces', workspaceId, 'members'))
  const memberBatch = writeBatch(db)
  for (const memberDoc of membersSnap.docs) memberBatch.delete(memberDoc.ref)
  if (membersSnap.docs.length > 0) await memberBatch.commit()
}

/**
 * Removes a deleted account from every workspace it belonged to. Takes the
 * ids directly (read from the user's own profile before it's deleted)
 * rather than querying for them -- Firestore rejects a collectionGroup
 * query outright when its rule depends on a wildcard-bound ancestor check
 * and the caller has zero matching documents anywhere, which is exactly
 * the "just deleted my only membership" case this would otherwise hit.
 */
export async function removeUserFromAllWorkspaces(uid: string, workspaceIds: string[]) {
  for (const workspaceId of workspaceIds) {
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'members', uid)).catch(() => {})
  }
}
