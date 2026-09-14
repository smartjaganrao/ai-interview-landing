#!/usr/bin/env node
/**
 * backfill-payments-ledger.mjs — one-off backfill for the payments/{paymentId}
 * ledger (see persistSubscription in lib/firebase-admin.ts) from every real
 * payment that happened BEFORE that ledger existed.
 *
 * Why this is needed: subscriptions/{uid} is a single doc per USER,
 * overwritten on every purchase — it only ever reflects the latest state, so
 * a repeat purchaser's earlier payments are invisible to anything reading
 * that collection alone. Confirmed live: a real customer's first ₹135 Quick
 * Pass payment became completely unrecoverable once their second ₹250
 * purchase overwrote the same subscriptions/{uid} doc. admin_logs still has
 * the full trail, though — persistSubscription has always written a
 * subscription_activate_{paymentId} log entry for every real payment,
 * independent of subscriptions/{uid} — so that's this script's source.
 *
 * Limitation: admin_logs.details never carried orderId or couponCode, only
 * plan/billing/amount/paymentId/source — those two fields can't be recovered
 * for backfilled entries and are written as null. This doesn't affect
 * revenue accuracy (ai-interview-admin's Purchases page only sums `amount`
 * and checks `refundedAt`, never orderId/couponCode) — only individual
 * historical-record detail, which isn't currently displayed per-transaction
 * anywhere. Every payment going forward (written directly by
 * persistSubscription) has both fields complete.
 *
 * Idempotent — payments/{paymentId} uses the real paymentId as its own doc
 * ID, and this script writes with {merge:true} and never touches
 * refundedAt, so re-running it is always safe: it can't clobber a refund
 * recorded by ai-interview-admin's refund route between runs, and re-backfilling
 * a payment persistSubscription has already written live just re-affirms the
 * same data.
 *
 * Dry run (default, no writes):
 *   node scripts/backfill-payments-ledger.mjs
 * Actually write:
 *   node scripts/backfill-payments-ledger.mjs --write
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

// ── Load .env.local ─────────────────────────────────────────────────────
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const raw = process.env.FIREBASE_ADMIN_SDK_JSON;
if (!raw) {
  console.error('FIREBASE_ADMIN_SDK_JSON not set (check .env.local)');
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(raw)) });
const db = getFirestore();

const WRITE = process.argv.includes('--write');

const logsSnap = await db.collection('admin_logs').where('action', '==', 'subscription_activate').get();

let eligible = 0;
let alreadyExists = 0;
let missingPaymentId = 0;
let written = 0;
let failed = 0;

// Cache user email lookups — some older log entries never denormalized
// targetUserEmail onto the log doc itself.
const emailCache = new Map();
async function resolveEmail(uid) {
  if (emailCache.has(uid)) return emailCache.get(uid);
  const snap = await db.collection('users').doc(uid).get();
  const email = snap.data()?.email || '';
  emailCache.set(uid, email);
  return email;
}

for (const doc of logsSnap.docs) {
  const log = doc.data();
  const details = log.details || {};
  const paymentId = details.paymentId;
  const uid = log.targetUserId;

  if (!paymentId || !uid) { missingPaymentId++; continue; }

  eligible++;
  if (!WRITE) continue;

  const paymentRef = db.collection('payments').doc(paymentId);
  const existing = await paymentRef.get();
  if (existing.exists) { alreadyExists++; continue; }

  try {
    const email = log.targetUserEmail || await resolveEmail(uid);
    await paymentRef.set({
      uid,
      email,
      plan: details.plan || null,
      billing: details.billing || null,
      amount: details.amount ?? 0,
      orderId: null,   // not recoverable — see header comment
      paymentId,
      couponCode: null, // not recoverable — see header comment
      source: details.source || 'backfill',
      createdAt: log.timestamp || Date.now(),
    }, { merge: true });
    written++;
  } catch (err) {
    failed++;
    console.error(`[backfill] failed for ${paymentId} (uid ${uid}):`, err.message || err);
  }
}

console.log(
  WRITE
    ? `Backfilled ${written} payment(s). Already present: ${alreadyExists}. Failed: ${failed}. Skipped (no paymentId/uid on the log entry): ${missingPaymentId}.`
    : `DRY RUN — would backfill up to ${eligible} payment(s) (some may already exist; re-run with --write to see the real count). Skipped (no paymentId/uid on the log entry): ${missingPaymentId}. Re-run with --write to actually write.`
);
