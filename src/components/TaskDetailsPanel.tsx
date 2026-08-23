import { Timestamp } from 'firebase/firestore'
import { format, formatDistanceToNow } from 'date-fns'
import { Check, Copy, Lock, Send, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTaskComments } from '../hooks/useTaskComments'
import { createNotification } from '../lib/notifications'
import {
  PRIORITIES,
  STATUS_COLUMNS,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type TaskUpdate,
  type WorkspaceMember,
} from '../types'
import { Avatar } from './Avatar'

const fieldClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100'
const labelClass = 'mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400'

interface Props {
  task: Task
  members: WorkspaceMember[]
  isWorkspaceAdmin: boolean
  onUpdate: (id: string, changes: TaskUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

/** Builds a link that opens this exact task once pasted in a browser. */
function buildShareLink(workspaceId: string, projectId: string, taskId: string) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/w/${workspaceId}/p/${projectId}/task/${taskId}`
}

function dateInputValue(timestamp: Timestamp | null) {
  return timestamp ? format(timestamp.toDate(), 'yyyy-MM-dd') : ''
}

export function TaskDetailsPanel({ task, members, isWorkspaceAdmin, onUpdate, onDelete, onClose }: Props) {
  const { user, profile } = useAuth()
  const { comments, addComment, deleteComment } = useTaskComments(task.workspaceId, task.projectId, task.id)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [tagsInput, setTagsInput] = useState(task.tags.join(', '))
  const [commentText, setCommentText] = useState('')
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [postingComment, setPostingComment] = useState(false)

  const canEdit = Boolean(
    user && (task.createdBy === user.uid || task.assignedTo === user.uid || isWorkspaceAdmin),
  )
  const canDelete = Boolean(user && (task.createdBy === user.uid || isWorkspaceAdmin))

  const saveField = (changes: TaskUpdate) => {
    void onUpdate(task.id, changes)
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      saveField({ title: title.trim() })
    } else {
      setTitle(task.title)
    }
  }

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      saveField({ description })
    }
  }

  const handleTagsBlur = () => {
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    if (tags.join(',') !== task.tags.join(',')) {
      saveField({ tags })
    }
  }

  const handleDueDateChange = (value: string) => {
    saveField({ dueDate: value ? Timestamp.fromDate(new Date(value)) : null })
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildShareLink(task.workspaceId, task.projectId, task.id))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    setDeleting(true)
    try {
      await onDelete(task.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return
    setPostingComment(true)
    try {
      await addComment(user.uid, profile?.displayName ?? 'Someone', profile?.photoURL ?? null, commentText)
      setCommentText('')

      const recipients = new Set([task.createdBy, task.assignedTo])
      recipients.delete('')
      recipients.delete(user.uid)
      for (const recipientId of recipients) {
        await createNotification({
          userId: recipientId,
          type: 'task_comment',
          title: 'New comment',
          message: `${profile?.displayName ?? 'Someone'} commented on "${task.title}"`,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: task.id,
        })
      }
    } finally {
      setPostingComment(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm dark:bg-black/60"
      />
      <div className="relative flex h-full w-full max-w-full flex-col border-l border-zinc-200 bg-white shadow-2xl sm:max-w-md dark:border-white/10 dark:bg-zinc-900/95 dark:backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-5 dark:border-white/10">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Task details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
          {!canEdit && (
            <p className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5">
              <Lock size={12} />
              Only the creator, assignee, or an admin can edit this task.
            </p>
          )}

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={handleTitleBlur}
            disabled={!canEdit}
            className="w-full bg-transparent text-lg font-semibold text-zinc-900 outline-none disabled:opacity-70 dark:text-zinc-100"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={task.status}
                disabled={!canEdit}
                onChange={(event) => saveField({ status: event.target.value as TaskStatus })}
                className={fieldClass}
              >
                {STATUS_COLUMNS.map((column) => (
                  <option key={column.id} value={column.id} className="bg-white dark:bg-zinc-900">
                    {column.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={task.priority}
                disabled={!canEdit}
                onChange={(event) => saveField({ priority: event.target.value as TaskPriority })}
                className={fieldClass}
              >
                {PRIORITIES.map((option) => (
                  <option key={option} value={option} className="bg-white dark:bg-zinc-900">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Assigned to</label>
              <select
                value={task.assignedTo}
                disabled={!canEdit}
                onChange={(event) => saveField({ assignedTo: event.target.value })}
                className={fieldClass}
              >
                <option value="" className="bg-white dark:bg-zinc-900">Unassigned</option>
                {members.map((member) => (
                  <option key={member.uid} value={member.uid} className="bg-white dark:bg-zinc-900">
                    {member.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Due date</label>
              <input
                type="date"
                value={dateInputValue(task.dueDate)}
                disabled={!canEdit}
                onChange={(event) => handleDueDateChange(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={handleDescriptionBlur}
              disabled={!canEdit}
              rows={5}
              className={`${fieldClass} resize-none`}
              placeholder="Add a description..."
            />
          </div>

          <div>
            <label className={labelClass}>Tags (comma separated)</label>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              onBlur={handleTagsBlur}
              disabled={!canEdit}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
            {task.createdAt && <span>Created {format(task.createdAt.toDate(), 'MMM d, yyyy')}</span>}
            {task.updatedAt && (
              <span>Updated {formatDistanceToNow(task.updatedAt.toDate(), { addSuffix: true })}</span>
            )}
          </div>

          <div className="border-t border-zinc-200 pt-4 dark:border-white/10">
            <h3 className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h3>
            <div className="mb-3 space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <Avatar name={comment.authorName} photoURL={comment.authorPhotoURL} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{comment.authorName}</p>
                      {comment.createdAt && (
                        <p className="text-[11px] text-zinc-400">
                          {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{comment.text}</p>
                  </div>
                  {(comment.authorId === user?.uid || isWorkspaceAdmin) && (
                    <button
                      type="button"
                      onClick={() => void deleteComment(comment.id)}
                      className="h-fit shrink-0 text-zinc-300 hover:text-red-500 dark:text-zinc-600"
                      aria-label="Delete comment"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-zinc-400">No comments yet.</p>}
            </div>

            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleAddComment()
                  }
                }}
                placeholder="Write a comment..."
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => void handleAddComment()}
                disabled={postingComment || !commentText.trim()}
                className="flex shrink-0 items-center justify-center rounded-lg bg-violet-600 px-3 text-white transition hover:bg-violet-500 disabled:opacity-50"
                aria-label="Post comment"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-4 sm:px-5 dark:border-white/10">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
