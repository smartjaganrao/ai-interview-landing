import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, claimReferral, REFERRAL_REWARD } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { idToken, code } — a freshly-signed-up user claims a referral code.
 * Grants the referee REFERRAL_REWARD credit immediately and records a pending
 * referral (the referrer is paid only once this user actually pays).
 * Always returns 200 with { ok } — a bad/duplicate code is not an error the
 * UI should surface loudly during signup.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, code } = await req.json();
    if (!idToken || !code) return NextResponse.json({ ok: false, reason: 'missing' });

    const user = await verifyIdToken(idToken);
    if (!user) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const result = await claimReferral(user.uid, user.email ?? '', String(code));
    return NextResponse.json({ ...result, reward: REFERRAL_REWARD });
  } catch (e) {
    console.error('[referral/claim]', e);
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
  }
}
