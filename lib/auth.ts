import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Maps Firebase auth error codes to clear, actionable messages.
 */
export function friendlyAuthError(err: unknown): string {
  const code = (err as AuthError)?.code || '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase. The site owner must add it under Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. The site owner must enable it under Authentication → Sign-in method.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Redirecting you to sign in...';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in is already in progress.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return (err as Error)?.message || 'Failed to sign in with Google.';
  }
}

/**
 * Signs in with Google. Tries popup first; if the browser blocks the popup,
 * falls back to a full-page redirect (more reliable on production domains).
 * Returns the UserCredential on popup success, or null if a redirect was kicked off.
 */
export async function googleSignIn(): Promise<UserCredential | null> {
  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err as AuthError)?.code || '';
    // Popup blocked / unsupported → use redirect instead
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return null; // page will redirect; result handled by getRedirectResult
    }
    throw err;
  }
}

/**
 * Ensures Firestore docs exist for a freshly authenticated user.
 * Idempotent: only creates docs if they don't already exist.
 */
export async function ensureUserDocs(
  cred: UserCredential,
  plan: 'free' | 'pro' | 'power' = 'free'
): Promise<void> {
  const uid = cred.user.uid;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: cred.user.email,
      name: cred.user.displayName || 'User',
      uid,
      plan,
      createdAt: Date.now(),
      settings: { theme: 'dark', language: 'en' },
    });

    await setDoc(doc(db, 'subscriptions', uid), {
      plan,
      status: 'active',
      createdAt: Date.now(),
    });
  }
}
