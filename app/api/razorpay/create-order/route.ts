import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient, getPlanAmount, type PlanId, type Billing } from '@/lib/razorpay-server';

export const dynamic = 'force-dynamic';

/**
 * POST { plan: 'pro' | 'power', billing: 'monthly' | 'yearly', userId?: string }
 * Returns { orderId, amount, currency, keyId } so the client can open Razorpay Checkout.
 * Amount is calculated server-side from PLAN_CATALOG so it cannot be tampered with.
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

    const { plan, billing, userId } = (await request.json()) as {
      plan: PlanId;
      billing: Billing;
      userId?: string;
    };

    if (plan !== 'pro' && plan !== 'power') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (billing !== 'monthly' && billing !== 'yearly') {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    const amountInRupees = getPlanAmount(plan, billing);
    const amountInPaise = amountInRupees * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${plan}_${Date.now()}`.slice(0, 40),
      notes: {
        plan,
        billing,
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
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
