import { NextRequest } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-side Groq proxy for the desktop app.
 *
 * The desktop app no longer ships the Groq API key. Instead it sends the
 * signed-in user's Firebase ID token in `X-Firebase-Token`; this route
 * verifies it, injects the server-held GROQ_API_KEY, and relays Groq's
 * streaming (SSE) response straight back to the desktop.
 *
 * Set GROQ_API_KEY in the Vercel project env (never exposed to clients).
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'AI is not configured on the server.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Require a valid Firebase ID token — prevents this public endpoint from
  // being used as an open Groq relay.
  const token = req.headers.get('x-firebase-token');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const decoded = await verifyIdToken(token);
  if (!decoded) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session. Please sign in again.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Forward to Groq with the server-side key. Force streaming + usage so the
  // desktop can render tokens incrementally and track quota.
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
    return new Response(JSON.stringify({ error: `Groq error ${upstream.status}`, detail: detail.slice(0, 500) }), {
      status: upstream.status || 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Relay the SSE stream verbatim — the desktop parses `data:` lines.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
