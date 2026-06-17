#!/usr/bin/env node
/**
 * creator-payouts.mjs — monthly creator commission payouts (manual UPI).
 *
 * Reads .env.local automatically (needs FIREBASE_ADMIN_SDK_JSON).
 *
 * List who's owed money + their UPI:
 *   node scripts/creator-payouts.mjs
 *
 * After you've sent the UPI transfer, record the payout (marks that creator's
 * accrued commissions as paid, bumps totalPaid, writes a creator_payouts doc):
 *   node scripts/creator-payouts.mjs pay <creatorId> <upiTxnRef>
 *
 * <creatorId> is the creator's Firebase uid (shown in the list output).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const SDK_JSON = process.env.FIREBASE_ADMIN_SDK_JSON;
if (!SDK_JSON) {
  console.error('❌ FIREBASE_ADMIN_SDK_JSON not set (add it to .env.local)');
  process.exit(1);
}

const { default: admin } = await import('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SDK_JSON)) });
}
const db = admin.firestore();

const [, , cmd, creatorId, ref] = process.argv;

if (cmd === 'pay') {
  if (!creatorId || !ref) {
    console.error('Usage: node scripts/creator-payouts.mjs pay <creatorId> <upiTxnRef>');
    process.exit(1);
  }
  await pay(creatorId, ref);
} else {
  await list();
}

// ── List creators with a pending balance ──────────────────────────────────────
async function list() {
  const snap = await db.collection('creators').get();
  const owed = [];
  snap.forEach((doc) => {
    const d = doc.data();
    const pending = (d.totalEarned ?? 0) - (d.totalPaid ?? 0);
    if (pending > 0) owed.push({ id: doc.id, code: d.code, name: d.name, upi: d.payoutUpi, pending, status: d.status });
  });
  owed.sort((a, b) => b.pending - a.pending);

  if (owed.length === 0) {
    console.log('\n✅ No creators have a pending balance.\n');
    return;
  }

  console.log(`\n💸 Creators owed payment (${owed.length}):\n`);
  let total = 0;
  for (const c of owed) {
    total += c.pending;
    const upi = c.upi || '⚠️  NO UPI SET';
    const warn = c.status !== 'active' ? `  [${c.status}]` : '';
    console.log(`  ₹${String(c.pending).padStart(6)}  ${c.code.padEnd(14)} ${upi.padEnd(28)} ${c.id}${warn}`);
    console.log(`           ${c.name || ''}`);
  }
  console.log(`\n  ──────────`);
  console.log(`  ₹${total} total owed\n`);
  console.log('To record a payout after sending the UPI transfer:');
  console.log('  node scripts/creator-payouts.mjs pay <creatorId> <upiTxnRef>\n');
}

// ── Record a payout: mark accrued commissions paid + bump totalPaid ───────────
async function pay(id, txnRef) {
  const creatorRef = db.collection('creators').doc(id);
  const creatorSnap = await creatorRef.get();
  if (!creatorSnap.exists) {
    console.error(`❌ No creator with id ${id}`);
    process.exit(1);
  }
  const creator = creatorSnap.data();

  // Sum unpaid (accrued) commissions for this creator.
  const accrued = await db.collection('creator_commissions')
    .where('creatorId', '==', id).where('status', '==', 'accrued').get();

  if (accrued.empty) {
    console.log(`\nℹ️  ${creator.code} has no accrued commissions to pay.\n`);
    return;
  }

  let amount = 0;
  const ids = [];
  accrued.forEach((d) => { amount += d.data().commissionAmount ?? 0; ids.push(d.id); });

  console.log(`\nPaying ${creator.code} (${creator.name || id}):`);
  console.log(`  Amount: ₹${amount}  →  UPI: ${creator.payoutUpi || '⚠️ none on file'}`);
  console.log(`  Commissions: ${ids.length}  |  Ref: ${txnRef}\n`);

  // Batch-mark commissions paid (chunked at 400 to stay under the 500 write limit).
  const now = Date.now();
  for (let i = 0; i < accrued.docs.length; i += 400) {
    const batch = db.batch();
    for (const d of accrued.docs.slice(i, i + 400)) {
      batch.update(d.ref, { status: 'paid', paidAt: now, payoutRef: txnRef });
    }
    await batch.commit();
  }

  // Record the payout + bump totalPaid.
  const payoutRef = await db.collection('creator_payouts').add({
    creatorId: id, code: creator.code, amount, upi: creator.payoutUpi ?? null,
    reference: txnRef, commissionCount: ids.length, paidAt: now,
  });
  await creatorRef.set({ totalPaid: (creator.totalPaid ?? 0) + amount, updatedAt: now }, { merge: true });

  console.log(`✅ Recorded payout ${payoutRef.id} — ₹${amount} marked paid for ${creator.code}.\n`);
}
