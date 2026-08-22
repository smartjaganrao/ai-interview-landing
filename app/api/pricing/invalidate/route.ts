import { NextRequest, NextResponse } from 'next/server';
import { invalidatePricingCache } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST — clears the server's in-memory pricing cache (getDynamicPricing()).
 * Called by the admin panel right after it writes settings/pricing, so a
 * price/offer change reaches the landing & checkout pages immediately
 * instead of waiting out PRICING_CACHE_TTL. Landing and admin are separate
 * deployments with independent in-memory caches — admin invalidating its
 * own cache does not reach this one, which is why this endpoint exists.
 * Gated on a shared secret since an open cache-clear endpoint is a cheap
 * cache-stampede vector (repeated hits force a Firestore read every time).
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.PRICING_INVALIDATE_SECRET || authHeader !== `Bearer ${process.env.PRICING_INVALIDATE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  invalidatePricingCache();
  return NextResponse.json({ success: true });
}
