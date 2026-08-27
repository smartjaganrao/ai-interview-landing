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

async function sendReleaseEmail(email, name) {
  const { Resend } = await import('resend');
  const resend = new Resend(RESEND_KEY);
  const firstName = (name || '').split(' ')[0] || 'there';

  const html = shell(`
    <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">🚀 JavihAI ${version} is out</h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">
      Hi ${firstName}, we shipped a new stable release focused on audio quality and cross-platform reliability.
    </p>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="font-size:16px;color:#fff;margin:0 0 12px;">What's new in ${version}</h2>
      <ul style="padding-left:0;list-style:none;margin:0;">
        <li style="padding:8px 0;color:#cbd5e1;font-size:14px;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-weight:700;">✓</span> System audio capture fixed — clearer interviewer audio, no more choppiness</li>
        <li style="padding:8px 0;color:#cbd5e1;font-size:14px;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-weight:700;">✓</span> Windows support — microphone permission now works correctly on Windows 10/11</li>
        <li style="padding:8px 0;color:#cbd5e1;font-size:14px;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-weight:700;">✓</span> Smarter transcription — fewer hallucinations and more reliable question detection</li>
        <li style="padding:8px 0;color:#cbd5e1;font-size:14px;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-weight:700;">✓</span> Silent audio detection — warns you if system audio capture isn't picking up sound</li>
      </ul>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.javihai.in/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">Open Dashboard →</a>
    </div>
    <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
      Questions? Reply to this email or contact <a href="mailto:javihaiofficial@gmail.com" style="color:#6366f1;">javihaiofficial@gmail.com</a>
    </p>
  `);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `JavihAI ${version} is out — better audio, Windows support, smarter transcription`,
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
