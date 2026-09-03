#!/usr/bin/env node
/**
 * test-reengagement-email.mjs — manually verify the re-engagement email send
 * before relying on the daily cron (app/api/email/schedule's reengagement
 * block). Sends the real template via Resend — no secrets other than
 * RESEND_API_KEY needed, unlike the WhatsApp version of this nudge.
 *
 * Usage:
 *   node scripts/test-reengagement-email.mjs you@example.com
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

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

if (!process.env.RESEND_API_KEY) {
  console.log('❌ RESEND_API_KEY not set in .env.local');
  process.exit(1);
}

const to = process.argv[2];
if (!to) {
  console.log('Usage: node scripts/test-reengagement-email.mjs you@example.com');
  process.exit(0);
}

const { Resend } = await import('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'JavihAI <javihaiofficial@gmail.com>';

const firstName = 'there';
const couponCode = 'TESTCODE';
const discountLabel = '10% off';

const html = `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;margin:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:28px;">
    <img src="https://javihai.in/icon-192.png" width="40" height="40" alt="JavihAI" style="border-radius:10px;vertical-align:middle;" />
    <span style="vertical-align:middle;color:#fff;font-size:22px;font-weight:800;margin-left:10px;">JavihAI</span>
  </div>
  <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">Still there, ${firstName}? 👋</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">
    You signed up for JavihAI but haven't tried it yet. It takes a minute to install —
    live AI answers during your next interview, right on screen, invisible on Zoom,
    Google Meet or Microsoft Teams.
  </p>
  <div style="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
    <span style="color:#94a3b8;font-size:14px;">Use code</span><br/>
    <span style="color:#fff;font-weight:800;font-size:22px;font-family:monospace;letter-spacing:1px;">${couponCode}</span><br/>
    <span style="color:#4ade80;font-size:14px;font-weight:600;">${discountLabel}</span>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://javihai.in/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">Get started →</a>
  </div>
  <p style="color:#64748b;font-size:13px;">Need help installing? Reply to this email or contact <a href="mailto:support@javihai.in" style="color:#6366f1;">support@javihai.in</a>.</p>
  <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px;">
    JavihAI · <a href="https://javihai.in" style="color:#6366f1;">javihai.in</a> ·
    <a href="https://javihai.in/refund" style="color:#475569;">Refund policy</a>
  </p>
</div></body></html>`;

try {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${firstName}, your JavihAI ${discountLabel} offer is waiting [TEST]`,
    html,
  });
  if (error) {
    console.error('❌ Send failed:', error.message ?? JSON.stringify(error));
    process.exit(1);
  }
  console.log(`✅ Sent — id=${data?.id}`);
} catch (e) {
  console.error('❌ Send failed:', e.message);
  process.exit(1);
}
