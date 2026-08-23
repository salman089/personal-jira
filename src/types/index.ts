import type { Timestamp } from 'firebase/firestore'

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'Low' | 'Medium' | 'High'
export type ThemeMode = 'light' | 'dark' | 'system'
export type WorkspaceRole = 'owner' | 'admin' | 'member'

/**
 * A task, stored at workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}.
 * workspaceId/projectId are denormalized onto the doc (even though they're
 * implied by its path) so notifications can deep-link to it and account
 * deletion can find every task assigned to someone across every workspace
 * via a collectionGroup query.
 */
export interface Task {
  id: string
  workspaceId: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  /** uid of the assigned user, or '' if unassigned. */
  assignedTo: string
  tags: string[]
  dueDate: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
  /** uid of whoever created the task. */
  createdBy: string
}

/** Fields the app sends when creating a task. Firestore fills in the id and timestamps. */
export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

/** Fields a user is allowed to change after a task exists. */
export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'workspaceId' | 'projectId'>>

/** A comment left on a task, stored at .../tasks/{taskId}/comments/{commentId}. */
export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  authorName: string
  authorPhotoURL: string | null
  text: string
  createdAt: Timestamp
}

/** Per-user notification preferences, stored inside their user profile. */
export interface NotificationPrefs {
  browserEnabled: boolean
  taskAssigned: boolean
  taskStatusChanged: boolean
  taskComment: boolean
  dueDateReminders: boolean
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  browserEnabled: false,
  taskAssigned: true,
  taskStatusChanged: true,
  taskComment: true,
  dueDateReminders: true,
}

/**
 * A registered user's global profile, stored at users/{uid}. Created
 * automatically on first sign-in (see AuthContext) -- this is the account
 * itself, independent of any workspace. Workspace-specific role (owner/
 * admin/member) lives separately, on the membership doc, since one person
 * can belong to many workspaces with a different role in each.
 *
 * workspaceIds is a denormalized index of "which workspaces am I in",
 * kept in sync by the user's OWN actions (joining/creating/leaving a
 * workspace all write here as part of the same self-write). This exists
 * because Firestore rejects an entire collectionGroup query outright when
 * its rule depends on a wildcard-bound ancestor check and the caller has
 * zero matching documents anywhere -- so "which workspaces is this user a
 * member of" can't be answered with a collectionGroup query over `members`
 * the way you'd expect; reading your own profile sidesteps that entirely.
 * It can go slightly stale if an ADMIN removes someone else or deletes a
 * workspace (neither of those can write to the affected user's own
 * profile) -- useWorkspaces() self-heals by dropping ids that no longer
 * resolve to a real workspace.
 */
export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  workspaceIds: string[]
  createdAt: Timestamp
  notificationPrefs: NotificationPrefs
}

/** A workspace (organization), stored at workspaces/{workspaceId}. */
export interface Workspace {
  id: string
  name: string
  createdBy: string
  createdAt: Timestamp
}

/**
 * One person's membership in a workspace, stored at
 * workspaces/{workspaceId}/members/{uid}. Profile fields are denormalized
 * here so the member list and "assign to" pickers don't need a second read
 * per person.
 */
export interface WorkspaceMember {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: WorkspaceRole
  joinedAt: Timestamp
}

/**
 * A shareable join link's backing doc, stored at top-level invites/{id} (the
 * doc id IS the token in the URL: #/join/{id}). Revoking just flips a flag
 * rather than deleting, so old links fail with a clear "revoked" message
 * instead of "not found".
 */
export interface WorkspaceInvite {
  id: string
  workspaceId: string
  workspaceName: string
  createdBy: string
  createdAt: Timestamp
  revoked: boolean
}

/** A project (board) within a workspace, stored at workspaces/{workspaceId}/projects/{projectId}. */
export interface Project {
  id: string
  workspaceId: string
  name: string
  description: string
  createdBy: string
  createdAt: Timestamp
}

export type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_completed'
  | 'task_comment'
  | 'account'
  | 'system'

/** An in-app notification, stored at notifications/{id}. */
export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  workspaceId: string | null
  projectId: string | null
  taskId: string | null
  read: boolean
  createdAt: Timestamp
}

export const STATUS_COLUMNS: ReadonlyArray<{ id: TaskStatus; label: string }> = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

export const PRIORITIES: readonly TaskPriority[] = ['Low', 'Medium', 'High']
