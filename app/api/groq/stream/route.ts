import { NextRequest } from 'next/server';
import { verifyIdToken, checkAiQuota } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-side Groq proxy for the desktop app.
 *
 * 1. Verifies the caller's Firebase ID token (X-Firebase-Token header)
 * 2. Checks per-user AI quota (free = 10 answers/month, pro/power = unlimited)
 * 3. Injects the server-held GROQ_API_KEY and relays Groq's SSE stream back
 *
 * The Groq key never ships in the public download — only the server holds it.
 * Set GROQ_API_KEY + FIREBASE_ADMIN_SDK_JSON in Vercel project env vars.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  // ── 1. Key check ─────────────────────────────────────────────────────────
  const key = process.env.GROQ_API_KEY;
  if (!key) return json({ error: 'AI is not configured on the server.' }, 503);

  // ── 2. Auth ───────────────────────────────────────────────────────────────
  const token = req.headers.get('x-firebase-token');
  if (!token) return json({ error: 'Authentication required. Please sign in.' }, 401);

  const decoded = await verifyIdToken(token);
  if (!decoded) return json({ error: 'Session expired. Please sign in again.' }, 401);

  // ── 3. Quota check ────────────────────────────────────────────────────────
  const quota = await checkAiQuota(decoded.uid);
  if (!quota.allowed) {
    return json({
      error: `Monthly AI quota reached (${quota.used}/${quota.limit} answers used). Upgrade to Pro for unlimited AI.`,
      quota: { used: quota.used, limit: quota.limit, plan: quota.plan },
    }, 429);
  }

  // ── 4. Parse body ─────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid request body.' }, 400); }

  // ── 5. Forward to Groq ────────────────────────────────────────────────────
  const upstream = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, stream: true, stream_options: { include_usage: true } }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return json({ error: `Groq error ${upstream.status}`, detail: detail.slice(0, 500) },
      upstream.status || 502);
  }

  // ── 6. Relay SSE stream verbatim ──────────────────────────────────────────
  // Include quota headers so the desktop can show a live counter without a
  // separate round-trip.
  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Quota-Plan': quota.plan,
    'X-Quota-Used': String(quota.used),
    'X-Quota-Limit': quota.limit === Infinity ? 'unlimited' : String(quota.limit),
  };
  return new Response(upstream.body, { status: 200, headers });
}
