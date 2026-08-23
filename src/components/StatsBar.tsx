import { isPast } from 'date-fns'
import type { Task } from '../types'

interface Props {
  tasks: Task[]
  currentUid: string
}

export function StatsBar({ tasks, currentUid }: Props) {
  const myTasks = tasks.filter((task) => task.assignedTo === currentUid && task.status !== 'done')
  const overdue = tasks.filter(
    (task) => task.status !== 'done' && task.dueDate && isPast(task.dueDate.toDate()),
  )
  const done = tasks.filter((task) => task.status === 'done')

  const stats = [
    { label: 'Total tasks', value: tasks.length },
    { label: 'Assigned to me', value: myTasks.length },
    { label: 'Overdue', value: overdue.length, warn: overdue.length > 0 },
    { label: 'Completed', value: done.length },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]"
        >
          <p
            className={`text-lg font-semibold ${
              stat.warn ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {stat.value}
          </p>
          <p className="text-xs text-zinc-500">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
