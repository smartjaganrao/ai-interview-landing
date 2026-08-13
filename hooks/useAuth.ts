'use client';

import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // Recovery: if the Firestore user document is missing, create a minimal one.
        // This handles edge cases where Firebase Auth was created but the
        // sign-up transaction failed or was interrupted.
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
