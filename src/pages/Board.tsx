import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ArrowLeft, Plus, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AccountMenu } from '../components/AccountMenu'
import { AppLogo } from '../components/AppLogo'
import { BoardControls } from '../components/BoardControls'
import { CreateTaskModal } from '../components/CreateTaskModal'
import { KanbanColumn } from '../components/KanbanColumn'
import { NotificationCenter } from '../components/NotificationCenter'
import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner'
import { StatsBar } from '../components/StatsBar'
import { TaskCardOverlay } from '../components/TaskCardOverlay'
import { TaskDetailsPanel } from '../components/TaskDetailsPanel'
import { useAuth } from '../hooks/useAuth'
import { useDueDateReminders } from '../hooks/useDueDateReminders'
import { useNotifications } from '../hooks/useNotifications'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useWorkspace } from '../hooks/useWorkspace'
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers'
import { DEFAULT_FILTERS, applyFilters, type BoardFilters } from '../lib/boardFilters'
import { STATUS_COLUMNS, type Task, type TaskStatus } from '../types'

export function Board() {
  const { user, profile } = useAuth()
  const { workspaceId, projectId, taskId } = useParams<{
    workspaceId: string
    projectId: string
    taskId: string
  }>()
  const { workspace, isAdmin } = useWorkspace(workspaceId)
  const { projects } = useProjects(workspaceId)
  const { tasks, createTask, updateTask, deleteTask } = useTasks(workspaceId, projectId)
  const { members } = useWorkspaceMembers(workspaceId)
  const { notifications } = useNotifications()
  const navigate = useNavigate()

  useDueDateReminders(tasks, notifications)

  const [creatingInStatus, setCreatingInStatus] = useState<TaskStatus | null>(null)
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const project = projects.find((candidate) => candidate.id === projectId)

  // The selected task is derived straight from the URL (#/task/:taskId)
  // rather than duplicated into its own state -- that way a shared task
  // link and Firestore's live updates both "just work" with no extra
  // effects to keep in sync.
  const selectedTask = useMemo(
    () => (taskId ? (tasks.find((task) => task.id === taskId) ?? null) : null),
    [taskId, tasks],
  )

  // Mouse and touch get separate sensors (rather than one PointerSensor)
  // because they need different activation rules: a mouse can start
  // dragging after a tiny movement, but a touch needs a short press-and-hold
  // first so a normal finger-scroll of the page doesn't get hijacked into a
  // drag. This is the same pattern Trello's mobile board uses.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const visibleTasks = useMemo(
    () => applyFilters(tasks, filters, user?.uid ?? ''),
    [tasks, filters, user],
  )

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
    }
    for (const task of visibleTasks) {
      grouped[task.status].push(task)
    }
    return grouped
  }, [visibleTasks])

  const activeTask = activeTaskId ? tasks.find((task) => task.id === activeTaskId) : undefined

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null)
    const { active, over } = event
    if (!over) return

    const newStatus = over.id as TaskStatus
    const draggedTask = tasks.find((task) => task.id === active.id)
    if (draggedTask && draggedTask.status !== newStatus) {
      void updateTask(draggedTask.id, { status: newStatus })
    }
  }

  const openTask = (task: Task) => navigate(`/w/${workspaceId}/p/${projectId}/task/${task.id}`)
  const closeTaskPanel = () => navigate(`/w/${workspaceId}/p/${projectId}`)

  if (!user || !profile || !workspaceId || !projectId) return null

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={`/w/${workspaceId}`}
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
            aria-label="Back to projects"
          >
            <ArrowLeft size={16} />
          </Link>
          <AppLogo size="sm" className="hidden shrink-0 sm:inline" />
          <div className="min-w-0 text-sm">
            <Link to={`/w/${workspaceId}`} className="truncate text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
              {workspace?.name}
            </Link>
            <span className="mx-1 text-zinc-400">/</span>
            <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{project?.name}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NotificationCenter />
          {isAdmin && (
            <Link
              to={`/w/${workspaceId}/settings`}
              className="hidden items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 sm:flex dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              <Settings size={15} />
              Settings
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCreatingInStatus('backlog')}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-2 text-sm font-medium text-white transition hover:bg-violet-500 sm:px-3"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Create task</span>
          </button>
          <div className="ml-1 border-l border-zinc-200 pl-2 sm:pl-3 dark:border-white/10">
            <AccountMenu />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 py-4 sm:gap-5">
        <NotificationPermissionBanner />

        <div className="flex flex-col gap-3 px-4 sm:px-6">
          <StatsBar tasks={tasks} currentUid={user.uid} />
          <BoardControls filters={filters} onChange={setFilters} users={members} />
        </div>

        <main className="overflow-x-visible px-4 sm:overflow-x-auto sm:px-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveTaskId(null)}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              {STATUS_COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  status={column.id}
                  label={column.label}
                  tasks={tasksByStatus[column.id]}
                  users={members}
                  onTaskClick={openTask}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
              {activeTask ? (
                <TaskCardOverlay
                  task={activeTask}
                  assignee={members.find((candidate) => candidate.uid === activeTask.assignedTo)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

      {creatingInStatus && (
        <CreateTaskModal
          currentUserUid={user.uid}
          workspaceId={workspaceId}
          projectId={projectId}
          users={members}
          defaultStatus={creatingInStatus}
          onCreate={createTask}
          onClose={() => setCreatingInStatus(null)}
        />
      )}

      {selectedTask && (
        <TaskDetailsPanel
          key={selectedTask.id}
          task={selectedTask}
          members={members}
          isWorkspaceAdmin={isAdmin}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onClose={closeTaskPanel}
        />
      )}
    </div>
  )
}
