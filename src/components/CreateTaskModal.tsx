import { Timestamp } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { PRIORITIES, STATUS_COLUMNS, type WorkspaceMember, type NewTask, type TaskPriority, type TaskStatus } from '../types'
import { Modal } from './Modal'

const fieldClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100'
const labelClass = 'mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400'

interface Props {
  currentUserUid: string
  workspaceId: string
  projectId: string
  users: WorkspaceMember[]
  defaultStatus: TaskStatus
  onCreate: (task: NewTask) => Promise<void>
  onClose: () => void
}

export function CreateTaskModal({
  currentUserUid,
  workspaceId,
  projectId,
  users,
  defaultStatus,
  onCreate,
  onClose,
}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      await onCreate({
        workspaceId,
        projectId,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignedTo,
        tags,
        dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
        createdBy: currentUserUid,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Create task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className={fieldClass}
            placeholder="e.g. Fix login redirect bug"
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={`${fieldClass} resize-none`}
            placeholder="Optional details..."
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
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
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Assign to</label>
            <select
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              className={fieldClass}
            >
              <option value="" className="bg-white dark:bg-zinc-900">Unassigned</option>
              {users.map((member) => (
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
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Tags (comma separated)</label>
          <input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            className={fieldClass}
            placeholder="frontend, bug"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
