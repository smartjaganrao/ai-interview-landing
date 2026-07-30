import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature, isRazorpayConfigured, getRazorpayClient, getRazorpayKeys } from '@/lib/razorpay-server';
import { persistSubscription, getUserInfo, redeemCreditForOrder, rewardReferrerOnPayment, accrueCreatorCommission, getPlanById } from '@/lib/firebase-admin';
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
    if (!(await isRazorpayConfigured())) {
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
      plan?: string;
      billing?: 'monthly' | 'yearly' | 'one-time';
    };

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    // 1) Verify Razorpay HMAC signature using key from Firestore/env
    const keys = await getRazorpayKeys();
    const ok = keys ? verifyPaymentSignature({ orderId, paymentId, signature, keySecret: keys.key_secret }) : false;
    if (!ok) {
      return NextResponse.json({ verified: false, error: 'Signature mismatch' }, { status: 400 });
    }

    // 2) Fetch Razorpay order for the actual charged amount (avoids hardcoded plan prices)
    const razorpay = await getRazorpayClient();
    let amount = 0;
    let grossPaid = 0;
    let appliedCredit = 0;
    if (razorpay) {
      try {
        const ord = await razorpay.orders.fetch(orderId);
        if (typeof ord?.amount === 'number') {
          amount = Math.round(ord.amount / 100);
          grossPaid = amount;
        }
        appliedCredit = Number((ord?.notes as Record<string, string> | undefined)?.appliedCredit ?? 0) || 0;
        appliedCredit = Math.min(appliedCredit, amount);
      } catch { /* non-fatal */ }
    }

    // 3) Server-side Firestore write — best-effort, client write is the fallback
    let savedToFirestore = false;
    const isOneTime = billing === 'one-time';
    const renewalDate = isOneTime ? null : Date.now() + ((billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
    const planConfig = getPlanById(plan as import('@/lib/pricing-config').AnyPlanId);
    const hoursPurchased = isOneTime ? (planConfig?.durationValue ?? 0) : 0;
    const hoursRemaining = isOneTime ? hoursPurchased : 0;
    const expiresAt = isOneTime ? Date.now() + (planConfig?.durationValue ?? 1) * 24 * 60 * 60 * 1000 : null;

    if (userId && plan && billing) {
      savedToFirestore = await persistSubscription({
        userId, plan: plan as any, billing, amount, paymentId, orderId, source: 'checkout',
        hoursPurchased,
        hoursRemaining,
        expiresAt,
      });
    }

    // 4) Referral post-processing
    if (userId) {
      try {
        if (appliedCredit > 0 && orderId) await redeemCreditForOrder(userId, orderId, appliedCredit);
        await rewardReferrerOnPayment(userId, orderId, paymentId);
        await accrueCreatorCommission(userId, paymentId, orderId, grossPaid);
      } catch (e) {
        console.error('[verify-payment] referral/creator post-processing failed:', e);
      }
    }

    // 5) Send payment confirmation email
    if (userId && plan && billing) {
      try {
        const info = await getUserInfo(userId);
        if (info?.email) {
          await sendPaymentConfirmation({
            email: info.email, name: info.name, plan: plan as any,
            billing: billing as 'monthly' | 'yearly' | 'one-time',
            amount, paymentId,
            renewalDate: renewalDate ?? Date.now(),
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
