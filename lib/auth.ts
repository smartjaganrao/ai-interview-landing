import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  UserCredential,
  AuthError,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Maps Firebase auth error codes to clear, actionable messages.
 *
 * Async because `auth/account-exists-with-different-credential` (thrown when
 * Firebase's "One account per email address" setting is on and this email
 * already has a non-Google sign-in method — e.g. the desktop app's
 * email+password signup) needs a lookup to say something more useful than
 * Firebase's raw error text. Landing only offers Google sign-in, so a user
 * in that state has no way forward here — the message tells them to use the
 * desktop app instead of leaving them stuck on a dead end.
 */
export async function friendlyAuthError(err: unknown): Promise<string> {
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
    case 'auth/account-exists-with-different-credential': {
      const email = (err as AuthError)?.customData?.email as string | undefined;
      if (email) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('password')) {
            return `An account already exists for ${email} with a password (likely created in the JavihAI desktop app). Please sign in there with your email and password instead of Google — signing up here with a different method isn't supported yet.`;
          }
        } catch {
          /* fall through to generic message below */
        }
      }
      return 'An account already exists for this email using a different sign-in method. Please use the method you originally signed up with.';
    }
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

/** Races a promise against a timeout — resolves to undefined on timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), ms)),
  ]);
}

/**
 * Ensures Firestore docs exist for a freshly authenticated user.
 * Idempotent: only creates docs if they don't already exist.
 * Resilient: if Firestore is unavailable (deleted DB, network error), login
 * still succeeds — the user lands on the dashboard in degraded state.
 */
export async function ensureUserDocs(
  cred: UserCredential,
  plan: 'free' | 'pro' | 'power' = 'free'
): Promise<void> {
  const uid = cred.user.uid;
  const userRef = doc(db, 'users', uid);

  try {
    // Timeout after 6 s — if Firestore DB is deleted/unavailable, don't hang login.
    const snap = await withTimeout(getDoc(userRef), 6000);
    if (snap === undefined) {
      console.warn('[ensureUserDocs] Firestore timeout — DB may be unavailable');
      return;
    }

    if (!snap.exists()) {
      const email = cred.user.email ?? '';
      const name  = cred.user.displayName || 'there';
      const now   = Date.now();

      await setDoc(userRef, {
        email, name, uid, plan,
        createdAt: now,
        settings: { theme: 'dark', language: 'en' },
      });

      await setDoc(doc(db, 'subscriptions', uid), {
        plan, status: 'active', createdAt: now,
      });

      // Send welcome email (Day 0) + queue Day 2 and Day 5
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://javihai.in';
        fetch(`${appUrl}/api/email/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, type: 'welcome' }),
        }).catch(() => {});

        const queue = collection(db, 'email_queue');
        await addDoc(queue, { email, name, type: 'day2', sendAfter: Timestamp.fromMillis(now + 2 * 24 * 60 * 60 * 1000), sentAt: null, uid });
        await addDoc(queue, { email, name, type: 'day5', sendAfter: Timestamp.fromMillis(now + 5 * 24 * 60 * 60 * 1000), sentAt: null, uid });
      } catch { /* email is non-critical — never block signup */ }
    }
  } catch (e) {
    // Firestore threw (DB deleted, rules denied, network). Log and continue —
    // never block login for a DB error.
    console.warn('[ensureUserDocs] Firestore error (DB unavailable?):', e);
  }
}
