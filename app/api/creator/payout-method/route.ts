import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, setCreatorPayoutUpi } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/** POST { idToken, upi } — a creator sets the UPI ID we pay their commission to. */
export async function POST(req: NextRequest) {
  try {
    const { idToken, upi } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });
    if (!upi || typeof upi !== 'string' || !upi.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid UPI ID (e.g. name@bank)' }, { status: 400 });
    }

    const user = await verifyIdToken(idToken);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const ok = await setCreatorPayoutUpi(user.uid, upi);
    if (!ok) return NextResponse.json({ error: 'Not a creator yet' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[creator/payout-method]', e);
    return NextResponse.json({ error: 'Failed to save payout method' }, { status: 500 });
  }
}
