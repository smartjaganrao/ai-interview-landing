import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { verifyIdToken, checkAiQuota } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, power: 2 };

// Per-plan monthly AI answer limits (mirrors useQuota.ts in desktop app)
const PLAN_LIMITS: Record<string, number> = { free: 10, pro: Infinity, power: Infinity };

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('X-Firebase-Token') || '';
    const { messages, model, temperature, max_tokens } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    // Verify the user and check quota
    let uid = '';
    let plan = 'free';
    if (idToken) {
      const user = await verifyIdToken(idToken);
      if (user) {
        uid = user.uid;
        const quota = await checkAiQuota(uid);
        plan = quota.plan;
        if (!quota.allowed) {
          return NextResponse.json(
            { error: 'Monthly AI quota reached. Upgrade to Pro for unlimited AI.' },
            { status: 429 }
          );
        }
      }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    const groq = new Groq({ apiKey });

    const stream = await groq.chat.completions.create({
      messages,
      model: model || 'llama-3.1-8b-instant',
      temperature: temperature ?? 0.5,
      max_tokens: max_tokens ?? 1024,
      stream: true,
      stream_options: { include_usage: true },
    });

    const encoder = new TextEncoder();
    const planLimit = PLAN_LIMITS[plan] ?? 10;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let totalTokens = 0;
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content ?? '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
            }
            if (chunk.usage?.total_tokens) totalTokens = chunk.usage.total_tokens;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage: { total_tokens: totalTokens } })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    const quotaUsed = plan === 'free' ? 1 : 0;

    return new Response(readable, {
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
