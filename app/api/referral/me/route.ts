import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getReferralSummary, REFERRAL_REWARD } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { idToken } → the caller's referral code, share link, credit balance,
 * and number of successful (paid) referrals. Ensures a code exists on first call.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

    const user = await verifyIdToken(idToken);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { code, credits, count } = await getReferralSummary(user.uid);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.javihai.in';
    const link = code ? `${appUrl}/auth/signup?ref=${code}` : null;

    return NextResponse.json({ code, link, credits, count, reward: REFERRAL_REWARD });
  } catch (e) {
    console.error('[referral/me]', e);
    return NextResponse.json({ error: 'Failed to load referral info' }, { status: 500 });
  }
}
