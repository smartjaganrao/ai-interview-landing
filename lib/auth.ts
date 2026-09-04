import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  UserCredential,
  User,
  AuthError,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, collection, Timestamp, runTransaction, query, where, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { PlanId } from './pricing-config';

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

/**
 * Ensures Firestore docs exist for a freshly authenticated user.
 * Uses a Firestore transaction so concurrent calls for the same UID
 * cannot create duplicate documents.
 * Retries up to 3 times on transient errors so a momentary Firestore hiccup
 * doesn't leave the user with no profile.
 *
 * Also enforces email uniqueness: if another user document already has the
 * same email, we merge into that document instead of creating a duplicate.
 * This protects against the same email being registered under multiple UIDs
 * (e.g. when Firebase Auth's "one account per email" setting is off, or
 * when a user switches sign-in methods).
 *
 * Takes the Firebase Auth `User` (not the full `UserCredential`) so it can
 * be called equally from a fresh sign-in (`cred.user`) or later, from
 * `retryPendingUserSync` via `useAuth`'s `onAuthStateChanged` (`currentUser`)
 * — both are the same shape, only the original sign-in has a `UserCredential`.
 */
export async function ensureUserDocs(
  user: User,
  plan: PlanId = 'free'
): Promise<void> {
  const uid = user.uid;
  const userRef = doc(db, 'users', uid);
  const email = user.email ?? '';
  const name  = user.displayName || 'there';
  const now   = Date.now();

  // ── Duplicate email protection (outside transaction) ─────────────────────
  // Firestore transactions only allow document gets, not queries, so we
  // check for an existing user with the same email beforehand. If one is
  // found, we merge into it instead of creating a new document.
  let existingEmailDocId: string | null = null;
  if (email) {
    const emailQuery = query(collection(db, 'users'), where('email', '==', email));
    const emailSnap = await getDocs(emailQuery);
    const existing = emailSnap.docs.find(d => d.id !== uid);
    if (existing) {
      existingEmailDocId = existing.id;
    }
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) {
          // If another doc already has this email, merge into it
          if (existingEmailDocId) {
            const existingRef = doc(db, 'users', existingEmailDocId);
            tx.set(existingRef, {
              uid,
              email,
              name,
              plan,
              createdAt: now,
              updatedAt: now,
              settings: { theme: 'dark', language: 'en' },
            }, { merge: true });
            tx.set(doc(db, 'subscriptions', uid), { plan, status: 'active', createdAt: now }, { merge: true });
            return;
          }

          tx.set(userRef, {
            email, name, uid, plan,
            createdAt: now,
            settings: { theme: 'dark', language: 'en' },
          });

          tx.set(doc(db, 'subscriptions', uid), { plan, status: 'active', createdAt: now });

          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://javihai.in';
          const q = collection(db, 'email_queue');
          tx.set(doc(q), { email, name, type: 'welcome', sendAfter: Timestamp.fromMillis(now), sentAt: null, uid });
          tx.set(doc(q), { email, name, type: 'day2',  sendAfter: Timestamp.fromMillis(now + 2 * 24 * 60 * 60 * 1000), sentAt: null, uid });
          tx.set(doc(q), { email, name, type: 'day5',  sendAfter: Timestamp.fromMillis(now + 5 * 24 * 60 * 60 * 1000), sentAt: null, uid });
          tx.set(doc(q), { email, name, type: 'referral', sendAfter: Timestamp.fromMillis(now + 3 * 24 * 60 * 60 * 1000), sentAt: null, uid });

          fetch(`${appUrl}/api/email/welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, type: 'welcome' }),
          }).catch(() => {});
        } else {
          const existing = snap.data() as Record<string, unknown> | undefined;
          const updates: Record<string, unknown> = {};
          if (email && !existing?.email) updates.email = email;
          if (name && existing?.name !== name && !(existing?.name as string)?.trim()) updates.name = name;
          if (!existing?.createdAt) updates.createdAt = now;
          if (Object.keys(updates).length > 0) {
            tx.set(userRef, { ...updates, updatedAt: now }, { merge: true });
          }
        }
      });
      return;
    } catch (e) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 500));
        continue;
      }
      console.error('[ensureUserDocs] Firestore error after 3 attempts:', e);
      throw e;
    }
  }
}

/**
 * Reads the persisted attribution from localStorage and writes the technical
 * (first-touch / last-touch / referrer / creator) attribution into the user's
 * Firestore document. Best-effort — never blocks the auth flow.
 */
export async function persistAttribution(uid: string): Promise<void> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('javihai_attribution') : null;
    if (!raw) return;
    const attribution = JSON.parse(raw);
    const userRef = doc(db, 'users', uid);
    const patch: Record<string, unknown> = {};

    if (attribution.referralCode) patch.referralCode = attribution.referralCode;
    if (attribution.creatorCode) patch.creatorCode = attribution.creatorCode;

    const firstTouch = (attribution.firstTouch || {}) as Record<string, unknown>;
    const lastTouch = (attribution.lastTouch || {}) as Record<string, unknown>;

    patch.acquisition = {
      firstTouchSource: firstTouch.source || null,
      firstTouchMedium: firstTouch.medium || null,
      firstTouchCampaign: firstTouch.campaign || null,
      firstTouchContent: firstTouch.content || null,
      firstTouchTerm: firstTouch.term || null,
      firstTouchReferrer: firstTouch.referrer || null,
      firstTouchLandingPage: firstTouch.landingPage || null,
      firstTouchAt: firstTouch.at || null,
      lastTouchSource: lastTouch.source || null,
      lastTouchMedium: lastTouch.medium || null,
      lastTouchCampaign: lastTouch.campaign || null,
      lastTouchContent: lastTouch.content || null,
      lastTouchAt: lastTouch.at || null,
    };

    await setDoc(userRef, patch, { merge: true });
  } catch {
    // attribution is best-effort
  }
}

/**
 * Checks whether a user document represents a fully completed profile.
 * Supports both the new nested profile structure and legacy flat fields.
 */
export function isProfileComplete(userData: Record<string, unknown> | null | undefined): boolean {
  if (!userData) return false;

  // New structure with explicit flag
  if (userData.profileCompleted === true) return true;

  // Nested profile object
  const profile = userData.profile as Record<string, unknown> | undefined;
  if (profile) {
    return !!(
      (profile.fullName as string)?.trim() &&
      (profile.whatsapp as string)?.trim() &&
      (profile.experienceLevel as string)?.trim() &&
      (profile.jobRole as string)?.trim() &&
      (profile.city as string)?.trim() &&
      (userData.acquisition as Record<string, unknown>)?.customerSelectedSource
    );
  }

  // Legacy flat fields
  return false;
}

