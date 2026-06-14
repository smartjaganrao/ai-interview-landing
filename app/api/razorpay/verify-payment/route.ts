import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature, isRazorpayConfigured, PLAN_CATALOG } from '@/lib/razorpay-server';
import { persistSubscription, getUserInfo } from '@/lib/firebase-admin';
import { sendPaymentConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * POST { orderId, paymentId, signature, userId, plan, billing }
 *
 * 1. Verifies the HMAC signature from Razorpay Checkout.
 * 2. Persists the subscription to Firestore server-side via Admin SDK so the
 *    plan is saved even if the client closes before completing its own write.
 *    The client still does a belt-and-suspenders setDoc, but this is authoritative.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: 'Billing is not configured on the server.' },
        { status: 503 }
      );
    }

    const { orderId, paymentId, signature, userId, plan, billing } = (await request.json()) as {
      orderId: string;
      paymentId: string;
      signature: string;
      userId?: string;
      plan?: 'pro' | 'power';
      billing?: 'monthly' | 'yearly';
    };

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    // 1) Verify Razorpay HMAC signature
    const ok = verifyPaymentSignature({ orderId, paymentId, signature });
    if (!ok) {
      return NextResponse.json({ verified: false, error: 'Signature mismatch' }, { status: 400 });
    }

    // 2) Server-side Firestore write — best-effort, client write is the fallback
    let savedToFirestore = false;
    const amount = (plan && billing) ? (PLAN_CATALOG[plan]?.[billing] ?? 0) : 0;
    const renewalDate = Date.now() + ((billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

    if (userId && plan && billing) {
      savedToFirestore = await persistSubscription({
        userId, plan, billing, amount, paymentId, orderId, source: 'checkout',
      });
    }

    // 3) Send payment confirmation email (best-effort — never block the response)
    if (userId && plan && billing) {
      getUserInfo(userId).then((info) => {
        if (!info?.email) return;
        sendPaymentConfirmation({
          email: info.email,
          name: info.name,
          plan,
          billing,
          amount,
          paymentId,
          renewalDate,
        }).catch((e) => console.error('[verify-payment] email send error:', e));
      }).catch((e) => console.error('[verify-payment] getUserInfo error:', e));
    }

    return NextResponse.json({ verified: true, orderId, paymentId, savedToFirestore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    console.error('[razorpay/verify-payment]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
