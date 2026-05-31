import crypto from 'crypto';
import Razorpay from 'razorpay';

/**
 * Returns a Razorpay client when both credentials are present.
 * If unset, callers should fall back to a clear "billing not configured"
 * error instead of crashing. Demo deployments without keys still work —
 * the /checkout page detects this and shows a "coming soon" notice.
 */
export function getRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Verifies the HMAC signature returned by Razorpay's Checkout after a
 * successful payment. The signature is `HMAC_SHA256(order_id|payment_id, key_secret)`.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) return false;
  const expected = crypto
    .createHmac('sha256', key_secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');
  // timingSafeEqual to avoid timing attacks
  if (expected.length !== params.signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature));
}

/**
 * Verifies webhook signature: HMAC_SHA256(raw_body, webhook_secret).
 * Razorpay sends this in the `X-Razorpay-Signature` header.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhook_secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhook_secret) return false;
  const expected = crypto
    .createHmac('sha256', webhook_secret)
    .update(rawBody)
    .digest('hex');
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Public plan catalog — pricing source of truth for server-side order creation. */
export const PLAN_CATALOG = {
  pro: { monthly: 499, yearly: 4990 },
  power: { monthly: 999, yearly: 9990 },
} as const;

export type PlanId = keyof typeof PLAN_CATALOG;
export type Billing = 'monthly' | 'yearly';

export function getPlanAmount(plan: PlanId, billing: Billing): number {
  return PLAN_CATALOG[plan][billing];
}
