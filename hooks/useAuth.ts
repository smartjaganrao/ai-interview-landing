'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

// Firebase (auth + firestore) and lib/pending-user-sync are dynamic-imported
// below instead of statically imported at the top of this file. useAuth()
// is reachable from the homepage's critical render path (LandingClient ->
// useGatedDownload -> useAuth), which isn't code-split, so a static import
// here put the ~117KB Firebase SDK chunk (measured 83% unused on the
// homepage) in the bundle the browser must parse before the hero can
// paint. onAuthStateChanged already only ever ran inside this effect
// (post-mount, not during initial render), so deferring the import to the
// same point changes *when the bytes load*, not any auth behavior/timing
// a user would notice. lib/firebase.ts and lib/auth.ts themselves are
// unchanged — every other consumer across the app still gets them eagerly
// exactly as before.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ auth, db }, { doc, getDoc, runTransaction }, { retryPendingUserSync }] = await Promise.all([
        import('@/lib/firebase'),
        import('firebase/firestore'),
        import('@/lib/pending-user-sync'),
      ]);
      if (cancelled) return;

      unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser) {
          // If login/signup deferred the account-doc write because Firestore
          // was unreachable (see savePendingUserSync), retry it now — this
          // fires on every page load while a sync is still queued, since
          // onAuthStateChanged re-fires with the current user on every fresh
          // mount of useAuth(), not just on the original sign-in.
          await retryPendingUserSync(currentUser);

          // Recovery: if the Firestore user document is missing, create a minimal one.
          // This handles edge cases where Firebase Auth was created but the
          // sign-up transaction failed or was interrupted (unrelated to the
          // pending-sync case above, which already covers that — this is a
          // last-resort net for any other path that skipped it).
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(userDocRef);
            if (!snap.exists()) {
              await runTransaction(db, async (tx) => {
                const recheck = await tx.get(userDocRef);
                if (!recheck.exists()) {
                  tx.set(userDocRef, {
                    uid: currentUser.uid,
                    email: currentUser.email || '',
                    name: currentUser.displayName || 'there',
                    plan: 'free',
                    createdAt: Date.now(),
                    settings: { theme: 'dark', language: 'en' },
                  });
                }
              });
            }
          } catch (err) {
            console.warn('[useAuth] ensureUserDocExists failed:', err);
          }
        }
        setUser(currentUser);
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { user, loading };
}
