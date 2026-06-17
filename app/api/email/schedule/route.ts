import { NextRequest, NextResponse } from 'next/server';
// Vercel Cron calls this route (configured in vercel.json) to send Day 2 + Day 5 emails.
// The route reads pending emails from Firestore and fires them.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendRenewalReminder } from '@/lib/email';

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

  const snap = await db
    .collection('email_queue')
    .where('sentAt', '==', null)
    .where('sendAfter', '<=', Timestamp.fromMillis(now))
    .limit(50)
    .get();

  for (const doc of snap.docs) {
    const { email, name, type } = doc.data() as { email: string; name: string; type: string };
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, type }),
      });
      if (res.ok) {
        await doc.ref.update({ sentAt: Timestamp.fromMillis(now) });
        sent.push(`${type}:${email}`);
      }
    } catch (err) {
      console.error('[email/schedule] failed for', email, err);
    }
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

  return NextResponse.json({ sent, count: sent.length, reminders, reminderCount: reminders.length });
}
