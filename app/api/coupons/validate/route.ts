import { NextRequest, NextResponse } from 'next/server';
import type { PlanId } from '@/lib/pricing-config';
import { getCoupon } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { code, plan } — validity + discount preview for the checkout page's
 * coupon input. Deliberately returns one collapsed "invalid_or_expired"
 * reason rather than distinguishing wrong-plan/expired/not-found, so a
 * failed guess doesn't reveal *why* it failed. This endpoint is still a
 * valid/invalid boolean per guess with no rate limiting, though, so it
 * remains usable to brute-force unpublicized codes given enough attempts —
 * an accepted gap for now given the small scale of this product, not a
 * solved one. The actual charge is always re-validated server-side again in
 * create-order — this endpoint is a preview only, never trusted for amount.
 */
export async function POST(request: NextRequest) {
  const { code, plan } = (await request.json().catch(() => ({}))) as { code?: string; plan?: PlanId };
  const validPlans: PlanId[] = ['free', 'quick_pass', 'pro', 'power'];
  if (!code || !plan || !validPlans.includes(plan)) {
    return NextResponse.json({ valid: false, reason: 'bad_request' }, { status: 400 });
  }

  const coupon = await getCoupon(code, plan);
  if (!coupon) {
    return NextResponse.json({ valid: false, reason: 'invalid_or_expired' });
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      code: coupon.code,
      label: coupon.label,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      appliesTo: coupon.appliesTo,
    },
  });
}
