'use client';

import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { retryPendingUserSync } from '@/lib/pending-user-sync';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
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

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
