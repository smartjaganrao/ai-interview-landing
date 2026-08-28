import { NextRequest, NextResponse } from 'next/server';
import { invalidateCouponsCache } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST — clears the server's in-memory coupons cache (getCoupons()). Called
 * by the admin panel right after it writes settings/coupons, same reason and
 * shared-secret gate as /api/pricing/invalidate: landing and admin are
 * separate deployments with independent in-memory caches, and a coupon
 * kill-switch (deactivating an abused code) needs to take effect immediately
 * rather than waiting out the 5-minute cache TTL.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.PRICING_INVALIDATE_SECRET || authHeader !== `Bearer ${process.env.PRICING_INVALIDATE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  invalidateCouponsCache();
  return NextResponse.json({ success: true });
}
