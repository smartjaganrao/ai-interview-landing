#!/usr/bin/env node
/**
 * backfill-email-queue.mjs — one-off backfill for existing users whose
 * day2/day5/referral emails were never queued, because email_queue had no
 * Firestore security rule (client writes silently rejected) until this was
 * fixed. Every existing user is affected — the collection had zero
 * documents before this ran.
 *
 * Anchors sendAfter to "now" (not the user's original signup date, which is
 * in the past for everyone), but preserves the original relative spacing so
 * nobody gets all three lifecycle emails in the same cron run: day2 is
 * immediately eligible, referral +1 day, day5 +3 days.
 *
 * Idempotent — skips any uid that already has a
 * notifications.emailQueueBackfilledAt marker, so a re-run (e.g. after a
 * partial failure) is safe. All 4 writes for one user (3 queue docs + the
 * marker) commit atomically via a batch, so a crash mid-run never leaves a
 * user half-backfilled.
 *
 * Dry run (default, no writes):
 *   node scripts/backfill-email-queue.mjs
 * Actually write:
 *   node scripts/backfill-email-queue.mjs --write
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const usersSnap = await db.collection('users').get();

let eligible = 0;
let skippedNoEmail = 0;
let skippedAlreadyDone = 0;
let failed = 0;

for (const userDoc of usersSnap.docs) {
  const u = userDoc.data();
  const uid = userDoc.id;

  if (!u.email) { skippedNoEmail++; continue; }
  if (u.notifications?.emailQueueBackfilledAt) { skippedAlreadyDone++; continue; }

  eligible++;
  if (!WRITE) continue;

  const name = u.profile?.fullName || u.fullName || u.name || '';
  const q = db.collection('email_queue');

  try {
    const batch = db.batch();
    batch.set(q.doc(), { email: u.email, name, type: 'day2', uid, sendAfter: Timestamp.fromMillis(now), sentAt: null });
    batch.set(q.doc(), { email: u.email, name, type: 'referral', uid, sendAfter: Timestamp.fromMillis(now + DAY), sentAt: null });
    batch.set(q.doc(), { email: u.email, name, type: 'day5', uid, sendAfter: Timestamp.fromMillis(now + 3 * DAY), sentAt: null });
    batch.set(userDoc.ref, { notifications: { emailQueueBackfilledAt: now } }, { merge: true });
    await batch.commit();
  } catch (err) {
    failed++;
    console.error(`[backfill] failed for ${uid} (${u.email}):`, err.message || err);
  }
}

console.log(
  WRITE
    ? `Backfilled ${eligible - failed}/${eligible} users (3 queue entries each). Failed: ${failed}. Skipped: ${skippedNoEmail} no-email, ${skippedAlreadyDone} already-backfilled.`
    : `DRY RUN — would backfill ${eligible} users. Skipped: ${skippedNoEmail} no-email, ${skippedAlreadyDone} already-backfilled. Re-run with --write to actually queue.`
);
