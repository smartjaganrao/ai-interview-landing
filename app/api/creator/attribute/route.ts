import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, attributeCreator } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { idToken, code } — attribute a freshly-signed-up user to a creator's
 * code (first-touch). Always 200 with { ok } — a bad/duplicate code during
 * signup is not a user-facing error.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, code } = await req.json();
    if (!idToken || !code) return NextResponse.json({ ok: false, reason: 'missing' });

    const user = await verifyIdToken(idToken);
    if (!user) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const result = await attributeCreator(user.uid, user.email ?? '', String(code));
    return NextResponse.json(result);
  } catch (e) {
    console.error('[creator/attribute]', e);
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
  }
}
