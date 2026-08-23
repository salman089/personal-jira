import { format, isPast } from 'date-fns'
import { Clock } from 'lucide-react'
import { Avatar } from './Avatar'
import type { WorkspaceMember, Task, TaskPriority } from '../types'

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  High: 'bg-red-500/10 text-red-600 dark:text-red-400',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

/** Card shell classes shared between the in-list draggable card and its DragOverlay clone. */
export const CARD_SHELL_CLASS =
  'rounded-lg border border-zinc-200 bg-white p-3 text-left dark:border-white/10 dark:bg-zinc-900'

/** Just the visual content of a task card -- no drag wiring, so it's safe to reuse inside a DragOverlay. */
export function TaskCardContent({ task, assignee }: { task: Task; assignee?: WorkspaceMember }) {
  const dueDate = task.dueDate?.toDate()
  const overdue = dueDate && task.status !== 'done' && isPast(dueDate)

  return (
    <>
      <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{task.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        {task.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-white/5 dark:text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {dueDate ? (
          <span
            className={`flex items-center gap-1 text-[11px] ${
              overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-zinc-500'
            }`}
          >
            <Clock size={11} />
            {format(dueDate, 'MMM d')}
            {overdue && ' · overdue'}
          </span>
        ) : (
          <span />
        )}
        {assignee && <Avatar name={assignee.displayName} photoURL={assignee.photoURL} size="sm" />}
      </div>
    </>
  )
}
