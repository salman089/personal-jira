import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CARD_SHELL_CLASS, TaskCardContent } from './TaskCardContent'
import type { WorkspaceMember, Task } from '../types'

interface Props {
  task: Task
  assignee?: WorkspaceMember
  onClick: () => void
}

export function TaskCard({ task, assignee, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  // No `transition` class here on purpose: Tailwind's `transition` utility
  // includes `transform` in its property list, so if it were applied while
  // `transform` is being driven by the pointer every frame, the browser
  // eases each update instead of tracking the cursor 1:1 -- that's what
  // made dragging feel laggy/rubber-banded. Colors still transition on
  // hover via `transition-colors`, which doesn't touch transform.
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`${CARD_SHELL_CLASS} touch-none select-none shadow-sm transition-colors hover:border-zinc-300 dark:hover:border-white/20 ${
        isDragging ? 'cursor-grabbing opacity-30' : 'cursor-grab'
      }`}
    >
      <TaskCardContent task={task} assignee={assignee} />
    </div>
  )
}
