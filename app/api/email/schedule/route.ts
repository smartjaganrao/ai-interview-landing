import { NextRequest, NextResponse } from 'next/server';
// Vercel Cron calls this route (configured in vercel.json) to send Day 2 + Day 5 emails.
// The route reads pending emails from Firestore and fires them.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendRenewalReminder, sendCheckoutAbandonedReminder, sendPlanExpiredNotice, sendReengagementNudge } from '@/lib/email';
import { getReferralSummary, getUserInfo, invalidatePlanCache, invalidateQuotaCache, getPopupCoupon } from '@/lib/firebase-admin';
import { getRazorpayClient } from '@/lib/razorpay-server';
import type { PlanId } from '@/lib/pricing-config';

// How long after signup, with zero desktop-app activity, the re-engagement
// nudge fires — and the trailing edge of the sweep window so this doesn't
// rescan the entire all-time user base every day (idempotency via
// notifications.reengagementEmailSentAt would make that safe but wasteful).
const REENGAGEMENT_DELAY_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const REENGAGEMENT_WINDOW_MS = 5 * 24 * 60 * 60 * 1000; // sweep signups from the 5 days before that

// Anything already past its expiry at the moment this shipped is grandfathered —
// never auto-downgraded by the sweep below. Only subscriptions that were still
// within their paid period as of this timestamp become subject to enforcement
// once they naturally lapse (including ones that haven't lapsed yet today).
// 2026-08-31, the day this enforcement shipped.
const EXPIRY_ENFORCEMENT_SHIPPED_AT = 1788144285759;

function getAdmin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!raw) throw new Error('FIREBASE_ADMIN_SDK_JSON not set');
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return getFirestore();
}

