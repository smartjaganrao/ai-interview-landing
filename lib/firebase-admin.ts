/**
 * Server-side Firebase Admin SDK initialisation for the landing/billing service.
 * Only runs in Node.js (Next.js API routes, never in the browser bundle).
 *
 * Requires FIREBASE_ADMIN_SDK_JSON env var (same service-account JSON used by
 * the admin panel). If absent, `db` is null and callers should degrade
 * gracefully rather than crash.
 */
import * as admin from 'firebase-admin';
import {
  PlanId,
  AnyPlanId,
  PLANS,
  PLAN_RANK,
  migratePlanId,
  getPlanById,
} from './pricing-config';

let db: admin.firestore.Firestore | null = null;

const pricingCache = new Map<string, { data: Pricing; expiresAt: number }>();
const PRICING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    const raw = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!raw) {
      console.warn('[firebase-admin/landing] FIREBASE_ADMIN_SDK_JSON not set — server-side Firestore writes disabled.');
      return;
    }

    let serviceAccount: any = null;
    // First attempt: standard parse.
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      // Fallback: env-var packaging often corrupts multi-line PEM keys.
      // Try to sanitize only the private_key value and re-parse.
      try {
        const sanitized = raw.replace(/("private_key"\s*:\s*")([\s\S]*?)(")/, (_match, start, key, end) => {
          const normalized = key.replace(/\n/g, '\\n').replace(/\r/g, '');
          return `${start}${normalized}${end}`;
        });
        serviceAccount = JSON.parse(sanitized);
        if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
      } catch {
        console.error('[firebase-admin/landing] Failed to parse service account JSON after sanitization.');
        return;
      }
    }

    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
  } catch (e) {
    console.error('[firebase-admin/landing] Failed to initialise:', e);
  }
}

init();

export { db, PLAN_RANK, getPlanById };

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
const FREE_AI_ANSWERS = 10;       // free plan: 10 AI answers / day (trial)
const TOKENS_PER_ANSWER = 500;    // 1 "answer" ≈ 500 tokens (matches useQuota.ts)

// Paid plans are marketed as "unlimited" and stay that way for the user —
// these are soft ceilings, not visible limits. Real usage sits nowhere near
// them; they only exist to cap worst-case Groq spend from abuse or a stuck
// client looping, not to throttle genuine interview prep.
const PAID_DAILY_LIMITS: Partial<Record<PlanId, number>> = { quick_pass: 150, pro: 150, power: 300 };

export function dayKey(): string {
  return new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD, consistent across server timezones
}

/** Resolve a user's plan from users/{uid}, falling back to an active subscription. */
const planCache = new Map<string, { plan: PlanId; expiresAt: number }>();
const PLAN_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function getUserPlan(uid: string): Promise<PlanId> {
  if (!db) return 'free';
  const now = Date.now();
  const cached = planCache.get(uid);
  if (cached && cached.expiresAt > now) {
    return cached.plan;
  }
  try {
    const u = await db.collection('users').doc(uid).get();
    const up = u.exists ? u.data()?.plan : undefined;
    const migratedPlan = up ? migratePlanId(up as string) : undefined;
    if (migratedPlan && migratedPlan !== 'free') {
      planCache.set(uid, { plan: migratedPlan, expiresAt: now + PLAN_CACHE_TTL });
      return migratedPlan;
    }
    const s = await db.collection('subscriptions').doc(uid).get();
    if (s.exists && s.data()?.status === 'active') {
      const sp = s.data()?.plan;
      const migratedSubPlan = sp ? migratePlanId(sp as string) : undefined;
      if (migratedSubPlan && migratedSubPlan !== 'free') {
        planCache.set(uid, { plan: migratedSubPlan, expiresAt: now + PLAN_CACHE_TTL });
        return migratedSubPlan;
      }
    }
    planCache.set(uid, { plan: 'free', expiresAt: now + PLAN_CACHE_TTL });
    return 'free';
  } catch {
    return 'free';
  }
}

export function invalidatePlanCache(uid?: string): void {
  if (uid) {
    planCache.delete(uid);
  } else {
    planCache.clear();
  }
}

