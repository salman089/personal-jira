import { Search } from 'lucide-react'
import type { BoardFilters } from '../lib/boardFilters'
import type { WorkspaceMember, TaskPriority } from '../types'
import { PRIORITIES } from '../types'

const selectClass =
  'rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-700 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'

interface Props {
  filters: BoardFilters
  onChange: (filters: BoardFilters) => void
  users: WorkspaceMember[]
}

export function BoardControls({ filters, onChange, users }: Props) {
  const update = (patch: Partial<BoardFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[160px] flex-1 sm:flex-none sm:w-56">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="Search tasks..."
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-8 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      <select
        value={filters.assignee}
        onChange={(event) => update({ assignee: event.target.value })}
        className={selectClass}
      >
        <option value="" className="bg-white dark:bg-zinc-900">Everyone</option>
        <option value="me" className="bg-white dark:bg-zinc-900">Assigned to me</option>
        {users.map((member) => (
          <option key={member.uid} value={member.uid} className="bg-white dark:bg-zinc-900">
            {member.displayName}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(event) => update({ priority: event.target.value as TaskPriority | 'all' })}
        className={selectClass}
      >
        <option value="all" className="bg-white dark:bg-zinc-900">All priorities</option>
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority} className="bg-white dark:bg-zinc-900">
            {priority}
          </option>
        ))}
      </select>

      <select
        value={filters.sortBy}
        onChange={(event) => update({ sortBy: event.target.value as BoardFilters['sortBy'] })}
        className={selectClass}
      >
        <option value="newest" className="bg-white dark:bg-zinc-900">Newest first</option>
        <option value="oldest" className="bg-white dark:bg-zinc-900">Oldest first</option>
        <option value="dueDate" className="bg-white dark:bg-zinc-900">Due date</option>
        <option value="priority" className="bg-white dark:bg-zinc-900">Priority</option>
      </select>
    </div>
  )
}
