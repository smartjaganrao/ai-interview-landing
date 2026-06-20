import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient, getRazorpayKeyId, type PlanId, type Billing } from '@/lib/razorpay-server';
import { verifyIdToken, getReferralCredits, getDynamicPricing, effectiveAmount, offerApplies } from '@/lib/firebase-admin';

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

    const { plan, billing, userId, idToken } = (await request.json()) as {
      plan: PlanId;
      billing: Billing;
      userId?: string;
      idToken?: string;
    };

    if (plan !== 'pro' && plan !== 'power') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (billing !== 'monthly' && billing !== 'yearly') {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    // Base price from admin-managed pricing, then apply any active offer.
    const pricing = await getDynamicPricing();
    const baseAmount = pricing.plans[plan][billing];
    const amountInRupees = effectiveAmount(baseAmount, pricing.offer, plan);
    const offerOn = offerApplies(pricing.offer, plan);

    // Apply referral credit only for an authenticated user (verified uid).
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

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${plan}_${Date.now()}`.slice(0, 40),
      notes: {
        plan,
        billing,
        ...(payerUid ? { userId: payerUid } : {}),
        appliedCredit: String(appliedCredit),
        ...(offerOn ? { offer: pricing.offer.label || `${pricing.offer.percentOff}% off` } : {}),
      },
    });

    // Return the public key ID from Firestore/env (never the secret)
    const keyId = await getRazorpayKeyId();

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      appliedCredit,
      originalAmount: baseAmount * 100,
      offerApplied: offerOn,
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