/**
 * Server-side AI quota check. Reads the user's plan + this month's token usage
 * and decides whether another AI answer is allowed. Read-only — the desktop
 * client still increments usage (writing here too would double-count).
 *
 * Also the enforcement point for admin bans: the admin panel's "Ban User"
 * button only ever set users/{uid}.status — nothing previously read that
 * field outside the admin UI's own badge, so a banned user could still sign
 * in and use AI features with full quota. Checked here since every AI
 * surface (live answers, mock interview) already calls this.
 */
export async function checkAiQuota(uid: string): Promise<{
  allowed: boolean; plan: string; used: number; limit: number; banned?: boolean;
}> {
  if (db) {
    try {
      const u = await db.collection('users').doc(uid).get();
      if (u.data()?.status === 'banned') {
        return { allowed: false, plan: 'free', used: 0, limit: 0, banned: true };
      }
    } catch { /* fail open on read error, same policy as the rest of this function */ }
  }

  const plan = await getUserPlan(uid);
  const limit = plan === 'free' ? FREE_AI_ANSWERS : (PAID_DAILY_LIMITS[plan] ?? Infinity);

  let tokensUsed = 0;
  if (db) {
    try {
      const snap = await db
        .collection('usage_tracking').doc(uid)
        .collection('days').doc(dayKey()).get();
      tokensUsed = snap.exists ? (snap.data()?.tokensUsed || 0) : 0;
    } catch { /* read failure → fail open (don't block paying-adjacent users) */ }
  }
  const used = Math.ceil(tokensUsed / TOKENS_PER_ANSWER);
  return { allowed: used < limit, plan, used, limit };
}

/** Write (or update) a subscription document server-side. */
export async function persistSubscription(params: {
  userId: string;
  plan: PlanId;
  billing: 'monthly' | 'yearly' | 'one-time';
  amount: number;
  paymentId: string;
  orderId: string;
  source: 'checkout' | 'webhook';
  hoursPurchased?: number;
  hoursRemaining?: number;
  expiresAt?: number | null;
  couponCode?: string | null;
}): Promise<boolean> {
  if (!db) return false;
  try {
    const logRef = db.collection('admin_logs').doc(`subscription_activate_${params.paymentId}`);
    const alreadyLogged = (await logRef.get()).exists;

    const isOneTime = params.billing === 'one-time';
    const planConfig = getPlanById(params.plan);
    const renewalDate = isOneTime
      ? (params.expiresAt ?? null)
      : Date.now() + (params.billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000;

    const hoursPurchased = params.hoursPurchased ?? (planConfig ? planConfig.durationValue : 0);
    const hoursRemaining = params.hoursRemaining ?? hoursPurchased;
    const expiresAt = params.expiresAt ?? (isOneTime ? Date.now() + (planConfig?.durationValue ?? 1) * 24 * 60 * 60 * 1000 : null);

    const batch = db.batch();
    batch.set(
      db.collection('subscriptions').doc(params.userId),
      {
        plan: params.plan,
        planType: isOneTime ? 'one-time' : 'subscription',
        status: 'active',
        billing: params.billing,
        amount: params.amount,
        startedAt: Date.now(),
        hoursPurchased,
        hoursRemaining,
        expiresAt,
        couponCode: params.couponCode ?? null,
        ...(isOneTime ? { renewalDate: null } : { renewalDate }),
        paymentId: params.paymentId,
        orderId: params.orderId,
        updatedAt: Date.now(),
        updatedBy: params.source,
      },
      { merge: true }
    );

    const userRef = db.collection('users').doc(params.userId);
    const userSnap = await userRef.get();
    const update: Record<string, unknown> = { plan: params.plan, updatedAt: Date.now() };
    if (!userSnap.exists || !userSnap.data()?.email) {
      try {
        const fbUser = await admin.auth().getUser(params.userId);
        update.email = fbUser.email ?? '';
        update.name = fbUser.displayName ?? '';
      } catch {
        // Admin SDK getUser can fail for deleted/disabled accounts; proceed without backfill
      }
    }
    batch.set(userRef, update, { merge: true });
    if (!alreadyLogged) {
      batch.set(logRef, {
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
          ...(isOneTime ? { hoursPurchased } : {}),
        },
        timestamp: Date.now(),
      });
    }
    await batch.commit();
    invalidatePlanCache(params.userId);

    return true;
  } catch (e) {
    console.error('[firebase-admin/landing] persistSubscription failed:', e);
    return false;
  }
}

