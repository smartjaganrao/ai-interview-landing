import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient, getPlanAmount, type PlanId, type Billing } from '@/lib/razorpay-server';
import { verifyIdToken, getReferralCredits } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST { plan, billing, userId?, idToken? }
 * Returns { orderId, amount, currency, keyId, appliedCredit, originalAmount }.
 * Amount is calculated server-side from PLAN_CATALOG so it cannot be tampered
 * with. If a valid idToken is supplied, the user's referral credit balance is
 * applied as a discount (leaving at least ₹1 so Razorpay accepts the order).
 */
export async function POST(request: NextRequest) {
  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Billing is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.' },
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

    const amountInRupees = getPlanAmount(plan, billing);

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
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      appliedCredit,
      originalAmount: amountInRupees * 100,
    });
  } catch (error: unknown) {
    // Razorpay SDK throws plain objects like { statusCode, error: { description } }
    const rzpErr = error as { error?: { description?: string }; statusCode?: number };
    const message =
      rzpErr?.error?.description ||
      (error instanceof Error ? error.message : 'Failed to create order');
    console.error('[razorpay/create-order]', JSON.stringify(error));
    return NextResponse.json({ error: message }, { status: rzpErr?.statusCode ?? 500 });
  }
}
