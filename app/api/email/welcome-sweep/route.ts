import { NextRequest, NextResponse } from 'next/server';
// Vercel Cron calls this route (configured in vercel.json) every 15 minutes
// to send just the 'welcome' email quickly after signup. Split out from the
// once-daily /api/email/schedule sweep (which still owns day2/day5/referral,
// renewal reminders, checkout-abandon recovery, and expiry enforcement — all
// fine at daily granularity, unlike a first-touch welcome email) because that
// cron only runs at 06:00 UTC: a user signing up just after it fires could
// wait almost 24h for a welcome email, right when activation intent is
// highest. No double-send risk — this sets `sentAt` on success just like the
// daily sweep does, so by the time that sweep runs, already-sent entries are
// excluded by its own `sentAt == null` filter.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function getAdmin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!raw) throw new Error('FIREBASE_ADMIN_SDK_JSON not set');
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return getFirestore();
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdmin();
  const now = Date.now();
  const sent: string[] = [];

  try {
    const snap = await db
      .collection('email_queue')
      .where('type', '==', 'welcome')
      .where('sentAt', '==', null)
      .where('sendAfter', '<=', Timestamp.fromMillis(now))
      .limit(50)
      .get();

    for (const doc of snap.docs) {
      const { email, name } = doc.data() as { email: string; name: string };
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, type: 'welcome' }),
        });
        if (res.ok) {
          await doc.ref.update({ sentAt: Timestamp.fromMillis(now) });
          sent.push(email);
        }
      } catch (err) {
        console.error('[email/welcome-sweep] failed for', email, err);
      }
    }
  } catch (err) {
    console.error('[email/welcome-sweep] sweep failed:', err);
  }

  return NextResponse.json({ sent, count: sent.length });
}
