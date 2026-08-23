const MESSAGES: Record<string, string> = {
  // Auth
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/network-request-failed': 'Network error -- check your connection and try again.',
  'auth/requires-recent-login': 'Please re-enter your password to confirm this change.',
  'auth/operation-not-allowed':
    'Email/password sign-in isn’t turned on for this project yet. In the Firebase Console, go to Authentication → Sign-in method and enable "Email/Password".',
  // Firestore
  'permission-denied': 'You don’t have permission to do that.',
  unavailable: 'Could not reach the server. Check your connection and try again.',
  'failed-precondition': 'This needs a database index that hasn’t been set up yet.',
  cancelled: 'That was cancelled. Please try again.',
  'deadline-exceeded': 'That took too long. Please try again.',
}

/** Turns a Firebase error (Auth or Firestore) into a message safe to show a user. */
export function firebaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    if (MESSAGES[code]) return MESSAGES[code]
  }
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}
