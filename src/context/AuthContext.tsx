import {
  EmailAuthProvider,
  type User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { type ReactNode, useEffect, useState } from 'react'
import { auth, db, googleProvider } from '../lib/firebase'
import { cleanupUserData } from '../lib/accountCleanup'
import { DEFAULT_NOTIFICATION_PREFS, type AppUser, type NotificationPrefs } from '../types'
import { AuthContext } from './auth-context'

function hasPasswordProvider(user: User) {
  return user.providerData.some((provider) => provider.providerId === 'password')
}

/**
 * Creates the users/{uid} profile doc the FIRST time someone signs in, so
 * new accounts "just work" with no pre-approval step. This is the only
 * place that ever creates a profile doc -- every sign-in path below calls
 * it, and it no-ops if the doc already exists. Keeping creation in one spot
 * (rather than also creating opportunistically from a listener) avoids a
 * race where two code paths could create the doc with different data.
 */
async function ensureProfile(user: User, displayNameOverride?: string) {
  const profileRef = doc(db, 'users', user.uid)
  const existing = await getDoc(profileRef)
  if (existing.exists()) return

  const newProfile: Omit<AppUser, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: displayNameOverride || user.displayName || user.email?.split('@')[0] || 'New user',
    photoURL: user.photoURL,
    workspaceIds: [],
    createdAt: serverTimestamp(),
    notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
  }
  await setDoc(profileRef, newProfile)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Derived rather than tracked separately: we're "loading the profile"
  // exactly when we have a signed-in user but haven't yet received a
  // profile snapshot that matches them (covers both the very first load
  // and switching from one signed-in user to another).
  const profileLoading = user !== null && (!profile || profile.uid !== user.uid)

  // Auth state: fires on load and whenever the user signs in/out.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
      if (!firebaseUser) setProfile(null)
    })
    return unsubscribe
  }, [])

  // Profile: read-only live subscription. Creation happens exclusively in
  // ensureProfile(), called from the sign-in/register functions below, so
  // this effect never needs to write anything.
  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? (snapshot.data() as AppUser) : null)
    })

    return unsubscribe
  }, [user])

  const signInWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider)
    await ensureProfile(credential.user)
  }

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
    await ensureProfile(credential.user, name)
  }

  const signInWithEmail = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    // Normally a no-op (the profile was created at registration) -- this
    // only matters for an account that somehow exists in Auth but not yet
    // in Firestore, so sign-in never leaves someone stuck without a profile.
    await ensureProfile(credential.user)
  }

  const signOutUser = async () => {
    await firebaseSignOut(auth)
  }

  const updateDisplayName = async (name: string) => {
    if (!auth.currentUser) return
    await updateProfile(auth.currentUser, { displayName: name })
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name })
  }

  const updatePhotoURL = async (photoURL: string) => {
    if (!auth.currentUser) return
    await updateProfile(auth.currentUser, { photoURL })
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL })
  }

  const updateNotificationPrefs = async (prefs: Partial<NotificationPrefs>) => {
    if (!auth.currentUser || !profile) return
    const merged = { ...profile.notificationPrefs, ...prefs }
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { notificationPrefs: merged })
  }

  const reauthenticate = async (currentPassword?: string) => {
    if (!auth.currentUser) throw new Error('Not signed in')
    if (hasPasswordProvider(auth.currentUser)) {
      if (!currentPassword) throw new Error('Current password is required')
      const credential = EmailAuthProvider.credential(auth.currentUser.email ?? '', currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
    } else {
      await reauthenticateWithPopup(auth.currentUser, googleProvider)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser) return
    if (!hasPasswordProvider(auth.currentUser)) {
      throw new Error('This account signs in with Google and has no password to change.')
    }
    await reauthenticate(currentPassword)
    await firebaseUpdatePassword(auth.currentUser, newPassword)
  }

  const deleteAccount = async (currentPassword?: string) => {
    if (!auth.currentUser) return
    await reauthenticate(currentPassword)
    await cleanupUserData(auth.currentUser.uid, profile?.workspaceIds ?? [])
    await deleteUser(auth.currentUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authLoading,
        profileLoading,
        signInWithGoogle,
        registerWithEmail,
        signInWithEmail,
        signOutUser,
        updateDisplayName,
        updatePhotoURL,
        updateNotificationPrefs,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
