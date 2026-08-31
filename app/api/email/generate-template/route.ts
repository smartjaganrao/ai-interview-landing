import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'groq-sdk/resources/chat/completions';

export const dynamic = 'force-dynamic';
// Matches /api/groq/stream (the one Groq-dependent route already confirmed
// working in production) — without this, GROQ_API_KEY was unavailable here.
export const runtime = 'nodejs';

const TEMPLATE_PROMPTS = {
  reengagement_inactive: 'Create a professional, friendly re-engagement email for users who havent used our AI interview preparation app in 30+ days. Include: warm greeting, highlight key features they missed, call-to-action to get back, offer to help. Make it around 200 words.',
  reengagement_never: 'Create a welcoming onboarding email for users who signed up but never activated the desktop app. Include: simple setup instructions, main features (real-time help, system audio capture, Indian language support), success stories, CTA to download and try. Around 200 words.',
  promotion_feature: 'Create a promotional email announcing a new feature for an AI interview prep app. Make it exciting, highlight benefits, include CTA. Around 180 words.',
  promotion_offer: 'Create a promotional email for a special offer/discount on subscription plans. Include: limited-time urgency, plan comparison if needed, testimonial or social proof, CTA to upgrade. Around 180 words.',
  usage_reminder: 'Create a helpful usage reminder email for Pro plan users showing their remaining quota. Include: encouragement, tips for maximizing usage, upgrade information. Around 150 words.',
};

interface GeneratedEmail {
  subject: string;
  html: string;
}

// Groq's response_format:'json_object' constrained decoding occasionally
// fails to produce valid JSON for long/complex output (confirmed in
// production — intermittent even on gpt-oss-120b) — this is a known
// probabilistic failure mode Groq itself recommends retrying on, not a
// deterministic bug in the prompt.
function isJsonGenerationError(err: unknown): boolean {
  const e = err as { status?: number; error?: { error?: { code?: string } } };
  return e?.status === 400 && (e?.error?.error?.code === 'json_validate_failed' || e?.error?.error?.code === 'json_generate_failed');
}

async function createJsonCompletionWithRetry(
  client: Groq,
  params: ChatCompletionCreateParamsNonStreaming,
  attempts = 5,
) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await client.chat.completions.create(params);
    } catch (err) {
      lastErr = err;
      if (!isJsonGenerationError(err)) throw err;
      console.warn(`[email-template] JSON generation failed, retry ${i + 1}/${attempts}...`);
    }
  }
  throw lastErr;
}

async function generateTemplate(
  type: keyof typeof TEMPLATE_PROMPTS,
  customPrompt?: string
): Promise<GeneratedEmail> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const client = new Groq({ apiKey });
  const systemPrompt = `You are an expert email template designer. Create professional, engaging marketing emails.

Respond with ONLY a JSON object of the form {"subject": "...", "html": "..."} — no markdown fences, no commentary.

Requirements for "subject":
- A short, compelling email subject line (under 60 characters)
- No quotes or emoji spam, at most one emoji if it fits naturally

Requirements for "html":
- Use inline styles (no external CSS)
- Mobile-responsive
- Proper spacing and typography
- Brand colors (#6366F1 for primary, dark backgrounds)
- Suitable for Resend email service
- Only the HTML body content, no DOCTYPE or html/body tags`;

  const userPrompt = customPrompt || TEMPLATE_PROMPTS[type];

  const response = await createJsonCompletionWithRetry(client, {
    // gpt-oss-20b measured unreliable at this JSON task in production
    // (repeated json_validate_failed) — 120b confirmed 5/5 clean JSON
    // completions in a direct side-by-side test against Groq.
    model: 'openai/gpt-oss-120b',
    max_tokens: 2200,
    response_format: { type: 'json_object' },
    // Reasoning model — without this, its hidden <think> trace can consume
    // the visible response and break JSON parsing (see groq/stream/route.ts
    // for the confirmed root cause).
    reasoning_format: 'hidden',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Create a subject line and email template for:\n${userPrompt}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Groq API');
  }

  let parsed: Partial<GeneratedEmail>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('AI returned malformed response — please try again');
  }

  if (!parsed.subject?.trim() || !parsed.html?.trim()) {
    throw new Error('AI response was missing a subject or body — please try again');
  }

  return { subject: parsed.subject.trim(), html: parsed.html.trim() };
}

export async function POST(request: NextRequest) {
  try {
    const { type, customPrompt } = await request.json();

    if (!type || !Object.keys(TEMPLATE_PROMPTS).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid template type', validTypes: Object.keys(TEMPLATE_PROMPTS) },
        { status: 400 }
      );
    }

    const { subject, html } = await generateTemplate(type as keyof typeof TEMPLATE_PROMPTS, customPrompt);

    return NextResponse.json({
      ok: true,
      subject,
      html,
      type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate template';
    console.error('[email-template]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
