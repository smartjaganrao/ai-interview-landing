import { NextRequest, NextResponse } from 'next/server';
// Vercel Cron calls this route (configured in vercel.json) to send Day 2 + Day 5 emails.
// The route reads pending emails from Firestore and fires them.

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

  return NextResponse.json({ sent, count: sent.length });
}
