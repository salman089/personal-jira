import { useState, type FormEvent } from 'react'
import { firebaseErrorMessage } from '../lib/firebaseErrors'
import { Modal } from './Modal'

const fieldClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100'

interface Props {
  onCreate: (name: string) => Promise<void>
  onClose: () => void
}

export function CreateWorkspaceModal({ onCreate, onClose }: Props) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await onCreate(name.trim())
      onClose()
    } catch (err) {
      // Stay open on failure -- closing silently is what made this feel
      // like it "randomly doesn't work" before this error was surfaced.
      setError(firebaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Create workspace" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Workspace name</label>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className={fieldClass}
            placeholder="e.g. Acme Inc."
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            You'll get a "General" project to start with -- you can add more anytime.
          </p>
        </div>
        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create workspace'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
