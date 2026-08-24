#!/usr/bin/env node
/**
 * post-release-announcement.mjs
 *
 * Posts a "What's New" announcement (read by the bell icon in Navbar.tsx via
 * GET /api/announcements) whenever a new ai-interview-helper desktop release
 * ships. Writes directly to the same `announcements` Firestore collection the
 * admin panel's POST /api/announcements uses — same document shape, same
 * admin_logs audit entry — so it's indistinguishable from an admin-created one
 * except for `createdBy`.
 *
 * Usage:
 *   node scripts/post-release-announcement.mjs --version=v1.14.4 \
 *     [--notes="Menu-bar stealth, pre-interview tips"] \
 *     [--link=https://www.javihai.in/dashboard]
 *
 * Requires FIREBASE_ADMIN_SDK_JSON (loaded from .env.local if present, same
 * as scripts/setup-firestore.mjs).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

// ── Load env from .env.local if present ─────────────────────────────────────
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Parse args ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, ...rest] = a.slice(2).split('=');
      return [k, rest.join('=')];
    }),
);

const version = args.version;
if (!version) {
  console.error('❌ --version=vX.Y.Z is required (e.g. --version=v1.14.4)');
  process.exit(1);
}
const notes = args.notes?.trim();
const link = args.link || 'https://www.javihai.in/dashboard';

// ── Validate required env ───────────────────────────────────────────────────
const SDK_JSON = process.env.FIREBASE_ADMIN_SDK_JSON;
if (!SDK_JSON) {
  console.error('❌ FIREBASE_ADMIN_SDK_JSON env var is required.');
  console.error('   Set it in .env.local or pass it inline:');
  console.error('   FIREBASE_ADMIN_SDK_JSON=\'{"type":"service_account",...}\' node scripts/post-release-announcement.mjs --version=v1.14.4');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(SDK_JSON);
} catch {
  console.error('❌ FIREBASE_ADMIN_SDK_JSON is not valid JSON');
  process.exit(1);
}

const { default: admin } = await import('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const title = `JavihAI ${version} is out 🚀`;
const body = notes
  ? `${notes} — update from the dashboard or download the latest build.`
  : `A new version of JavihAI (${version}) is now available. Update from the dashboard or download the latest build.`;

const now = Date.now();
const ref = await db.collection('announcements').add({
  title,
  body,
  link,
  active: true,
  createdAt: now,
  createdBy: 'release-automation',
});

await db.collection('admin_logs').add({
  adminUid: 'release-automation',
  adminEmail: 'release-automation',
  action: 'announcement_create',
  targetId: ref.id,
  details: { title, version },
  timestamp: now,
});

console.log(`✅ Posted announcement ${ref.id} for ${version}`);
console.log(`   Title: ${title}`);
console.log(`   Body:  ${body}`);
console.log(`   Link:  ${link}`);
console.log('   Note: the public bell caches for 5 minutes (announcements:public) — it will appear within that window.');
