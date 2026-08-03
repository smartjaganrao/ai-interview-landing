import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay-server';
import { persistSubscription, getUserInfo, redeemCreditForOrder, rewardReferrerOnPayment, accrueCreatorCommission, db } from '@/lib/firebase-admin';
import { sendPaymentConfirmation, sendPaymentFailed } from '@/lib/email';
import { getPlanById } from '@/lib/pricing-config';

export const dynamic = 'force-dynamic';

/**
 * Razorpay → server webhook receiver (safety-net for the checkout happy path).
 *
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://<your-domain>/api/razorpay/webhook
 *   Events: payment.captured, payment.failed, subscription.charged, subscription.cancelled
 *   Secret: RAZORPAY_WEBHOOK_SECRET env var
 *
 * Flow:
 *  1. Verify HMAC signature (rejects anything not from Razorpay)
 *  2. On payment.captured → persist/update subscription in Firestore
 *  3. On payment.failed   → mark subscription as failed
 *  4. On subscription.cancelled → set status to cancelled
 *
 * The verify-payment client endpoint covers the normal flow; this webhook
 * handles reconciliation when the browser closes before the client write.
 */

interface RazorpayPaymentEntity {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  notes?: Record<string, string>;
}

interface RazorpaySubscriptionEntity {
  id: string;
  plan_id?: string;
  notes?: Record<string, string>;
}

interface RazorpayEvent {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    subscription?: { entity?: RazorpaySubscriptionEntity };
  };
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature') || '';
    const rawBody = await request.text();

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[razorpay/webhook] signature mismatch — rejecting');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as RazorpayEvent;
    const eventName = event.event ?? 'unknown';
    console.log('[razorpay/webhook] verified event:', eventName);

    switch (eventName) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const notes = payment.notes ?? {};
        const userId = notes.userId;
        const plan = notes.plan as string | undefined;
        const billing = notes.billing as 'monthly' | 'yearly' | 'one-time' | undefined;

        if (userId && plan && billing) {
          const amount = payment.amount ? Math.round(payment.amount / 100) : 0;
          const isOneTime = billing === 'one-time';
          const planConfig = getPlanById(plan as import('@/lib/pricing-config').AnyPlanId);
          const hoursPurchased = isOneTime ? (planConfig?.durationValue ?? Number(notes.hoursPurchased ?? 0)) : 0;
          const hoursRemaining = isOneTime ? hoursPurchased : 0;
          const expiresAt = isOneTime ? Date.now() + (planConfig?.durationValue ?? 1) * 24 * 60 * 60 * 1000 : null;
          const renewalDate = !isOneTime ? Date.now() + ((billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000) : null;

          const saved = await persistSubscription({
            userId, plan: plan as any, billing, amount,
            paymentId: payment.id,
            orderId: payment.order_id ?? '',
            source: 'webhook',
            hoursPurchased: isOneTime ? hoursPurchased : undefined,
            hoursRemaining: isOneTime ? hoursRemaining : undefined,
            expiresAt,
          });
          console.log('[razorpay/webhook] payment.captured → Firestore write:', saved ? 'ok' : 'skipped (no Admin SDK)');

          try {
            const applied = Math.min(Number(notes.appliedCredit ?? 0) || 0, amount);
            if (applied > 0 && payment.order_id) {
              await redeemCreditForOrder(userId, payment.order_id, applied);
            }
            await rewardReferrerOnPayment(userId, payment.order_id ?? '', payment.id);
            const grossPaid = payment.amount ? Math.round(payment.amount / 100) : amount;
            await accrueCreatorCommission(userId, payment.id, payment.order_id ?? '', grossPaid);
          } catch (e) {
            console.error('[razorpay/webhook] referral/creator reconciliation error:', e);
          }

          try {
            const info = await getUserInfo(userId);
            if (info?.email) {
              await sendPaymentConfirmation({
                email: info.email,
                name: info.name,
                plan: plan as any,
                billing: billing as 'monthly' | 'yearly' | 'one-time',
                amount,
                paymentId: payment.id,
                renewalDate: renewalDate ?? Date.now(),
              });
            }
          } catch (e) {
            console.error('[razorpay/webhook] email error:', e);
          }
        } else {
          console.warn('[razorpay/webhook] payment.captured missing userId/plan/billing in notes — cannot update Firestore');
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload?.payment?.entity;
        const userId = payment?.notes?.userId;
        if (userId && db) {
          await db.collection('subscriptions').doc(userId).set(
            { status: 'payment_failed', updatedAt: Date.now() },
            { merge: true }
          );
          try {
            const info = await getUserInfo(userId);
            if (info?.email) await sendPaymentFailed({ email: info.email, name: info.name, plan: payment?.notes?.plan });
          } catch (e) {
            console.error('[razorpay/webhook] payment-failed email error:', e);
          }
        }
        break;
      }

      case 'subscription.cancelled': {
        const sub = event.payload?.subscription?.entity;
        const userId = sub?.notes?.userId;
        if (userId && db) {
          const subRef = db.collection('subscriptions').doc(userId);
          const existing = await subRef.get();
          const existingData = existing.data() as { billing?: string; renewalDate?: number } | undefined;
          const billing = existingData?.billing === 'yearly' ? 'yearly' : 'monthly';
          const renewalDate = existingData?.renewalDate ?? Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000;
          await subRef.set(
            { status: 'cancelled', updatedAt: Date.now(), renewalDate },
            { merge: true }
          );
        }
        break;
      }

      default:
        console.log('[razorpay/webhook] unhandled event type:', eventName);
    }

    return NextResponse.json({ received: true, event: eventName });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error('[razorpay/webhook]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