/** Decrement remaining hours for one-time plans. Returns true if successful. */
export async function consumeHours(uid: string, hours: number): Promise<boolean> {
  if (!db || hours <= 0) return false;
  try {
    const ref = db.collection('subscriptions').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return false;
    const data = snap.data()!;
    if (data.planType !== 'one-time') return true; // subscriptions are unlimited
    const planConfig = getPlanById(data.plan as AnyPlanId);
    if (planConfig?.isUnlimited) return true;
    const remaining = data.hoursRemaining ?? 0;
    if (remaining <= 0) return false;
    const newRemaining = Math.max(0, remaining - hours);
    await ref.set(
      {
        hoursRemaining: newRemaining,
        updatedAt: Date.now(),
        ...(newRemaining <= 0 ? { status: 'exhausted' } : {}),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[firebase-admin] consumeHours failed:', e);
    return false;
  }
}

/** Get remaining hours for a user. Returns Infinity for unlimited plans. */
export async function getRemainingHours(uid: string): Promise<number> {
  if (!db) return 0;
  try {
    const snap = await db.collection('subscriptions').doc(uid).get();
    if (!snap.exists) return 0;
    const data = snap.data()!;
    if (data.planType !== 'one-time') return Infinity;
    const planConfig = getPlanById(data.plan as AnyPlanId);
    if (planConfig?.isUnlimited) return Infinity;
    if (data.expiresAt && Date.now() > data.expiresAt) return 0;
    return data.hoursRemaining ?? 0;
  } catch {
    return 0;
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
const referralCache = new Map<string, { data: { code: string | null; credits: number; count: number }; expiresAt: number }>();
const REFERRAL_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function getReferralSummary(uid: string): Promise<{
  code: string | null; credits: number; count: number;
}> {
  const code = await getOrCreateReferralCode(uid);
  if (!db) return { code, credits: 0, count: 0 };
  const now = Date.now();
  const cached = referralCache.get(uid);
  if (cached && cached.expiresAt > now) {
    return { ...cached.data, code };
  }
  const snap = await db.collection('users').doc(uid).get();
  const d = snap.exists ? snap.data() : {};
  const result = { code, credits: d?.referralCredits ?? 0, count: d?.referralCount ?? 0 };
  referralCache.set(uid, { data: result, expiresAt: now + REFERRAL_CACHE_TTL });
  return result;
}

export async function getReferralCredits(uid: string): Promise<number> {
  if (!db) return 0;
  const now = Date.now();
  const cached = referralCache.get(uid);
  if (cached && cached.expiresAt > now) {
    return cached.data.credits;
  }
  const snap = await db.collection('users').doc(uid).get();
  const credits = snap.exists ? (snap.data()?.referralCredits ?? 0) : 0;
  const code = await getOrCreateReferralCode(uid);
  referralCache.set(uid, { data: { code, credits, count: 0 }, expiresAt: now + REFERRAL_CACHE_TTL });
  return credits;
}

export function invalidateReferralCache(uid?: string): void {
  if (uid) {
    referralCache.delete(uid);
  } else {
    referralCache.clear();
  }
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

  invalidateReferralCache(refereeUid);
  invalidateReferralCache(referrerUid);

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
    const result = await db.runTransaction(async (tx) => {
      const red = await tx.get(redemptionRef);
      if (red.exists) return false; // already redeemed for this order
      const us = await tx.get(userRef);
      const cur = us.exists ? (us.data()?.referralCredits ?? 0) : 0;
      tx.set(userRef, { referralCredits: Math.max(0, cur - amount), updatedAt: Date.now() }, { merge: true });
      tx.set(redemptionRef, { uid, orderId, amount, redeemedAt: Date.now() });
      return true;
    });
    if (result) invalidateReferralCache(uid);
    return result;
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
      invalidateReferralCache(referrerUid);
      await db.collection('admin_logs').add({
        adminUid: 'system', adminEmail: 'referral-system', action: 'referral_reward',
        targetUserId: referrerUid, details: { refereeUid, orderId, paymentId, reward }, timestamp: Date.now(),
      });
    }
  } catch (e) {
    console.error('[referral] rewardReferrerOnPayment failed:', e);
  }
}

// ── Creator commission program ────────────────────────────────────────────────
// Separate from the peer referral above: approved creators get a vanity link,
// and earn a RECURRING cash commission (default 20%) on every payment from the
// users they bring in — including renewals. Commission accrues to a balance the
// founder pays out manually (UPI). All mutations are Admin-SDK-only; the creator
// reads their stats through an authenticated API, never Firestore directly.

export const CREATOR_COMMISSION_BPS = 2000; // 20.00% — basis points, per-creator override allowed

function creatorCodeBase(name: string): string {
  const alpha = (name || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  return alpha.length >= 3 ? alpha : 'CREATOR';
}

/** Apply = instantly become an active creator with a unique vanity code. */
export async function getOrCreateCreator(uid: string, name: string, email: string): Promise<{
  code: string; status: string; commissionBps: number;
  totalEarned: number; totalPaid: number; referredCount: number; payoutUpi: string | null;
} | null> {
  if (!db) return null;
  const ref = db.collection('creators').doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    const d = snap.data()!;
    return {
      code: d.code, status: d.status ?? 'active', commissionBps: d.commissionBps ?? CREATOR_COMMISSION_BPS,
      totalEarned: d.totalEarned ?? 0, totalPaid: d.totalPaid ?? 0, referredCount: d.referredCount ?? 0,
      payoutUpi: d.payoutUpi ?? null,
    };
  }

  const base = creatorCodeBase(name);
  let code = '';
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `${base}${Math.floor(100 + Math.random() * 900)}`; // e.g. RAHUL742
    const dup = await db.collection('creators').where('code', '==', candidate).limit(1).get();
    if (dup.empty) { code = candidate; break; }
  }
  if (!code) return null;

  await ref.set({
    uid, code, name: name ?? '', email: email ?? '',
    status: 'active', commissionBps: CREATOR_COMMISSION_BPS,
    totalEarned: 0, totalPaid: 0, referredCount: 0, payoutUpi: null,
    createdAt: Date.now(), updatedAt: Date.now(),
  });
  return { code, status: 'active', commissionBps: CREATOR_COMMISSION_BPS, totalEarned: 0, totalPaid: 0, referredCount: 0, payoutUpi: null };
}

/** Read a creator's summary (or null if this user hasn't become a creator). */
const creatorCache = new Map<string, { data: { code: string; status: string; commissionBps: number; totalEarned: number; totalPaid: number; pending: number; referredCount: number; payoutUpi: string | null; }; expiresAt: number }>();
const CREATOR_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function getCreatorSummary(uid: string): Promise<{
  code: string; status: string; commissionBps: number;
  totalEarned: number; totalPaid: number; pending: number;
  referredCount: number; payoutUpi: string | null;
} | null> {
  if (!db) return null;
  const now = Date.now();
  const cached = creatorCache.get(uid);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  const snap = await db.collection('creators').doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  const totalEarned = d.totalEarned ?? 0;
  const totalPaid = d.totalPaid ?? 0;
  const result = {
    code: d.code, status: d.status ?? 'active', commissionBps: d.commissionBps ?? CREATOR_COMMISSION_BPS,
    totalEarned, totalPaid, pending: Math.max(0, totalEarned - totalPaid),
    referredCount: d.referredCount ?? 0, payoutUpi: d.payoutUpi ?? null,
  };
  creatorCache.set(uid, { data: result, expiresAt: now + CREATOR_CACHE_TTL });
  return result;
}

export function invalidateCreatorCache(uid?: string): void {
  if (uid) {
    creatorCache.delete(uid);
  } else {
    creatorCache.clear();
  }
}

export async function setCreatorPayoutUpi(uid: string, upi: string): Promise<boolean> {
  if (!db) return false;
  const ref = db.collection('creators').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.set({ payoutUpi: upi.trim().slice(0, 120), updatedAt: Date.now() }, { merge: true });
  invalidateCreatorCache(uid);
  return true;
}

/**
 * Attribute a freshly-signed-up user to a creator (first-touch wins). Guards
 * self-attribution, inactive creators, and stale (>24h) accounts.
 */
export async function attributeCreator(
  userId: string, email: string, code: string,
): Promise<{ ok: boolean; reason?: string; creatorId?: string }> {
  if (!db || !code) return { ok: false, reason: 'unavailable' };

  const norm = code.trim().toUpperCase();
  const q = await db.collection('creators').where('code', '==', norm).limit(1).get();
  if (q.empty) return { ok: false, reason: 'invalid-code' };
  const creatorDoc = q.docs[0];
  const creatorId = creatorDoc.id;
  if (creatorId === userId) return { ok: false, reason: 'self' };
  if ((creatorDoc.data()?.status ?? 'active') !== 'active') return { ok: false, reason: 'inactive' };

  const attribRef = db.collection('creator_attributions').doc(userId);
  const res = await db.runTransaction(async (tx) => {
    const a = await tx.get(attribRef);
    if (a.exists) return { ok: false, reason: 'already' };
    const us = await tx.get(db!.collection('users').doc(userId));
    if (us.exists && us.data()?.createdAt && Date.now() - us.data()!.createdAt > 24 * 60 * 60 * 1000) {
      return { ok: false, reason: 'too-old' };
    }
    tx.set(attribRef, { userId, creatorId, creatorCode: norm, attributedAt: Date.now(), email: email ?? '' });
    return { ok: true };
  });
  if (res.ok) {
    await creatorDoc.ref.set(
      { referredCount: admin.firestore.FieldValue.increment(1), updatedAt: Date.now() },
      { merge: true },
    );
  }
  return { ...res, creatorId };
}

/**
 * Accrue a creator's commission on a user's payment. Runs on EVERY payment
 * (first + renewals) → recurring. Idempotent per paymentId. `grossAmount` is the
 * actual rupees the user paid (revenue), so commission is on real revenue.
 */
export async function accrueCreatorCommission(
  userId: string, paymentId: string, orderId: string, grossAmount: number,
): Promise<void> {
  if (!db || !paymentId || grossAmount <= 0) return;
  const attrib = await db.collection('creator_attributions').doc(userId).get();
  if (!attrib.exists) return;
  const creatorId = attrib.data()!.creatorId as string;
  if (creatorId === userId) return; // belt-and-suspenders self guard

  const creatorRef = db.collection('creators').doc(creatorId);
  const creatorSnap = await creatorRef.get();
  if (!creatorSnap.exists || (creatorSnap.data()!.status ?? 'active') !== 'active') return;
  const bps = creatorSnap.data()!.commissionBps ?? CREATOR_COMMISSION_BPS;
  const commission = Math.round((grossAmount * bps) / 10000);
  if (commission <= 0) return;

  const commRef = db.collection('creator_commissions').doc(paymentId);
  try {
    await db.runTransaction(async (tx) => {
      const c = await tx.get(commRef);
      if (c.exists) return; // idempotent — verify-payment + webhook both safe
      const cs = await tx.get(creatorRef);
      const total = cs.exists ? (cs.data()?.totalEarned ?? 0) : 0;
      tx.set(commRef, {
        creatorId, userId, paymentId, orderId,
        grossAmount, commissionAmount: commission, bps,
        status: 'accrued', createdAt: Date.now(), paidAt: null,
      });
      tx.set(creatorRef, { totalEarned: total + commission, updatedAt: Date.now() }, { merge: true });
    });
  } catch (e) {
    console.error('[creator] accrueCreatorCommission failed:', e);
  }
}

// ── Dynamic pricing & offers ──────────────────────────────────────────────────
// Plan prices + one active offer live in settings/pricing (Admin-only write,
// edited from the admin panel). The server reads this at order time, so prices
// stay tamper-proof. Falls back to the hardcoded PLANS if unset.

export interface Offer {
  active: boolean;
  label: string;          // e.g. "Launch offer — 20% off"
  percentOff: number;     // 0–90
  appliesTo: 'all' | PlanId;
  expiresAt: number | null;
}

export interface Pricing {
  plans: {
    free: { oneTime: number; displayOrder: number };
    quick_pass: { oneTime: number; displayOrder: number };
    pro: { oneTime: number; displayOrder: number };
    power: { monthly: number; yearly: number; displayOrder: number };
  };
  offer: Offer;
}

export const DEFAULT_OFFER: Offer = { active: false, label: '', percentOff: 0, appliesTo: 'all', expiresAt: null };

function pricingFallback(): Pricing {
  return {
    plans: {
      free: { oneTime: PLANS[0].price, displayOrder: PLANS[0].displayOrder },
      quick_pass: { oneTime: PLANS[1].price, displayOrder: PLANS[1].displayOrder },
      pro: { oneTime: PLANS[2].price, displayOrder: PLANS[2].displayOrder },
      power: { monthly: PLANS[3].price, yearly: PLANS[3].price * 10, displayOrder: PLANS[3].displayOrder },
    },
    offer: { ...DEFAULT_OFFER },
  };
}

/** Read current plan prices + active offer (settings/pricing), or sane defaults. */
export async function getDynamicPricing(): Promise<Pricing> {
  if (!db) return pricingFallback();
  const now = Date.now();
  const cached = pricingCache.get('pricing');
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  try {
    const snap = await db.collection('settings').doc('pricing').get();
    if (!snap.exists) {
      const fb = pricingFallback();
      pricingCache.set('pricing', { data: fb, expiresAt: now + PRICING_CACHE_TTL });
      return fb;
    }
    const d = snap.data() ?? {};
    const fb = pricingFallback();
    const appliesTo = ['all', 'free', 'quick_pass', 'pro', 'power'].includes(d.offer?.appliesTo) ? d.offer.appliesTo : 'all';
    const result: Pricing = {
      plans: {
        free: {
          oneTime: Number(d.plans?.free?.oneTime ?? fb.plans.free.oneTime),
          displayOrder: Number(d.plans?.free?.displayOrder ?? fb.plans.free.displayOrder),
        },
        quick_pass: {
          oneTime: Number(d.plans?.quick_pass?.oneTime ?? fb.plans.quick_pass.oneTime),
          displayOrder: Number(d.plans?.quick_pass?.displayOrder ?? fb.plans.quick_pass.displayOrder),
        },
        pro: {
          oneTime: Number(d.plans?.pro?.oneTime ?? fb.plans.pro.oneTime),
          displayOrder: Number(d.plans?.pro?.displayOrder ?? fb.plans.pro.displayOrder),
        },
        power: {
          monthly: Number(d.plans?.power?.monthly ?? fb.plans.power.monthly),
          yearly: Number(d.plans?.power?.yearly ?? fb.plans.power.yearly),
          displayOrder: Number(d.plans?.power?.displayOrder ?? fb.plans.power.displayOrder),
        },
      },
      offer: {
        active: !!d.offer?.active,
        label: String(d.offer?.label ?? ''),
        percentOff: Math.max(0, Math.min(90, Number(d.offer?.percentOff ?? 0))),
        appliesTo: appliesTo as Offer['appliesTo'],
        expiresAt: d.offer?.expiresAt ? Number(d.offer.expiresAt) : null,
      },
    };
    pricingCache.set('pricing', { data: result, expiresAt: now + PRICING_CACHE_TTL });
    return result;
  } catch (e) {
    console.error('[pricing] getDynamicPricing failed, using defaults:', e);
    return pricingFallback();
  }
}

export function invalidatePricingCache(): void {
  pricingCache.delete('pricing');
}

/** Is the offer currently valid for this plan? */
export function offerApplies(offer: Offer, plan: PlanId): boolean {
  if (!offer.active || offer.percentOff <= 0) return false;
  if (offer.expiresAt && Date.now() > offer.expiresAt) return false;
  return offer.appliesTo === 'all' || offer.appliesTo === plan;
}

/** Apply the offer (if valid) to a base amount; never drops below ₹1. */
export function effectiveAmount(base: number, offer: Offer, plan: PlanId): number {
  if (!offerApplies(offer, plan)) return base;
  return Math.max(1, Math.round(base * (1 - offer.percentOff / 100)));
}

// ── Coupons ────────────────────────────────────────────────────────────────
// settings/coupons: { coupons: Record<CODE, CouponRecord> } — single doc,
// same shape/cache pattern as settings/pricing. Admin-only write. A coupon
// REPLACES the site-wide offer for a transaction, it never stacks with it.

const couponsCache = new Map<string, { data: CouponsDoc; expiresAt: number }>();
const COUPONS_CACHE_TTL = 5 * 60 * 1000; // mirrors PRICING_CACHE_TTL

export type DiscountType = 'percent' | 'flat';

export interface CouponRecord {
  code: string;                  // stored uppercase; map key === code
  label: string;
  discountType: DiscountType;
  discountValue: number;         // percent: 1–90; flat: rupees, >=1
  appliesTo: 'all' | PlanId;
  active: boolean;
  featured: boolean;             // shown in the public /pricing banner
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface CouponsDoc {
  coupons: Record<string, CouponRecord>;
}

/** Read all coupons (5-min cached), or {} if unset/unreachable. */
export async function getCoupons(): Promise<CouponsDoc> {
  if (!db) return { coupons: {} };
  const now = Date.now();
  const cached = couponsCache.get('coupons');
  if (cached && cached.expiresAt > now) return cached.data;
  try {
    const snap = await db.collection('settings').doc('coupons').get();
    const raw = snap.exists ? (snap.data()?.coupons ?? {}) : {};
    const coupons: Record<string, CouponRecord> = {};
    for (const [rawCode, c] of Object.entries(raw as Record<string, Partial<CouponRecord>>)) {
      const code = rawCode.trim().toUpperCase();
      if (!code) continue;
      coupons[code] = {
        code,
        label: String(c.label ?? code),
        discountType: c.discountType === 'flat' ? 'flat' : 'percent',
        discountValue: Number(c.discountValue) || 0,
        appliesTo: (['all', 'free', 'quick_pass', 'pro', 'power'] as string[]).includes(c.appliesTo as string)
          ? (c.appliesTo as CouponRecord['appliesTo'])
          : 'all',
        active: !!c.active,
        featured: !!c.featured,
        expiresAt: c.expiresAt ? Number(c.expiresAt) : null,
        createdAt: Number(c.createdAt) || now,
        updatedAt: Number(c.updatedAt) || now,
      };
    }
    const result: CouponsDoc = { coupons };
    couponsCache.set('coupons', { data: result, expiresAt: now + COUPONS_CACHE_TTL });
    return result;
  } catch (e) {
    console.error('[coupons] getCoupons failed, treating as none:', e);
    return { coupons: {} };
  }
}

export function invalidateCouponsCache(): void {
  couponsCache.delete('coupons');
}

function couponIsValid(c: CouponRecord | undefined, plan: PlanId): c is CouponRecord {
  if (!c || !c.active) return false;
  if (c.expiresAt && Date.now() > c.expiresAt) return false;
  return c.appliesTo === 'all' || c.appliesTo === plan;
}

/** Look up + validate a coupon for a specific plan. The only function anything should trust for validity. */
export async function getCoupon(codeRaw: string, plan: PlanId): Promise<CouponRecord | null> {
  const code = (codeRaw || '').trim().toUpperCase();
  if (!code) return null;
  const { coupons } = await getCoupons();
  const c = coupons[code];
  return couponIsValid(c, plan) ? c : null;
}

/** The single coupon to advertise publicly on /pricing, if any. */
export async function getFeaturedCoupon(): Promise<CouponRecord | null> {
  const { coupons } = await getCoupons();
  const now = Date.now();
  const candidates = Object.values(coupons).filter(
    (c) => c.featured && c.active && (!c.expiresAt || c.expiresAt > now)
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.updatedAt - a.updatedAt);
  return candidates[0];
}

/** Apply a coupon's discount to a base amount; never drops below ₹1. */
export function applyCouponDiscount(base: number, coupon: CouponRecord): number {
  if (coupon.discountType === 'flat') {
    return Math.max(1, Math.round(base - coupon.discountValue));
  }
  return Math.max(1, Math.round(base * (1 - coupon.discountValue / 100)));
}

/**
 * Flag (or clear) cancel-at-period-end on a user's subscription. The plan stays
 * active until renewalDate; it simply won't renew and won't get reminder emails.
 * Server-side only (subscription docs are otherwise rule-locked).
 */
export async function setSubscriptionCancel(uid: string, cancel: boolean): Promise<boolean> {
  if (!db) return false;
  const ref = db.collection('subscriptions').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.set(
    { cancelAtPeriodEnd: cancel, canceledAt: cancel ? Date.now() : null, updatedAt: Date.now() },
    { merge: true }
  );
  return true;
}

/**
 * Migrate legacy plan IDs to new plan IDs.
 */
export function migrateUserPlan(oldPlan: string): PlanId {
  return migratePlanId(oldPlan as any);
}
