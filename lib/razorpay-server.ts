import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '@/lib/firebase-admin';
import {
  PlanId,
  BillingType,
  PLANS,
  PLAN_RANK,
  getPlanById,
} from './pricing-config';

interface RazorpayKeys {
  key_id: string;
  key_secret: string;
}

// Simple in-process cache to avoid a Firestore read on every request.
// Cleared after 5 minutes so admin key updates propagate quickly.
let _cache: { keys: RazorpayKeys; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function getRazorpayKeys(): Promise<RazorpayKeys | null> {
  // Return cache if fresh
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.keys;

  // Try Firestore first (admin-managed keys)
  try {
    if (db) {
      const doc = await db.collection('settings').doc('api_keys').get();
      const data = doc.exists ? doc.data() : null;
      if (data?.razorpayKeyId && data?.razorpayKeySecret) {
        const keys = { key_id: data.razorpayKeyId, key_secret: data.razorpayKeySecret };
        _cache = { keys, ts: Date.now() };
        return keys;
      }
    }
  } catch { /* fall through to env */ }

  // Fallback to environment variables
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (key_id && key_secret) {
    const keys = { key_id, key_secret };
    _cache = { keys, ts: Date.now() };
    return keys;
  }

  return null;
}

export async function getRazorpayClient(): Promise<Razorpay | null> {
  const keys = await getRazorpayKeys();
  if (!keys) return null;
  return new Razorpay(keys);
}

export async function isRazorpayConfigured(): Promise<boolean> {
  const keys = await getRazorpayKeys();
  return !!keys;
}

/**
 * Returns the public Key ID for use in the frontend checkout.
 * Safe to return to the browser — it is never the secret.
 */
export async function getRazorpayKeyId(): Promise<string | null> {
  const keys = await getRazorpayKeys();
  return keys?.key_id ?? null;
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = crypto
    .createHmac('sha256', params.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');
  if (expected.length !== params.signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature));
}

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

export function getPlanAmount(plan: PlanId, _billing: BillingType): number {
  const config = getPlanById(plan);
  if (!config || plan === 'free') return 0;
  return config.price;
}

export function getPlanType(plan: PlanId): BillingType {
  const config = getPlanById(plan);
  return config ? config.billingType : 'one_time';
}

export { PLANS, PLAN_RANK, getPlanById };

