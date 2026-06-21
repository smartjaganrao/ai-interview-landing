import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, checkAiQuota } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

// In-process rate limiter — keeps concurrent Groq requests under 25
// (Groq free tier allows 30 req/min; leave headroom for bursts)
let activeGroqRequests = 0;
const MAX_CONCURRENT = 25;

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('X-Firebase-Token') || '';
    const { messages, model, temperature, max_tokens } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

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
      const quota = await checkAiQuota(user.uid);
      plan = quota.plan;
      quotaUsed = quota.used;
      quotaLimit = quota.limit;
      if (!quota.allowed) {
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
    let groqRes: Response;
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: model || 'llama-3.1-8b-instant',
          temperature: temperature ?? 0.5,
          max_tokens: max_tokens ?? 1024,
          stream: true,
          stream_options: { include_usage: true },
        }),
      });
    } catch (fetchErr) {
      // Network error before headers — decrement immediately
      activeGroqRequests--;
      throw fetchErr;
    }

    if (!groqRes.ok || !groqRes.body) {
      activeGroqRequests--;
      const err = await groqRes.json().catch(() => ({}));
      // Groq rate limit — return a user-friendly message instead of raw API error
      if (groqRes.status === 429) {
        return NextResponse.json(
          { error: 'AI is busy right now. Please wait a moment and try again.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: (err as { error?: { message?: string } }).error?.message || `Groq error ${groqRes.status}` },
        { status: groqRes.status }
      );
    }

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
      },
    });
  } catch (e) {
    console.error('[groq/stream]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
