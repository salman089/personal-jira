import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { AlertTriangle, ArrowLeft, Camera, Loader2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../hooks/useAuth'
import { firebaseErrorMessage } from '../lib/firebaseErrors'
import { storage } from '../lib/firebase'
import { useToast } from '../hooks/useToast'
import type { NotificationPrefs } from '../types'

const TABS = ['Profile', 'Password', 'Notifications', 'Appearance', 'Danger zone'] as const
type Tab = (typeof TABS)[number]

const fieldClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100'
const labelClass = 'mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400'
const cardClass = 'rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]'

const PREF_LABELS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'taskAssigned', label: 'Task assigned to me', description: 'When someone assigns you a task.' },
  { key: 'taskStatusChanged', label: 'Task status changes', description: 'When a task you own or are assigned moves columns.' },
  { key: 'taskComment', label: 'Comments', description: 'When someone comments on your task.' },
  { key: 'dueDateReminders', label: 'Due date reminders', description: 'Deadline approaching or overdue.' },
]

export function SettingsPage() {
  const { user, profile, updateDisplayName, updatePhotoURL, updateNotificationPrefs, changePassword, deleteAccount, signOutUser } =
    useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('Profile')

  // Profile tab
  const [name, setName] = useState(profile?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Password tab
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const hasPassword = user?.providerData.some((p) => p.providerId === 'password') ?? false

  // Danger zone
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  if (!user || !profile) return null

  const handleSaveName = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setSavingName(true)
    try {
      await updateDisplayName(name.trim())
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(firebaseErrorMessage(err), 'error')
    } finally {
      setSavingName(false)
    }
  }

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return showToast('Please choose an image file.', 'error')
    if (file.size > 3 * 1024 * 1024) return showToast('Image must be under 3MB.', 'error')

    setUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/photo`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updatePhotoURL(url)
      showToast('Photo updated', 'success')
    } catch (err) {
      showToast(firebaseErrorMessage(err), 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) return setPasswordError('New password must be at least 6 characters.')
    if (newPassword !== confirmNewPassword) return setPasswordError('New passwords do not match.')

    setSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      showToast('Password changed', 'success')
    } catch (err) {
      setPasswordError(firebaseErrorMessage(err))
    } finally {
      setSavingPassword(false)
    }
  }

  const handleTogglePref = async (key: keyof NotificationPrefs, value: boolean) => {
    try {
      await updateNotificationPrefs({ [key]: value })
    } catch (err) {
      showToast(firebaseErrorMessage(err), 'error')
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')
    if (deleteConfirmText !== 'DELETE') return setDeleteError('Type DELETE to confirm.')
    setDeleting(true)
    try {
      await deleteAccount(hasPassword ? deletePassword : undefined)
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(firebaseErrorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 px-4 py-4 sm:px-6 dark:border-white/10">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/workspaces')}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-white/10"
            aria-label="Back to workspaces"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-semibold">Settings</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-white/10">
          {TABS.map((tabName) => (
            <button
              key={tabName}
              type="button"
              onClick={() => setTab(tabName)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                tab === tabName
                  ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tabName}
            </button>
          ))}
        </div>

        {tab === 'Profile' && (
          <div className={cardClass}>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                <Avatar name={profile.displayName} photoURL={profile.photoURL} size="lg" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white shadow hover:bg-violet-500"
                  aria-label="Change photo"
                >
                  {uploadingPhoto ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoChange(e)} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{profile.displayName}</p>
                <p className="text-sm text-zinc-500">{profile.email}</p>
              </div>
            </div>

            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className={labelClass}>Display name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
              </div>
              <button
                type="submit"
                disabled={savingName || !name.trim() || name === profile.displayName}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {savingName ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>
        )}

        {tab === 'Password' && (
          <div className={cardClass}>
            {hasPassword ? (
              <form onSubmit={handleChangePassword} className="max-w-sm space-y-3">
                <div>
                  <label className={labelClass}>Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm new password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className={fieldClass}
                  />
                </div>
                {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {savingPassword ? 'Saving...' : 'Change password'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-zinc-500">
                Your account signs in with Google, so there's no separate password to manage here.
              </p>
            )}
          </div>
        )}

        {tab === 'Notifications' && (
          <div className={`${cardClass} space-y-4`}>
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Browser notifications</p>
                <p className="text-sm text-zinc-500">Show a system notification when this tab is in the background.</p>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={profile.notificationPrefs.browserEnabled}
                  onChange={(e) => void handleTogglePref('browserEnabled', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-violet-600 dark:bg-white/10" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </label>
            </div>

            {PREF_LABELS.map(({ key, label, description }) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                  <p className="text-sm text-zinc-500">{description}</p>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={profile.notificationPrefs[key]}
                    onChange={(e) => void handleTogglePref(key, e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-violet-600 dark:bg-white/10" />
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        )}

        {tab === 'Appearance' && (
          <div className={cardClass}>
            <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">Theme</p>
            <p className="mb-4 text-sm text-zinc-500">Choose how Flowboard looks. This is saved on this device.</p>
            <ThemeToggle />
          </div>
        )}

        {tab === 'Danger zone' && (
          <div className={`${cardClass} border-red-500/20`}>
            <div className="mb-4 flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Delete your account</p>
                <p className="text-sm text-zinc-500">
                  This permanently deletes your account and profile. Tasks assigned to you will be unassigned;
                  tasks and comments you created stay on the board for your team. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="max-w-sm space-y-3">
              {hasPassword && (
                <div>
                  <label className={labelClass}>Confirm your password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              )}
              <div>
                <label className={labelClass}>Type DELETE to confirm</label>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className={fieldClass}
                  placeholder="DELETE"
                />
              </div>
              {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? 'Deleting account...' : 'Permanently delete account'}
              </button>
            </div>

            <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="text-sm text-zinc-500 underline-offset-2 hover:underline"
              >
                Or just sign out instead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