export async function GET(req: NextRequest) {
  // Vercel Cron auth check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdmin();
  const now = Date.now();
  const sent: string[] = [];

  // Wrapped like every other block below — a failure here (e.g. a missing
  // Firestore index) must not take down renewal reminders, checkout-abandon
  // recovery, or expiry enforcement in the same run.
  try {
    const snap = await db
      .collection('email_queue')
      .where('sentAt', '==', null)
      .where('sendAfter', '<=', Timestamp.fromMillis(now))
      .limit(50)
      .get();

    for (const doc of snap.docs) {
      const { email, name, type, uid } = doc.data() as { email: string; name: string; type: string; uid?: string };
      try {
        let referralLink: string | undefined;
        if (type === 'referral' && uid) {
          const { code } = await getReferralSummary(uid);
          referralLink = code ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?ref=${code}` : undefined;
          if (!referralLink) continue; // no code yet — leave sentAt unset, retry next day
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, type, referralLink }),
        });
        if (res.ok) {
          await doc.ref.update({ sentAt: Timestamp.fromMillis(now) });
          sent.push(`${type}:${email}`);
        }
      } catch (err) {
        console.error('[email/schedule] failed for', email, err);
      }
    }
  } catch (err) {
    console.error('[email/schedule] email_queue sweep failed:', err);
  }

  // ── Renewal reminders ───────────────────────────────────────────────────────
  // Paid plans use one-time orders (manual renewal), so nudge users ~3 days before
  // their access lapses. Single-field range query (no composite index needed);
  // status / cancel / dedupe filtered in JS. Idempotent via renewalReminderSent.
  const reminders: string[] = [];
  try {
    const horizon = now + 3 * 24 * 60 * 60 * 1000;
    const subs = await db
      .collection('subscriptions')
      .where('renewalDate', '<=', horizon)
      .limit(200)
      .get();

    for (const subDoc of subs.docs) {
      const s = subDoc.data() as {
        plan?: string; status?: string; billing?: 'monthly' | 'yearly';
        amount?: number; renewalDate?: number; cancelAtPeriodEnd?: boolean;
        renewalReminderSent?: number;
      };
      const renewalDate = s.renewalDate ?? 0;
      if (
        renewalDate <= now ||                       // already lapsed
        s.status !== 'active' ||
        s.cancelAtPeriodEnd === true ||             // they chose not to renew
        (s.plan !== 'pro' && s.plan !== 'power') ||
        s.renewalReminderSent === renewalDate        // already reminded this cycle
      ) continue;

      const userSnap = await db.collection('users').doc(subDoc.id).get();
      const u = userSnap.exists ? userSnap.data() : null;
      if (!u?.email) continue;

      const res = await sendRenewalReminder({
        email: u.email, name: u.name || '',
        plan: s.plan as 'pro' | 'power',
        billing: s.billing || 'monthly',
        renewalDate,
        amount: s.amount ?? 0,
      });
      if (res.ok) {
        await subDoc.ref.update({ renewalReminderSent: renewalDate });
        reminders.push(`${s.plan}:${u.email}`);
      }
    }
  } catch (err) {
    console.error('[email/schedule] renewal reminders failed:', err);
  }

  // ── Checkout-abandon recovery ───────────────────────────────────────────────
  // Reads Razorpay's own order list (read-only, no writes to the checkout/
  // payment path) for orders created 1–24h ago that never reached 'paid'.
  // Dedup lives in a brand-new checkout_abandon_sent/{orderId} collection so
  // this can't collide with any existing collection or enforcement logic.
  const abandoned: string[] = [];
  try {
    const razorpay = await getRazorpayClient();
    if (razorpay) {
      const orders = await razorpay.orders.all({
        from: Math.floor((now - 24 * 60 * 60 * 1000) / 1000),
        to: Math.floor((now - 60 * 60 * 1000) / 1000),
        count: 100,
      });

      for (const order of orders.items) {
        if (order.status === 'paid') continue;
        const uid = order.notes?.userId as string | undefined;
        const plan = order.notes?.plan as PlanId | undefined;
        if (!uid || !plan) continue;

        const sentRef = db.collection('checkout_abandon_sent').doc(order.id);
        if ((await sentRef.get()).exists) continue;

        const userInfo = await getUserInfo(uid);
        if (!userInfo?.email) continue;

        const res = await sendCheckoutAbandonedReminder({
          email: userInfo.email, name: userInfo.name,
          plan, amount: Number(order.amount) / 100,
        });
        if (res.ok) {
          await sentRef.set({ sentAt: now, uid, plan });
          abandoned.push(`${plan}:${userInfo.email}`);
        }
      }
    }
  } catch (err) {
    console.error('[email/schedule] checkout-abandon recovery failed:', err);
  }

  // ── Enforce subscription expiry ─────────────────────────────────────────────
  // Nothing previously reverted users/{uid}.plan or subscriptions/{uid}.status
  // when a paid period ended — access never actually lapsed. Power (monthly)
  // expires via renewalDate; Quick Pass/Pro (one-time passes) expire via
  // expiresAt (renewalDate is explicitly null for those). Forward-only: see
  // EXPIRY_ENFORCEMENT_SHIPPED_AT above. Dedup is natural — once status flips
  // off 'active', these queries never see the doc again.
  const expired: string[] = [];
  try {
    const [byRenewal, byExpiresAt] = await Promise.all([
      db.collection('subscriptions').where('renewalDate', '<=', now).limit(200).get(),
      db.collection('subscriptions').where('expiresAt', '<=', now).limit(200).get(),
    ]);

    const candidates = new Map([...byRenewal.docs, ...byExpiresAt.docs].map((d) => [d.id, d]));
    for (const subDoc of candidates.values()) {
      const s = subDoc.data() as {
        plan?: PlanId; status?: string; renewalDate?: number | null; expiresAt?: number | null;
      };
      const expiry = s.renewalDate ?? s.expiresAt ?? null;
      if (
        s.status !== 'active' ||
        !s.plan || s.plan === 'free' ||
        expiry === null || expiry > now ||
        expiry <= EXPIRY_ENFORCEMENT_SHIPPED_AT // grandfathered — already lapsed before this shipped
      ) continue;

      const userRef = db.collection('users').doc(subDoc.id);
      const userSnap = await userRef.get();
      const u = userSnap.exists ? userSnap.data() : null;
      if (!u?.email) continue;

      const batch = db.batch();
      batch.update(userRef, { plan: 'free', updatedAt: now });
      batch.update(subDoc.ref, { status: 'expired', expiredAt: now, updatedAt: now });
      await batch.commit();

      invalidatePlanCache(subDoc.id);
      invalidateQuotaCache(subDoc.id);

      const res = await sendPlanExpiredNotice({ email: u.email, name: u.name || '', plan: s.plan });
      if (res.ok) expired.push(`${s.plan}:${u.email}`);
    }
  } catch (err) {
    console.error('[email/schedule] expiry enforcement failed:', err);
  }

  // ── Email re-engagement nudge ───────────────────────────────────────────────
  // Users who signed up but never opened the desktop app (no users/{uid}.lastSeen
  // heartbeat yet — see recordHeartbeat in ai-interview-helper) get one email
  // nudge, 2 days after signup, with whatever coupon is currently the popup
  // offer. Free (Resend), no external approval needed — unlike the WhatsApp
  // version of this (kept on branch feat/whatsapp-reengagement-nudge for later,
  // blocked on a Twilio trial-account upgrade + Meta template review). Idempotent
  // via notifications.reengagementEmailSentAt, so a user is only ever nudged once
  // regardless of how many days their signup stays inside the sweep window.
  const reengaged: string[] = [];
  try {
    const coupon = await getPopupCoupon();

    if (coupon) {
      const discountLabel =
        coupon.discountType === 'flat' ? `₹${coupon.discountValue} off` : `${coupon.discountValue}% off`;

      const windowEnd = now - REENGAGEMENT_DELAY_MS;
      const windowStart = windowEnd - REENGAGEMENT_WINDOW_MS;
      const candidates = await db
        .collection('users')
        .where('createdAt', '<=', windowEnd)
        .where('createdAt', '>=', windowStart)
        .limit(200)
        .get();

      for (const userDoc of candidates.docs) {
        try {
          const u = userDoc.data() as {
            lastSeen?: number;
            email?: string;
            profile?: { fullName?: string };
            fullName?: string; name?: string;
            notifications?: { reengagementEmailSentAt?: number };
          };
          if (u.lastSeen) continue; // opened the app since signing up — not inactive
          if (u.notifications?.reengagementEmailSentAt) continue; // already nudged once
          if (!u.email) continue;

          const name = (u.profile?.fullName || u.fullName || u.name || '') as string;
          const res = await sendReengagementNudge({
            email: u.email,
            name,
            couponCode: coupon.code,
            discountLabel,
          });
          if (res.ok) {
            await userDoc.ref.set({ notifications: { reengagementEmailSentAt: now } }, { merge: true });
            reengaged.push(u.email);
          }
        } catch (err) {
          console.error('[email/schedule] reengagement nudge failed for', userDoc.id, err);
        }
      }
    }
  } catch (err) {
    console.error('[email/schedule] reengagement sweep failed:', err);
  }

  return NextResponse.json({
    sent, count: sent.length,
    reminders, reminderCount: reminders.length,
    abandoned, abandonedCount: abandoned.length,
    expired, expiredCount: expired.length,
    reengaged, reengagedCount: reengaged.length,
  });
}
