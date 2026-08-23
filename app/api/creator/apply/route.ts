import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getOrCreateCreator, getUserInfo } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { idToken } — join the creator program. Instantly creates an active
 * creator profile with a unique vanity code (the founder can suspend later).
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

    const user = await verifyIdToken(idToken);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const info = await getUserInfo(user.uid);
    const created = await getOrCreateCreator(user.uid, info?.name ?? '', user.email ?? info?.email ?? '');
    if (!created) return NextResponse.json({ error: 'Could not create creator profile' }, { status: 503 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.javihai.in';
    return NextResponse.json({ isCreator: true, ...created, link: `${appUrl}/?via=${created.code}` });
  } catch (e) {
    console.error('[creator/apply]', e);
    return NextResponse.json({ error: 'Failed to join creator program' }, { status: 500 });
  }
}
