#!/usr/bin/env node
/**
 * post-release-email-blast.mjs
 *
 * Sends a release announcement email to all users in the `users` collection
 * who have a populated `email` field. Uses Resend directly.
 *
 * Usage:
 *   RELEASE_EMAIL_BLAST=1 node scripts/post-release-email-blast.mjs \
 *     --version=v1.15.0 \
 *     [--notes="Better system audio, Windows mic support, improved transcription"]
 *
 * Requires:
 *   - FIREBASE_ADMIN_SDK_JSON env var or .env.local
 *   - RESEND_API_KEY env var or .env.local
 *   - RELEASE_EMAIL_BLAST=1 env var (safety guard)
 *
 * Opt-out:
 *   Respects `users/{uid}.marketingEmails === false` if present.
 *   No opt-out field? All users with a valid email receive the email.
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
    if ((val.startsWith('"') && val.endsWith('"')) || ((val.startsWith("'") && val.endsWith("'")))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Safety guard ─────────────────────────────────────────────────────────────
if (process.env.RELEASE_EMAIL_BLAST !== '1') {
  console.error('❌ Refusing to run without RELEASE_EMAIL_BLAST=1 in the environment.');
  console.error('   This prevents accidental bulk email sends.');
  process.exit(1);
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
  console.error('❌ --version=vX.Y.Z is required (e.g. --version=v1.15.0)');
  process.exit(1);
}
const notes = args.notes?.trim() || 'JavihAI ' + version + ' is now available';

// ── Validate required env ───────────────────────────────────────────────────
const SDK_JSON = process.env.FIREBASE_ADMIN_SDK_JSON;
if (!SDK_JSON) {
  console.error('❌ FIREBASE_ADMIN_SDK_JSON env var is required.');
  console.error('   Set it in .env.local or pass it inline.');
  process.exit(1);
}

const RESEND_KEY = process.env.RESEND_API_KEY;
if (!RESEND_KEY) {
  console.error('❌ RESEND_API_KEY env var is required.');
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

// ── Email helpers ────────────────────────────────────────────────────────────
const FROM = process.env.RESEND_FROM_EMAIL ?? 'JavihAI <javihaiofficial@gmail.com>';

function shell(bodyHtml) {
  return `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;margin:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:14px 22px;">
      <span style="color:white;font-size:22px;font-weight:800;">JavihAI</span>
    </div>
  </div>
  ${bodyHtml}
  <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px;">
    JavihAI · <a href="https://www.javihai.in" style="color:#6366f1;">javihai.in</a> ·
    <a href="https://www.javihai.in/privacy" style="color:#475569;">Privacy</a>
  </p>
</div></body></html>`;
}

// Bullet list is intentionally static per run, not derived from freeform
// --notes (HTML-unsafe to interpolate directly without escaping) — pass
// --notes for the subject-line summary, edit WHATS_NEW below to match
// what actually shipped before running.
const WHATS_NEW = [
  'Free plan now gives you up to 25 AI answers a day — 5 screenshot solves, 10 system-audio answers, and 10 mic answers (previously 10 total, combined)',
  'Fixed several toolbar buttons that could drag the whole window instead of registering your click',
  'Screenshot now tells you exactly what to fix if Screen Recording permission isn\'t granted, instead of a generic error',
  'Added a persistent shortcuts reminder in the toolbar so Show/Hide, Restore, and Compact Mode are always visible',
];

async function sendReleaseEmail(email, name) {
  const { Resend } = await import('resend');
  const resend = new Resend(RESEND_KEY);
  const firstName = (name || '').split(' ')[0] || 'there';

  const html = shell(`
    <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">🚀 JavihAI ${version} is out</h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">
      Hi ${firstName}, ${notes}
    </p>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="font-size:16px;color:#fff;margin:0 0 12px;">What's new in ${version}</h2>
      <ul style="padding-left:0;list-style:none;margin:0;">
        ${WHATS_NEW.map(item => `<li style="padding:8px 0;color:#cbd5e1;font-size:14px;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-weight:700;">✓</span> ${item}</li>`).join('\n        ')}
      </ul>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.javihai.in/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">Open Dashboard →</a>
    </div>
    <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
      Questions? Reply to this email or contact <a href="mailto:javihaiofficial@gmail.com" style="color:#6366f1;">javihaiofficial@gmail.com</a>
    </p>
    <p style="color:#475569;font-size:11px;text-align:center;margin-top:16px;">
      Don't want release emails? Reply and let us know — we'll turn them off for your account.
    </p>
  `);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `JavihAI ${version} is out — ${notes}`,
    html,
  });

  if (error) {
    console.error(`[email-blast] failed for ${email}:`, error.message ?? JSON.stringify(error));
    return { ok: false, error: error.message };
  }
  console.log(`[email-blast] sent to ${email}`);
  return { ok: true, id: data?.id };
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log(`Starting release email blast for ${version}...`);

const usersSnap = await db.collection('users').get();
const results = { sent: 0, skipped: 0, failed: 0 };

for (const doc of usersSnap.docs) {
  const data = doc.data();
  const email = (data.email || '').trim();
  if (!email) {
    results.skipped++;
    continue;
  }

  if (data.marketingEmails === false) {
    console.log(`[email-blast] skipped ${email} (marketingEmails=false)`);
    results.skipped++;
    continue;
  }

  const result = await sendReleaseEmail(email, data.name);
  if (result.ok) {
    results.sent++;
  } else {
    results.failed++;
  }
}

console.log('\n✅ Email blast complete');
console.log(`   Sent: ${results.sent}`);
console.log(`   Skipped: ${results.skipped}`);
console.log(`   Failed: ${results.failed}`);
console.log(`   Total users scanned: ${usersSnap.size}`);
