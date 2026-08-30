import { NextRequest, NextResponse } from 'next/server';
import type { PlanId } from '@/lib/pricing-config';
import { PLANS } from '@/lib/pricing-config';
import { getRazorpayClient, getRazorpayKeyId } from '@/lib/razorpay-server';
import { verifyIdToken, getReferralCredits, getDynamicPricing, effectiveAmount, offerApplies, getCoupon, applyCouponDiscount } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { plan, billing, userId?, idToken? }
 * Returns { orderId, amount, currency, keyId, appliedCredit, originalAmount }.
 * Amount is computed server-side from the admin-managed pricing (settings/pricing),
 * with any active offer applied, so it cannot be tampered with. If a valid idToken
 * is supplied, the user's referral credit is then applied (leaving at least ₹1).
 */
export async function POST(request: NextRequest) {
  try {
    const razorpay = await getRazorpayClient();
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Billing is not configured. Add Razorpay keys in the admin panel.' },
        { status: 503 }
      );
    }

    const { plan, billing, userId, idToken, couponCode } = (await request.json()) as {
      plan: PlanId;
      billing: 'one-time' | 'monthly' | 'yearly';
      userId?: string;
      idToken?: string;
      couponCode?: string;
    };

    const validPlans: PlanId[] = ['free', 'quick_pass', 'pro', 'power'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (billing !== 'one-time' && billing !== 'monthly' && billing !== 'yearly') {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    if (plan === 'free') {
      return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 });
    }

    const isOneTime = billing === 'one-time';

    const pricing = await getDynamicPricing();
    const planPricing = pricing.plans[plan];
    const baseAmount = isOneTime
      ? (planPricing as { oneTime: number }).oneTime
      : (planPricing as Record<'monthly' | 'yearly', number>)[billing] ?? 0;

    // Never charge against the static fallback — pricing-fallback-sync keeps
    // it looking realistic on purpose, so a plausible/non-zero amount here
    // does NOT mean it's safe; only pricing.degraded reliably tells us
    // getDynamicPricing() actually reached Firestore. Keep the <= 0 check
    // too as a second, independent line of defense.
    if (baseAmount <= 0 || pricing.degraded) {
      console.error(`[razorpay/create-order] refusing order: baseAmount=${baseAmount} degraded=${!!pricing.degraded} for plan=${plan} billing=${billing}`);
      return NextResponse.json(
        { error: 'Pricing is temporarily unavailable. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    // A coupon REPLACES the site-wide offer for this transaction — never both.
    let amountInRupees: number;
    let offerOn = false;
    let appliedCoupon: Awaited<ReturnType<typeof getCoupon>> = null;
    if (couponCode) {
      appliedCoupon = await getCoupon(couponCode, plan);
      if (!appliedCoupon) {
        // Coupon went invalid/expired between checkout-page validation and
        // now — fail loud rather than silently falling back to a different
        // price the user never agreed to.
        return NextResponse.json(
          { error: 'This coupon is no longer valid.', code: 'coupon_invalid' },
          { status: 400 }
        );
      }
      amountInRupees = applyCouponDiscount(baseAmount, appliedCoupon);
    } else {
      amountInRupees = effectiveAmount(baseAmount, pricing.offer, plan);
      offerOn = offerApplies(pricing.offer, plan);
    }

    let appliedCredit = 0;
    let payerUid = userId;
    if (idToken) {
      const u = await verifyIdToken(idToken);
      if (u) {
        payerUid = u.uid;
        const credit = await getReferralCredits(u.uid);
        appliedCredit = Math.max(0, Math.min(credit, amountInRupees - 1));
      }
    }

    const finalRupees = amountInRupees - appliedCredit;
    const amountInPaise = finalRupees * 100;

    const planConfig = PLANS.find(p => p.id === plan);
    const hoursPurchased = isOneTime ? (planConfig?.durationValue ?? 0) : 0;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${plan}_${Date.now()}`.slice(0, 40),
      notes: {
        plan,
        billing,
        planType: isOneTime ? 'one-time' : 'subscription',
        ...(isOneTime ? { hoursPurchased: String(hoursPurchased) } : {}),
        ...(payerUid ? { userId: payerUid } : {}),
        appliedCredit: String(appliedCredit),
        ...(appliedCoupon
          ? { coupon: appliedCoupon.code }
          : offerOn
          ? { offer: pricing.offer.label || `${pricing.offer.percentOff}% off` }
          : {}),
      },
    });

    const keyId = await getRazorpayKeyId();

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      appliedCredit,
      originalAmount: baseAmount * 100,
      offerApplied: offerOn,
      couponApplied: !!appliedCoupon,
    });
  } catch (error: unknown) {
    const rzpErr = error as { error?: { description?: string }; statusCode?: number };
    const message =
      rzpErr?.error?.description ||
      (error instanceof Error ? error.message : 'Failed to create order');
    console.error('[razorpay/create-order]', JSON.stringify(error));
    return NextResponse.json({ error: message }, { status: rzpErr?.statusCode ?? 500 });
  }
}
