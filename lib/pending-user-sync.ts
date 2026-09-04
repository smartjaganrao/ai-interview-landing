import type { User } from 'firebase/auth';
import type { PlanId } from './pricing-config';
import { ensureUserDocs, persistAttribution } from './auth';

const KEY_PREFIX = 'javihai_pending_sync:';

export interface PendingUserSync {
  uid: string;
  email: string;
  name: string;
  plan: PlanId;
  queuedAt: number;
}

/**
 * Queues a user's account-doc write for later retry when Firestore itself
 * (not Firebase Auth, which is a separate system and unaffected) is
 * unreachable — e.g. a quota exhaustion. The user is already validly
 * authenticated at this point; this just means `users/{uid}` hasn't been
 * created/updated yet. See `retryPendingUserSync`, called from `useAuth`
 * on every subsequent page load until it succeeds.
 */
export function savePendingUserSync(user: User, plan: PlanId): void {
  try {
    const record: PendingUserSync = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || 'there',
      plan,
      queuedAt: Date.now(),
    };
    localStorage.setItem(KEY_PREFIX + user.uid, JSON.stringify(record));
  } catch {
    // localStorage unavailable (private mode / quota) — nothing more we can do client-side
  }
}

export function getPendingUserSync(uid: string): PendingUserSync | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + uid);
    return raw ? (JSON.parse(raw) as PendingUserSync) : null;
  } catch {
    return null;
  }
}

export function clearPendingUserSync(uid: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + uid);
  } catch {
    // ignore
  }
}

/**
 * Retries a queued account-doc write, if one exists for this user. Silent
 * no-op if there's nothing pending, and silent (re-queued) failure if
 * Firestore is still unreachable — this is meant to be called on every page
 * load via `useAuth`, not surfaced to the user as an error each time.
 */
export async function retryPendingUserSync(user: User): Promise<void> {
  const pending = getPendingUserSync(user.uid);
  if (!pending) return;
  try {
    await ensureUserDocs(user, pending.plan);
    await persistAttribution(user.uid);
    clearPendingUserSync(user.uid);
  } catch (err) {
    console.warn('[pending-user-sync] retry failed, still queued:', err);
  }
}
