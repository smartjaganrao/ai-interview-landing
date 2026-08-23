import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getCreatorSummary, CREATOR_COMMISSION_BPS } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { idToken } → the caller's creator profile + earnings, or
 * { isCreator: false } if they haven't joined the program yet.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

    const user = await verifyIdToken(idToken);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const summary = await getCreatorSummary(user.uid);
    if (!summary) return NextResponse.json({ isCreator: false, commissionBps: CREATOR_COMMISSION_BPS });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.javihai.in';
    return NextResponse.json({
      isCreator: true,
      ...summary,
      link: `${appUrl}/?via=${summary.code}`,
    });
  } catch (e) {
    console.error('[creator/me]', e);
    return NextResponse.json({ error: 'Failed to load creator info' }, { status: 500 });
  }
}
