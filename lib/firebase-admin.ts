/**
 * Server-side Firebase Admin SDK initialisation for the landing/billing service.
 * Only runs in Node.js (Next.js API routes, never in the browser bundle).
 *
 * Requires FIREBASE_ADMIN_SDK_JSON env var (same service-account JSON used by
 * the admin panel). If absent, `db` is null and callers should degrade
 * gracefully rather than crash.
 */
import * as admin from 'firebase-admin';
import { PLAN_CATALOG } from './razorpay-server';

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
const FREE_AI_ANSWERS = 3;        // free plan: 3 AI answers / day (trial)
const TOKENS_PER_ANSWER = 500;    // 1 "answer" ≈ 500 tokens (matches useQuota.ts)

// Paid plans are marketed as "unlimited" and stay that way for the user —
// these are soft ceilings, not visible limits. Real usage sits nowhere near
// them; they only exist to cap worst-case Groq spend from abuse or a stuck
// client looping, not to throttle genuine interview prep.
const PAID_DAILY_LIMITS: Record<string, number> = { pro: 150, power: 300 };

export function dayKey(): string {
  return new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD, consistent across server timezones
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
export async function getCreatorSummary(uid: string): Promise<{
  code: string; status: string; commissionBps: number;
  totalEarned: number; totalPaid: number; pending: number;
  referredCount: number; payoutUpi: string | null;
} | null> {
  if (!db) return null;
  const snap = await db.collection('creators').doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  const totalEarned = d.totalEarned ?? 0;
  const totalPaid = d.totalPaid ?? 0;
  return {
    code: d.code, status: d.status ?? 'active', commissionBps: d.commissionBps ?? CREATOR_COMMISSION_BPS,
    totalEarned, totalPaid, pending: Math.max(0, totalEarned - totalPaid),
    referredCount: d.referredCount ?? 0, payoutUpi: d.payoutUpi ?? null,
  };
}

export async function setCreatorPayoutUpi(uid: string, upi: string): Promise<boolean> {
  if (!db) return false;
  const ref = db.collection('creators').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.set({ payoutUpi: upi.trim().slice(0, 120), updatedAt: Date.now() }, { merge: true });
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
  if ((creatorDoc.data().status ?? 'active') !== 'active') return { ok: false, reason: 'inactive' };

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
// stay tamper-proof. Falls back to the hardcoded PLAN_CATALOG if unset.

export interface Offer {
  active: boolean;
  label: string;          // e.g. "Launch offer — 20% off"
  percentOff: number;     // 0–90
  appliesTo: 'all' | 'pro' | 'power';
  expiresAt: number | null;
}

export interface Pricing {
  plans: {
    pro: { monthly: number; yearly: number };
    power: { monthly: number; yearly: number };
  };
  offer: Offer;
}

export const DEFAULT_OFFER: Offer = { active: false, label: '', percentOff: 0, appliesTo: 'all', expiresAt: null };

function pricingFallback(): Pricing {
  return {
    plans: {
      pro: { monthly: PLAN_CATALOG.pro.monthly, yearly: PLAN_CATALOG.pro.yearly },
      power: { monthly: PLAN_CATALOG.power.monthly, yearly: PLAN_CATALOG.power.yearly },
    },
    offer: { ...DEFAULT_OFFER },
  };
}

/** Read current plan prices + active offer (settings/pricing), or sane defaults. */
export async function getDynamicPricing(): Promise<Pricing> {
  if (!db) return pricingFallback();
  try {
    const snap = await db.collection('settings').doc('pricing').get();
    if (!snap.exists) return pricingFallback();
    const d = snap.data() ?? {};
    const fb = pricingFallback();
    const appliesTo = ['all', 'pro', 'power'].includes(d.offer?.appliesTo) ? d.offer.appliesTo : 'all';
    return {
      plans: {
        pro: {
          monthly: Number(d.plans?.pro?.monthly ?? fb.plans.pro.monthly),
          yearly: Number(d.plans?.pro?.yearly ?? fb.plans.pro.yearly),
        },
        power: {
          monthly: Number(d.plans?.power?.monthly ?? fb.plans.power.monthly),
          yearly: Number(d.plans?.power?.yearly ?? fb.plans.power.yearly),
        },
      },
      offer: {
        active: !!d.offer?.active,
        label: String(d.offer?.label ?? ''),
        percentOff: Math.max(0, Math.min(90, Number(d.offer?.percentOff ?? 0))),
        appliesTo,
        expiresAt: d.offer?.expiresAt ? Number(d.offer.expiresAt) : null,
      },
    };
  } catch (e) {
    console.error('[pricing] getDynamicPricing failed, using defaults:', e);
    return pricingFallback();
  }
}

/** Is the offer currently valid for this plan? */
export function offerApplies(offer: Offer, plan: 'pro' | 'power'): boolean {
  if (!offer.active || offer.percentOff <= 0) return false;
  if (offer.expiresAt && Date.now() > offer.expiresAt) return false;
  return offer.appliesTo === 'all' || offer.appliesTo === plan;
}

/** Apply the offer (if valid) to a base amount; never drops below ₹1. */
export function effectiveAmount(base: number, offer: Offer, plan: 'pro' | 'power'): number {
  if (!offerApplies(offer, plan)) return base;
  return Math.max(1, Math.round(base * (1 - offer.percentOff / 100)));
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
    { merge: true },
  );
  return true;
}
