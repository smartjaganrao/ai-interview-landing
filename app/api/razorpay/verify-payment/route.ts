import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature, isRazorpayConfigured, getRazorpayClient, PLAN_CATALOG } from '@/lib/razorpay-server';
import { persistSubscription, getUserInfo, redeemCreditForOrder, rewardReferrerOnPayment, accrueCreatorCommission } from '@/lib/firebase-admin';
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

    // 3) Referral post-processing: deduct any credit applied to this order
    //    (idempotent per orderId) and, if the payer was referred, reward their
    //    referrer now that a real payment has cleared. AWAITED — on serverless,
    //    work after the response isn't guaranteed to run, and this moves money.
    //    Wrapped so a failure here never fails an already-verified payment (the
    //    webhook reconciles as a backup).
    if (userId) {
      try {
        let grossPaid = amount; // fallback to plan price
        const razorpay = getRazorpayClient();
        if (razorpay) {
          const ord = await razorpay.orders.fetch(orderId);
          const applied = Number((ord?.notes as Record<string, string> | undefined)?.appliedCredit ?? 0) || 0;
          if (applied > 0) await redeemCreditForOrder(userId, orderId, applied);
          if (typeof ord?.amount === 'number') grossPaid = Math.round(ord.amount / 100); // actual revenue (paise → ₹)
        }
        await rewardReferrerOnPayment(userId, orderId, paymentId);
        // Creator commission on the actual amount paid (recurring — every payment)
        await accrueCreatorCommission(userId, paymentId, orderId, grossPaid);
      } catch (e) {
        console.error('[verify-payment] referral/creator post-processing failed:', e);
      }
    }

    // 4) Send payment confirmation email. Awaited (best-effort) so it actually
    //    sends before the serverless function freezes.
    if (userId && plan && billing) {
      try {
        const info = await getUserInfo(userId);
        if (info?.email) {
          await sendPaymentConfirmation({
            email: info.email, name: info.name, plan, billing, amount, paymentId, renewalDate,
          });
        }
      } catch (e) {
        console.error('[verify-payment] email send error:', e);
      }
    }

    return NextResponse.json({ verified: true, orderId, paymentId, savedToFirestore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    console.error('[razorpay/verify-payment]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
