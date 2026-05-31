import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature, isRazorpayConfigured } from '@/lib/razorpay-server';

export const dynamic = 'force-dynamic';

/**
 * POST { orderId, paymentId, signature }
 * Verifies the HMAC signature returned by Razorpay Checkout.
 * Returns { verified: true } on success so the client can safely write the
 * subscription document to Firestore as the authenticated user.
 *
 * (Firestore rules ensure the user can only update their OWN subscription doc.)
 */
export async function POST(request: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: 'Billing is not configured on the server.' },
        { status: 503 }
      );
    }

    const { orderId, paymentId, signature } = (await request.json()) as {
      orderId: string;
      paymentId: string;
      signature: string;
    };

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    const ok = verifyPaymentSignature({ orderId, paymentId, signature });
    if (!ok) {
      return NextResponse.json({ verified: false, error: 'Signature mismatch' }, { status: 400 });
    }

    return NextResponse.json({ verified: true, orderId, paymentId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    console.error('[razorpay/verify-payment]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
