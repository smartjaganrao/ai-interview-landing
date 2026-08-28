import { NextResponse } from 'next/server';
import { getFeaturedCoupon, getPopupCoupon } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET — the coupon(s) to surface publicly, with only safe-to-display fields
 * (never the full coupons map, so this can't be used to enumerate codes):
 * - `coupon`: shown on the /pricing page banner.
 * - `popup`: shown as the new-customer welcome popup. Includes expiresAt
 *   (unlike `coupon`) since the popup needs it to render a live countdown.
 * These are independent flags — a coupon can be featured, popup, both, or
 * neither.
 */
export async function GET() {
  const [coupon, popup] = await Promise.all([getFeaturedCoupon(), getPopupCoupon()]);
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
      popup: popup
        ? {
            code: popup.code,
            label: popup.label,
            discountType: popup.discountType,
            discountValue: popup.discountValue,
            appliesTo: popup.appliesTo,
            expiresAt: popup.expiresAt,
          }
        : null,
    },
    { headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=30' } }
  );
}
