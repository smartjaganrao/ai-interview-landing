import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay-server';

export const dynamic = 'force-dynamic';

/**
 * Razorpay → server webhook receiver.
 * Configure this URL in Razorpay Dashboard → Settings → Webhooks:
 *   https://<your-domain>/api/razorpay/webhook
 * With events: payment.captured, payment.failed, subscription.charged
 * And set RAZORPAY_WEBHOOK_SECRET in your environment.
 *
 * The client-side verify-payment endpoint already covers the happy path;
 * this webhook is the safety net for cases where the client closes their
 * browser mid-flow (e.g., reconciliation of "paid but no Firestore record").
 *
 * For full reliability, this should write to Firestore via Firebase Admin SDK
 * (not yet wired here to avoid bundling a service account key client-side).
 * Currently it logs + acknowledges; pair with Admin SDK in a future iteration.
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature') || '';
    const rawBody = await request.text();

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[razorpay/webhook] signature mismatch — ignoring');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as { event?: string; payload?: unknown };
    console.log('[razorpay/webhook] verified event:', event.event);

    // TODO: when Firebase Admin SDK is wired, write/update subscription doc here
    // for events: payment.captured, subscription.charged, subscription.cancelled.

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error('[razorpay/webhook]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
