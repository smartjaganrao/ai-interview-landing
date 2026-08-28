import { NextResponse } from 'next/server';
import { getFeaturedCoupon } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET — the single coupon (if any) to advertise on the public /pricing page.
 * Returns only safe-to-display fields, never the full coupons map, so this
 * endpoint can't be used to enumerate unpublicized codes.
 */
export async function GET() {
  const coupon = await getFeaturedCoupon();
  return NextResponse.json(
    {
      coupon: coupon
        ? {
            code: coupon.code,
            label: coupon.label,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            appliesTo: coupon.appliesTo,
          }
        : null,
    },
    { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } }
  );
}
