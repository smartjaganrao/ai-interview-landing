#!/usr/bin/env node
/**
 * test-whatsapp.mjs — manually verify the Twilio WhatsApp config before
 * relying on the app's real trigger (CompleteProfileModal →
 * /api/notifications/whatsapp-welcome).
 *
 * Reads .env.local automatically. Never prints secret values, only which
 * keys are present.
 *
 * Check config only (no send):
 *   node scripts/test-whatsapp.mjs
 *
 * Send a real message — free-form (needs the recipient to have joined your
 * Twilio Sandbox in the last 24hrs, or an approved template isn't ready yet):
 *   node scripts/test-whatsapp.mjs +91XXXXXXXXXX --freeform "Test message from JavihAI"
 *
 * Send using the approved welcome template (production path):
 *   node scripts/test-whatsapp.mjs +91XXXXXXXXXX --template
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

const REQUIRED_KEYS = ['TWILIO_ACCOUNT_SID', 'TWILIO_WHATSAPP_FROM'];
const AUTH_KEYS = ['TWILIO_AUTH_TOKEN', 'TWILIO_API_KEY_SID', 'TWILIO_API_KEY_SECRET'];
const OPTIONAL_KEYS = ['TWILIO_TEMPLATE_WELCOME_SID'];

console.log('Twilio WhatsApp config status:');
for (const k of [...REQUIRED_KEYS, ...AUTH_KEYS, ...OPTIONAL_KEYS]) {
  console.log(`  ${k}: ${process.env[k] ? 'set' : 'missing'}`);
}

const hasAccountSid = !!process.env.TWILIO_ACCOUNT_SID;
const hasAuthToken = !!process.env.TWILIO_AUTH_TOKEN;
const hasApiKey = !!process.env.TWILIO_API_KEY_SID && !!process.env.TWILIO_API_KEY_SECRET;
const hasFrom = !!process.env.TWILIO_WHATSAPP_FROM;

if (!hasAccountSid || !hasFrom || !(hasAuthToken || hasApiKey)) {
  console.log('\n❌ Not fully configured yet — add the missing keys above to .env.local, then re-run.');
  process.exit(hasAccountSid || hasFrom || hasAuthToken || hasApiKey ? 1 : 0);
}

const to = process.argv[2];
if (!to) {
  console.log('\n✅ Config looks complete. Pass a phone number to actually send a test message:');
  console.log('   node scripts/test-whatsapp.mjs +91XXXXXXXXXX --freeform "hello"');
  console.log('   node scripts/test-whatsapp.mjs +91XXXXXXXXXX --template');
  process.exit(0);
}

const { default: twilio } = await import('twilio');
const client = hasApiKey
  ? twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, { accountSid: process.env.TWILIO_ACCOUNT_SID })
  : twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
const toAddr = `whatsapp:${to}`;

const mode = process.argv[3];
try {
  let message;
  if (mode === '--template') {
    const contentSid = process.env.TWILIO_TEMPLATE_WELCOME_SID;
    if (!contentSid) {
      console.log('\n❌ TWILIO_TEMPLATE_WELCOME_SID not set — can\'t send --template. Use --freeform instead (needs the recipient to have joined your sandbox).');
      process.exit(1);
    }
    message = await client.messages.create({
      from, to: toAddr,
      contentSid,
      contentVariables: JSON.stringify({ '1': 'Test' }),
    });
  } else {
    const body = process.argv[4] || 'Test message from JavihAI (scripts/test-whatsapp.mjs)';
    message = await client.messages.create({ from, to: toAddr, body });
  }
  console.log(`\n✅ Sent — sid=${message.sid} status=${message.status}`);
} catch (error) {
  console.error(`\n❌ Send failed: ${error.message}`);
  process.exit(1);
}
