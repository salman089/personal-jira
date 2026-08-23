import { CARD_SHELL_CLASS, TaskCardContent } from './TaskCardContent'
import type { WorkspaceMember, Task } from '../types'

/** The floating clone shown under the cursor while dragging (rendered inside `<DragOverlay>`). */
export function TaskCardOverlay({ task, assignee }: { task: Task; assignee?: WorkspaceMember }) {
  return (
    <div className={`${CARD_SHELL_CLASS} rotate-2 cursor-grabbing shadow-2xl ring-1 ring-violet-500/30`}>
      <TaskCardContent task={task} assignee={assignee} />
    </div>
  )
}
