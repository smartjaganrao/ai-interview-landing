import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay-server';
import { persistSubscription, getUserInfo, redeemCreditForOrder, rewardReferrerOnPayment, accrueCreatorCommission, db } from '@/lib/firebase-admin';
import { sendPaymentConfirmation, sendPaymentFailed } from '@/lib/email';

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
        const plan = notes.plan as 'pro' | 'power' | undefined;
        const billing = notes.billing as 'monthly' | 'yearly' | undefined;

        if (userId && plan && billing) {
          const amount = payment.amount ? Math.round(payment.amount / 100) : 0;
          const renewalDate = Date.now() + ((billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
          const saved = await persistSubscription({
            userId, plan, billing, amount,
            paymentId: payment.id,
            orderId: payment.order_id ?? '',
            source: 'webhook',
          });
          console.log('[razorpay/webhook] payment.captured → Firestore write:', saved ? 'ok' : 'skipped (no Admin SDK)');

          // Referral + creator reconciliation (awaited + idempotent —
          // verify-payment may have already done this; both paths are safe).
          try {
            const applied = Number(notes.appliedCredit ?? 0) || 0;
            if (applied > 0 && payment.order_id) {
              await redeemCreditForOrder(userId, payment.order_id, applied);
            }
            await rewardReferrerOnPayment(userId, payment.order_id ?? '', payment.id);
            // Creator commission on actual amount captured (paise → ₹)
            const grossPaid = payment.amount ? Math.round(payment.amount / 100) : amount;
            await accrueCreatorCommission(userId, payment.id, payment.order_id ?? '', grossPaid);
          } catch (e) {
            console.error('[razorpay/webhook] referral/creator reconciliation error:', e);
          }

          // Send confirmation email (awaited, best-effort)
          try {
            const info = await getUserInfo(userId);
            if (info?.email) {
              await sendPaymentConfirmation({
                email: info.email,
                name: info.name,
                plan: plan as 'pro' | 'power',
                billing: billing as 'monthly' | 'yearly',
                amount,
                paymentId: payment.id,
                renewalDate,
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
          await db.collection('subscriptions').doc(userId).set(
            { status: 'cancelled', updatedAt: Date.now() },
            { merge: true }
          );
          await db.collection('users').doc(userId).set(
            { plan: 'free', updatedAt: Date.now() },
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
