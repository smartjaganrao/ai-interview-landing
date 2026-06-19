import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, checkAiQuota } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const PLAN_LIMITS: Record<string, number> = { free: 3, pro: Infinity, power: Infinity };

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

    // Verify user + check quota (fail open if Firebase Admin not configured)
    let plan = 'free';
    if (idToken) {
      const user = await verifyIdToken(idToken);
      if (user) {
        const quota = await checkAiQuota(user.uid);
        plan = quota.plan;
        if (!quota.allowed) {
          return NextResponse.json(
            { error: 'Daily AI quota reached. Upgrade to Pro for unlimited AI.' },
            { status: 429 }
          );
        }
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
    } finally {
      activeGroqRequests--;
    }

    if (!groqRes.ok || !groqRes.body) {
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

    const planLimit = PLAN_LIMITS[plan] ?? 10;
    const quotaUsed = plan === 'free' ? 1 : 0;

    // Pipe the SSE stream straight through to the desktop app
    return new Response(groqRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Quota-Plan': plan,
        'X-Quota-Used': String(quotaUsed),
        'X-Quota-Limit': planLimit === Infinity ? 'unlimited' : String(planLimit),
      },
    });
  } catch (e) {
    console.error('[groq/stream]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
