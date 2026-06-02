import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature, isRazorpayConfigured, PLAN_CATALOG } from '@/lib/razorpay-server';
import { persistSubscription } from '@/lib/firebase-admin';

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
    if (userId && plan && billing) {
      const amount = PLAN_CATALOG[plan]?.[billing] ?? 0;
      savedToFirestore = await persistSubscription({
        userId, plan, billing, amount, paymentId, orderId, source: 'checkout',
      });
    }

    return NextResponse.json({ verified: true, orderId, paymentId, savedToFirestore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    console.error('[razorpay/verify-payment]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
