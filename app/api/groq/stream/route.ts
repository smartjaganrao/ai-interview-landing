import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, checkAiQuota, notifyQuotaExceededOnce } from '@/lib/firebase-admin';
import type { QuotaFeature } from '@/lib/firebase-admin';

const VALID_FEATURES: QuotaFeature[] = ['screenshot', 'system_audio', 'mic'];

export const runtime = 'nodejs';

// In-process rate limiter — keeps concurrent Groq requests under 25
// (Groq free tier allows 30 req/min; leave headroom for bursts)
let activeGroqRequests = 0;
const MAX_CONCURRENT = 25;

// Groq deprecates model IDs without warning (e.g. llama-3.1-8b-instant
// vanished 2026-08) — tried in order after the requested model 404s with
// "model_not_found" instead of failing the request outright.
const FALLBACK_MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'groq/compound-mini'];
// Only qwen3.8-27b accepts image_url content today. A screenshot (coding-
// question) request that 404s on it must not fall back to a text-only
// model — Groq rejects/garbles image content sent to those, which surfaced
// as "screenshot captured but no answer came back" with no clear error.
const VISION_MODELS = new Set(['qwen/qwen3.8-27b']);

function hasImageContent(messages: unknown[]): boolean {
  return messages.some(m =>
    Array.isArray((m as { content?: unknown })?.content) &&
    (m as { content: unknown[] }).content.some((part) => (part as { type?: string })?.type === 'image_url')
  );
}

type GroqAttemptResult =
  | { ok: true; res: Response & { body: ReadableStream<Uint8Array> } }
  | { ok: false; status: number; errBody: { error?: { message?: string; code?: string } } };

async function fetchGroqWithFallback(
  apiKey: string,
  messages: unknown,
  candidates: string[],
  temperature: number,
  max_tokens: number,
): Promise<GroqAttemptResult> {
  let last: { status: number; errBody: { error?: { message?: string; code?: string } } } = { status: 500, errBody: {} };
  for (const candidateModel of candidates) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: candidateModel,
        temperature: temperature ?? 0.5,
        max_tokens: max_tokens ?? 1024,
        stream: true,
        stream_options: { include_usage: true },
        // gpt-oss-*/qwen3.6 are reasoning models that emit a hidden <think>
        // block before the real answer, and that reasoning counts against
        // max_tokens — on a tight budget the whole response can go to
        // reasoning with empty visible content (confirmed directly against
        // the Groq API). `hidden` keeps it out of the visible content;
        // callers with reasoning-heavy prompts (e.g. desktop's screenshot
        // analysis) also raise max_tokens to compensate.
        reasoning_format: 'hidden',
      }),
    });
    if (res.ok && res.body) return { ok: true, res: res as Response & { body: ReadableStream<Uint8Array> } };
    const errBody = await res.json().catch(() => ({}));
    last = { status: res.status, errBody };
    if (!(res.status === 404 && errBody?.error?.code === 'model_not_found')) return { ok: false, ...last };
    console.warn(`[groq/stream] Model "${candidateModel}" no longer exists, trying next fallback...`);
  }
  return { ok: false, ...last };
}

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('X-Firebase-Token') || '';
    const body: { messages?: unknown[]; model?: string; temperature?: number; max_tokens?: number; feature?: unknown } = await req.json();
    const { messages, model, temperature, max_tokens, feature: rawFeature } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }
    // Desktop clients older than v1.18.0 never send `feature` — the 3-bucket
    // per-feature quota (screenshot/system_audio/mic) that needs it was
    // introduced in that same release. Default to `mic` instead of rejecting,
    // so already-installed pre-1.18.0 builds keep working until everyone has
    // upgraded (mic and system_audio share the same daily limit today, so
    // this default doesn't change what's allowed vs blocked for that traffic
    // — only which bucket's counter it lands in).
    const feature: QuotaFeature = VALID_FEATURES.includes(rawFeature as QuotaFeature) ? (rawFeature as QuotaFeature) : 'mic';

    // Require authentication — unauthenticated callers would bypass quota entirely
    if (!idToken) {
      return NextResponse.json({ error: 'Sign in to use AI features.' }, { status: 401 });
    }

    // Verify user + check quota (fail open if Firebase Admin not configured)
    let plan = 'free';
    let quotaUsed = 0;
    let quotaLimit: number = Infinity;
    const user = await verifyIdToken(idToken);
    if (user) {
      const quota = await checkAiQuota(user.uid, feature);
      plan = quota.plan;
      quotaUsed = quota.used;
      quotaLimit = quota.limit;
      if (!quota.allowed) {
        if (quota.banned) {
          return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
        }
        if (plan === 'free' && user.email) {
          // Fire-and-forget — never await on the response path, dedup'd to once/day internally.
          void notifyQuotaExceededOnce(user.uid, user.email, '');
        }
        return NextResponse.json(
          { error: plan === 'free' ? 'Daily AI quota reached. Upgrade to Pro for unlimited AI.' : 'Daily AI quota reached. Try again tomorrow, or contact support if this is unexpected.' },
          { status: 429 }
        );
      }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    // Concurrency gate — reject early if too many requests are in-flight
    if (activeGroqRequests >= MAX_CONCURRENT) {
      return NextResponse.json(
        { error: 'AI is busy right now. Please try again in a few seconds.' },
        { status: 503 }
      );
    }

    activeGroqRequests++;
    const requestedModel = model || 'openai/gpt-oss-20b';
    const fallbackPool = hasImageContent(messages)
      ? FALLBACK_MODELS.filter(m => VISION_MODELS.has(m))
      : FALLBACK_MODELS;
    const candidates = [requestedModel, ...fallbackPool.filter(m => m !== requestedModel)];

    let result: GroqAttemptResult;
    try {
      result = await fetchGroqWithFallback(apiKey, messages, candidates, temperature ?? 0.5, max_tokens ?? 1024);
    } catch (fetchErr) {
      // Network error before headers — decrement immediately
      activeGroqRequests--;
      throw fetchErr;
    }

    if (!result.ok) {
      activeGroqRequests--;
      // Groq rate limit — return a user-friendly message instead of raw API error
      if (result.status === 429) {
        return NextResponse.json(
          { error: 'AI is busy right now. Please wait a moment and try again.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: result.errBody.error?.message || `Groq error ${result.status}` },
        { status: result.status }
      );
    }
    const groqRes = result.res;

    // Pipe through a TransformStream so we can decrement activeGroqRequests when
    // the SSE body is fully consumed (or the client disconnects) — not just when
    // headers arrive. The previous try/finally fired on headers, making the gate
    // ineffective for concurrent SSE streams.
    const { readable, writable } = new TransformStream();
    groqRes.body.pipeTo(writable).finally(() => { activeGroqRequests--; });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Quota-Plan': plan,
        'X-Quota-Used': String(quotaUsed),
        'X-Quota-Limit': quotaLimit === Infinity ? 'unlimited' : String(quotaLimit),
        'X-Quota-Feature': feature,
      },
    });
  } catch (e) {
    console.error('[groq/stream]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
