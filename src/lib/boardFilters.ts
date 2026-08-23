import type { Task, TaskPriority } from '../types'

export interface BoardFilters {
  search: string
  assignee: string // '' = all, 'me' = current user, otherwise a uid
  priority: TaskPriority | 'all'
  sortBy: 'newest' | 'oldest' | 'dueDate' | 'priority'
}

export const DEFAULT_FILTERS: BoardFilters = {
  search: '',
  assignee: '',
  priority: 'all',
  sortBy: 'newest',
}

// serverTimestamp() fields read back as null locally until the write is
// acknowledged by the server, so sort comparisons need a safe fallback.
function millis(timestamp: { toMillis: () => number } | null | undefined) {
  return timestamp ? timestamp.toMillis() : 0
}

export function applyFilters(tasks: Task[], filters: BoardFilters, currentUid: string) {
  const search = filters.search.trim().toLowerCase()
  const priorityRank: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 }

  const filtered = tasks.filter((task) => {
    if (search) {
      const haystack = `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (filters.assignee === 'me' && task.assignedTo !== currentUid) return false
    if (filters.assignee && filters.assignee !== 'me' && task.assignedTo !== filters.assignee) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    return true
  })

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'oldest':
        return millis(a.createdAt) - millis(b.createdAt)
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return millis(a.dueDate) - millis(b.dueDate)
      case 'priority':
        return priorityRank[a.priority] - priorityRank[b.priority]
      case 'newest':
      default:
        return millis(b.createdAt) - millis(a.createdAt)
    }
  })
}
