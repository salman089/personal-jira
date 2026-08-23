import type { User } from 'firebase/auth'
import { createContext } from 'react'
import type { AppUser, NotificationPrefs } from '../types'

export interface AuthContextValue {
  user: User | null
  /** The user's profile doc from `users/{uid}` -- null until it's loaded/created. */
  profile: AppUser | null
  /** True once we've heard back from Firebase about auth state. */
  authLoading: boolean
  /** True while the profile doc is being fetched or provisioned for a new user. */
  profileLoading: boolean
  signInWithGoogle: () => Promise<void>
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
  updatePhotoURL: (photoURL: string) => Promise<void>
  updateNotificationPrefs: (prefs: Partial<NotificationPrefs>) => Promise<void>
  /** Requires the email/password account's current password to reauthenticate. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  /** For email/password accounts, pass the current password to reauthenticate first. */
  deleteAccount: (currentPassword?: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
