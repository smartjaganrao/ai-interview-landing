import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, setSubscriptionCancel } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { idToken, cancel } — a user cancels (cancel: true) or resumes
 * (cancel: false) their own subscription. Cancel = won't renew; access stays
 * until the period ends. Server-side because subscription docs are rule-locked.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, cancel } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

    const user = await verifyIdToken(idToken);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const ok = await setSubscriptionCancel(user.uid, !!cancel);
    if (!ok) return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });

    return NextResponse.json({ ok: true, cancelAtPeriodEnd: !!cancel });
  } catch (e) {
    console.error('[subscription/cancel]', e);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
