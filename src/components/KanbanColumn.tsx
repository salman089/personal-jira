import { useDroppable } from '@dnd-kit/core'
import type { WorkspaceMember, Task, TaskStatus } from '../types'
import { TaskCard } from './TaskCard'

interface Props {
  status: TaskStatus
  label: string
  tasks: Task[]
  users: WorkspaceMember[]
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({ status, label, tasks, users, onTaskClick }: Props) {
  // The whole column (including the empty space around cards) is one drop
  // target -- this keeps cross-column dragging simple, we just set the
  // task's status to whichever column it lands in.
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex w-full flex-col sm:w-72 sm:shrink-0 md:w-80">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/5 dark:text-zinc-500">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[96px] flex-1 flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-100/60 p-2 transition-colors sm:min-h-[240px] dark:border-white/10 dark:bg-white/[0.02] ${
          isOver ? 'border-violet-500/50 bg-violet-500/5 dark:bg-violet-500/5' : ''
        }`}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            assignee={users.find((candidate) => candidate.uid === task.assignedTo)}
            onClick={() => onTaskClick(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 py-4 text-xs text-zinc-400 sm:py-8 dark:border-white/10 dark:text-zinc-600">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}
