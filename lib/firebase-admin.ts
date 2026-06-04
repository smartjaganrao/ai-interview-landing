/**
 * Server-side Firebase Admin SDK initialisation for the landing/billing service.
 * Only runs in Node.js (Next.js API routes, never in the browser bundle).
 *
 * Requires FIREBASE_ADMIN_SDK_JSON env var (same service-account JSON used by
 * the admin panel). If absent, `db` is null and callers should degrade
 * gracefully rather than crash.
 */
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;

function init() {
  if (admin.apps.length) {
    db = admin.firestore();
    return;
  }

  const raw = process.env.FIREBASE_ADMIN_SDK_JSON;
  if (!raw) {
    console.warn('[firebase-admin/landing] FIREBASE_ADMIN_SDK_JSON not set — server-side Firestore writes disabled.');
    return;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
  } catch (e) {
    console.error('[firebase-admin/landing] Failed to initialise:', e);
  }
}

init();

export { db };

/** Verify a Firebase ID token (from the desktop app). Returns the uid or null. */
export async function verifyIdToken(token: string): Promise<{ uid: string; email?: string } | null> {
  if (!admin.apps.length) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

/** Write (or update) a subscription document server-side. */
export async function persistSubscription(params: {
  userId: string;
  plan: 'pro' | 'power';
  billing: 'monthly' | 'yearly';
  amount: number;
  paymentId: string;
  orderId: string;
  source: 'checkout' | 'webhook';
}): Promise<boolean> {
  if (!db) return false;
  try {
    const renewalDate =
      Date.now() + (params.billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000;

    await db.collection('subscriptions').doc(params.userId).set(
      {
        plan: params.plan,
        status: 'active',
        billing: params.billing,
        amount: params.amount,
        startedAt: Date.now(),
        renewalDate,
        paymentId: params.paymentId,
        orderId: params.orderId,
        updatedAt: Date.now(),
        updatedBy: params.source,
      },
      { merge: true }
    );

    // Mirror plan onto the user doc so every surface (admin, desktop) picks it up.
    await db.collection('users').doc(params.userId).set(
      { plan: params.plan, updatedAt: Date.now() },
      { merge: true }
    );

    await db.collection('admin_logs').add({
      adminUid: 'system',
      adminEmail: 'razorpay-webhook',
      action: 'subscription_activate',
      targetUserId: params.userId,
      details: {
        plan: params.plan,
        billing: params.billing,
        amount: params.amount,
        paymentId: params.paymentId,
        source: params.source,
      },
      timestamp: Date.now(),
    });

    return true;
  } catch (e) {
    console.error('[firebase-admin/landing] persistSubscription failed:', e);
    return false;
  }
}
