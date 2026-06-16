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

/** Fetch a Firebase user's email + displayName by uid. Returns null if not found or Admin SDK absent. */
export async function getUserInfo(uid: string): Promise<{ email: string; name: string } | null> {
  if (!admin.apps.length) return null;
  try {
    const u = await admin.auth().getUser(uid);
    return { email: u.email ?? '', name: u.displayName ?? '' };
  } catch {
    return null;
  }
}

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

// ── AI quota (mirrors the desktop's useQuota model) ───────────────────────────
const FREE_AI_ANSWERS = 10;       // free plan: 10 AI answers / month
const TOKENS_PER_ANSWER = 500;    // 1 "answer" ≈ 500 tokens (matches useQuota.ts)

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Resolve a user's plan from users/{uid}, falling back to an active subscription. */
export async function getUserPlan(uid: string): Promise<'free' | 'pro' | 'power'> {
  if (!db) return 'free';
  try {
    const u = await db.collection('users').doc(uid).get();
    const up = u.exists ? u.data()?.plan : undefined;
    if (up === 'pro' || up === 'power') return up;
    const s = await db.collection('subscriptions').doc(uid).get();
    if (s.exists && s.data()?.status === 'active') {
      const sp = s.data()?.plan;
      if (sp === 'pro' || sp === 'power') return sp;
    }
    return 'free';
  } catch {
    return 'free';
  }
}

/**
 * Server-side AI quota check. Reads the user's plan + this month's token usage
 * and decides whether another AI answer is allowed. Read-only — the desktop
 * client still increments usage (writing here too would double-count).
 */
export async function checkAiQuota(uid: string): Promise<{
  allowed: boolean; plan: string; used: number; limit: number;
}> {
  const plan = await getUserPlan(uid);
  if (plan !== 'free') return { allowed: true, plan, used: 0, limit: Infinity };

  let tokensUsed = 0;
  if (db) {
    try {
      const snap = await db
        .collection('usage_tracking').doc(uid)
        .collection('months').doc(monthKey()).get();
      tokensUsed = snap.exists ? (snap.data()?.tokensUsed || 0) : 0;
    } catch { /* read failure → fail open (don't block paying-adjacent users) */ }
  }
  const used = Math.ceil(tokensUsed / TOKENS_PER_ANSWER);
  return { allowed: used < FREE_AI_ANSWERS, plan, used, limit: FREE_AI_ANSWERS };
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

// ── Referral program ──────────────────────────────────────────────────────────
// Double-sided: when a referred user makes their first verified payment, BOTH
// the referrer and the referee earn REFERRAL_REWARD rupees of account credit,
// which is applied automatically at their next checkout. All credit mutations
// happen server-side (Admin SDK) so a client can never grant itself money.

export const REFERRAL_REWARD = 100; // ₹ credit per side per successful paid referral

// Unambiguous alphabet (no I/O/0/1) for human-shareable codes.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode(len = 7): string {
  let s = '';
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

/** Ensure the user has a unique referralCode; returns it (or null if no DB). */
export async function getOrCreateReferralCode(uid: string): Promise<string | null> {
  if (!db) return null;
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  const existing = snap.exists ? (snap.data()?.referralCode as string | undefined) : undefined;
  if (existing) return existing;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const dup = await db.collection('users').where('referralCode', '==', code).limit(1).get();
    if (dup.empty) {
      await userRef.set({ referralCode: code, updatedAt: Date.now() }, { merge: true });
      return code;
    }
  }
  return null;
}

/** Read the user's referral summary for the dashboard. */
export async function getReferralSummary(uid: string): Promise<{
  code: string | null; credits: number; count: number;
}> {
  const code = await getOrCreateReferralCode(uid);
  if (!db) return { code, credits: 0, count: 0 };
  const snap = await db.collection('users').doc(uid).get();
  const d = snap.exists ? snap.data() : {};
  return { code, credits: d?.referralCredits ?? 0, count: d?.referralCount ?? 0 };
}

export async function getReferralCredits(uid: string): Promise<number> {
  if (!db) return 0;
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? (snap.data()?.referralCredits ?? 0) : 0;
}

/**
 * Referee claims a referral code at signup. Grants the referee REFERRAL_REWARD
 * credit immediately (usable on their first payment) and records a `pending`
 * referral; the referrer is only paid once the referee actually pays.
 * Idempotent + guarded against self-referral and stale/late claims.
 */
export async function claimReferral(
  refereeUid: string,
  refereeEmail: string,
  code: string,
): Promise<{ ok: boolean; reason?: string; referrerUid?: string }> {
  if (!db || !code) return { ok: false, reason: 'unavailable' };

  const norm = code.trim().toUpperCase();
  const q = await db.collection('users').where('referralCode', '==', norm).limit(1).get();
  if (q.empty) return { ok: false, reason: 'invalid-code' };
  const referrerUid = q.docs[0].id;
  if (referrerUid === refereeUid) return { ok: false, reason: 'self' };

  const refereeRef = db.collection('users').doc(refereeUid);
  const txResult = await db.runTransaction(async (tx) => {
    const snap = await tx.get(refereeRef);
    if (!snap.exists) return { ok: false, reason: 'no-user' };
    const r = snap.data() ?? {};
    if (r.referredByUid || r.refereeRewardClaimed) return { ok: false, reason: 'already' };
    // Only brand-new accounts may claim — blocks long-time users harvesting credit.
    if (r.createdAt && Date.now() - r.createdAt > 24 * 60 * 60 * 1000) {
      return { ok: false, reason: 'too-old' };
    }
    tx.set(refereeRef, {
      referredByUid: referrerUid,
      referralCredits: (r.referralCredits ?? 0) + REFERRAL_REWARD,
      refereeRewardClaimed: true,
      updatedAt: Date.now(),
    }, { merge: true });
    return { ok: true };
  });
  if (!txResult.ok) return txResult;

  await db.collection('referrals').add({
    referrerUid, refereeUid, refereeEmail: refereeEmail ?? '',
    status: 'pending', rewardAmount: REFERRAL_REWARD,
    createdAt: Date.now(), rewardedAt: null,
  });
  return { ok: true, referrerUid };
}

/**
 * Deducts `amount` of credit from a user for a specific order. Idempotent per
 * orderId via a `credit_redemptions/{orderId}` marker, so verify-payment and
 * the webhook can both call it without double-charging.
 */
export async function redeemCreditForOrder(uid: string, orderId: string, amount: number): Promise<boolean> {
  if (!db || amount <= 0 || !orderId) return false;
  const redemptionRef = db.collection('credit_redemptions').doc(orderId);
  const userRef = db.collection('users').doc(uid);
  try {
    return await db.runTransaction(async (tx) => {
      const red = await tx.get(redemptionRef);
      if (red.exists) return false; // already redeemed for this order
      const us = await tx.get(userRef);
      const cur = us.exists ? (us.data()?.referralCredits ?? 0) : 0;
      tx.set(userRef, { referralCredits: Math.max(0, cur - amount), updatedAt: Date.now() }, { merge: true });
      tx.set(redemptionRef, { uid, orderId, amount, redeemedAt: Date.now() });
      return true;
    });
  } catch (e) {
    console.error('[referral] redeemCreditForOrder failed:', e);
    return false;
  }
}

/**
 * On a referee's first verified payment, flip their pending referral to
 * `rewarded` and grant the referrer REFERRAL_REWARD credit + increment count.
 * Idempotent: the transaction re-checks status === 'pending'.
 */
export async function rewardReferrerOnPayment(refereeUid: string, orderId: string, paymentId: string): Promise<void> {
  if (!db) return;
  const q = await db.collection('referrals')
    .where('refereeUid', '==', refereeUid)
    .where('status', '==', 'pending')
    .limit(1).get();
  if (q.empty) return;

  const refDocRef = q.docs[0].ref;
  const referrerUid = q.docs[0].data().referrerUid as string;
  const reward = (q.docs[0].data().rewardAmount as number) ?? REFERRAL_REWARD;
  const referrerRef = db.collection('users').doc(referrerUid);

  try {
    const granted = await db.runTransaction(async (tx) => {
      const rd = await tx.get(refDocRef);
      if (!rd.exists || rd.data()?.status !== 'pending') return false;
      const rs = await tx.get(referrerRef);
      const cur = rs.exists ? (rs.data()?.referralCredits ?? 0) : 0;
      const cnt = rs.exists ? (rs.data()?.referralCount ?? 0) : 0;
      tx.set(referrerRef, { referralCredits: cur + reward, referralCount: cnt + 1, updatedAt: Date.now() }, { merge: true });
      tx.set(refDocRef, { status: 'rewarded', rewardedAt: Date.now(), orderId, paymentId }, { merge: true });
      return true;
    });
    if (granted) {
      await db.collection('admin_logs').add({
        adminUid: 'system', adminEmail: 'referral-system', action: 'referral_reward',
        targetUserId: referrerUid, details: { refereeUid, orderId, paymentId, reward }, timestamp: Date.now(),
      });
    }
  } catch (e) {
    console.error('[referral] rewardReferrerOnPayment failed:', e);
  }
}
