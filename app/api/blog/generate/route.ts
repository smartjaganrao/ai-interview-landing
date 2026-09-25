import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'groq-sdk/resources/chat/completions';

export const dynamic = 'force-dynamic';
// Matches /api/groq/stream (the one Groq-dependent route already confirmed
// working in production) — without this, GROQ_API_KEY was unavailable here.
export const runtime = 'nodejs';

interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const FALLBACK_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'groq/compound-mini',
];

function isModelNotFoundError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const e = err as { status?: number; statusCode?: number; code?: string; error?: { status?: number; code?: string; error?: { code?: string; message?: string } } };
  const status = e?.status || e?.statusCode || e?.error?.status;
  const code = e?.error?.error?.code || e?.error?.code || e?.code || '';

  return (
    status === 404 ||
    (status === 400 && code !== 'json_validate_failed' && code !== 'json_generate_failed') ||
    status === 422 ||
    code === 'model_not_found' ||
    code === 'model_decommissioned' ||
    code === 'invalid_model' ||
    msg.includes('model_not_found') ||
    msg.includes('model_decommissioned') ||
    msg.includes('decommissioned') ||
    msg.includes('deprecated') ||
    msg.includes('invalid_model') ||
    msg.includes('does not exist') ||
    msg.includes('no longer supported') ||
    msg.includes('unknown model')
  );
}

function isJsonGenerationError(err: unknown): boolean {
  const e = err as { status?: number; error?: { error?: { code?: string } } };
  return e?.status === 400 && (e?.error?.error?.code === 'json_validate_failed' || e?.error?.error?.code === 'json_generate_failed');
}

async function createJsonCompletionWithRetry(
  client: Groq,
  params: ChatCompletionCreateParamsNonStreaming,
  attempts = 5,
) {
  const preferredModel = params.model || 'openai/gpt-oss-120b';
  const candidates = Array.from(new Set([preferredModel, ...FALLBACK_MODELS]));
  let lastErr: unknown;

  for (const modelCandidate of candidates) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await client.chat.completions.create({ ...params, model: modelCandidate });
      } catch (err) {
        lastErr = err;
        if (isModelNotFoundError(err)) {
          console.warn(`[blog-generate] Model "${modelCandidate}" deprecation/not found error, falling back...`);
          break; // move to next model candidate
        }
        if (!isJsonGenerationError(err)) throw err;
        console.warn(`[blog-generate] JSON generation failed on model "${modelCandidate}", retry ${i + 1}/${attempts}...`);
      }
    }
  }
  throw lastErr;
}

const LENGTH_GUIDE = {
  short: '~600-800 words',
  medium: '~1000-1400 words',
  long: '~1800-2400 words',
};

async function generatePost(idea: string, tone: string, length: keyof typeof LENGTH_GUIDE): Promise<GeneratedPost> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const client = new Groq({ apiKey });

  const systemPrompt = `You are a senior content writer for JavihAI, an AI interview-copilot app built for Indian job seekers (freshers, working professionals, coders — companies like Flipkart, Google, Amazon, TCS, Infosys). You write blog posts that read like a knowledgeable human wrote them, not an AI — varied sentence length, concrete examples, an opinion here and there, no generic filler, no "in conclusion" wrap-ups, no listicle-of-obvious-tips fluff.

Respond with ONLY a JSON object — no markdown fences, no commentary — of the form:
{"title": "...", "excerpt": "...", "contentHtml": "...", "seoTitle": "...", "seoDescription": "...", "tags": ["...", "..."]}

Requirements for "title": Specific and compelling, not generic ("5 Tips for..." is banned — be specific and a little opinionated).

Requirements for "excerpt": One or two sentences, under 155 characters, makes someone want to click.

Requirements for "contentHtml":
- Length: ${LENGTH_GUIDE[length]}.
- Valid HTML using only these tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a href="...">, <hr>. No <html>/<body>/<script>/inline styles/markdown fences.
- Open with a real hook (a scenario, a stat, a blunt claim) — never "In today's competitive job market..." or similar clichés.
- Write in a ${tone} tone, second person ("you"), short paragraphs (2-4 sentences), real specifics (numbers, company names, concrete scenarios) over vague advice.
- Use 3-6 <h2> sections with a couple of <h3> subsections where it helps skimmability.
- Weave in one or two natural mentions of JavihAI where genuinely relevant (e.g. "tools like JavihAI that listen in real time") — do NOT turn it into an ad, and do NOT add a generic "try JavihAI today" CTA block at the end. If you link to JavihAI, the URL is exactly https://javihai.in — never invent or guess a different domain (e.g. javih.ai does not exist and is not ours).
- Ground it in the Indian job-interview context (INR/LPA, Indian company names, HackerRank/LeetCode rounds, Hinglish where it fits naturally) without forcing it into every sentence.
- When you mention JavihAI's own numbers, use ONLY these real facts — do not invent trial results, percentages, or "recent studies" about JavihAI's effectiveness, even as a plausible-sounding illustration: free plan with 15 AI answers/day (no card required); paid plans ₹349 (24h unlimited), ₹1,299 (7-day unlimited), ₹2,499/mo (unlimited); ~2,400 candidates helped so far, including hires at Google India, Flipkart, Razorpay, CRED, Meesho, and Accenture. If none of these fit naturally, mention JavihAI qualitatively instead of making up a number.
- JavihAI's real features are: system-audio capture (hears the interviewer directly, no mic needed), screenshot-and-solve for coding/system-design questions, a live caption transcript, voice-driven mock interviews with scoring, a resume builder, job recommendations, and Desi Mode (Indian-language and CTC/notice-period context). It is invisible to screen share/recording at the OS level. Do NOT invent other capabilities (e.g. webcam eye-contact tracking, filler-word detection, sentiment analysis) — if a feature isn't in this list, don't attribute it to JavihAI.
- Never invent a quote and attribute it to a real, named company or a role at one (e.g. "says a senior recruiter at Tata Consultancy Services") — that fabricates a statement on a real organization's behalf, which is a false-attribution problem, not just a style issue. Named companies may appear as factual context (e.g. "TCS notice periods run 30-90 days") but never as the source of an invented quote or stat. If you want a quote for color, attribute it generically and clearly as illustrative (e.g. "as one hiring manager put it" with no company name), or skip the quote.

Requirements for "seoTitle": under 60 characters, includes the primary keyword naturally.
Requirements for "seoDescription": under 155 characters, includes a reason to click.
Requirements for "tags": 3-6 short lowercase tags relevant to the post (e.g. "interview prep", "system design", "resume tips").`;

  const response = await createJsonCompletionWithRetry(client, {
    // gpt-oss-20b measured unreliable at this JSON task in production
    // (repeated json_validate_failed) — 120b confirmed 5/5 clean JSON
    // completions in a direct side-by-side test against Groq.
    model: 'openai/gpt-oss-120b',
    max_tokens: 4000,
    response_format: { type: 'json_object' },
    // Reasoning model — without this, its hidden <think> trace can consume
    // the visible response and break JSON parsing (see groq/stream/route.ts
    // for the confirmed root cause).
    reasoning_format: 'hidden',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Write a blog post about: ${idea}` },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Groq API');
  }

  let parsed: Partial<GeneratedPost>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('AI returned malformed response — please try again');
  }

  if (!parsed.title?.trim() || !parsed.contentHtml?.trim() || !parsed.excerpt?.trim()) {
    throw new Error('AI response was missing a title, excerpt, or content — please try again');
  }

  return {
    title: parsed.title.trim(),
    slug: slugify(parsed.title),
    excerpt: parsed.excerpt.trim().slice(0, 160),
    contentHtml: parsed.contentHtml.trim(),
    seoTitle: (parsed.seoTitle || parsed.title).trim().slice(0, 60),
    seoDescription: (parsed.seoDescription || parsed.excerpt).trim().slice(0, 160),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 6) : [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { idea, tone, length } = await request.json();

    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      return NextResponse.json({ error: 'A blog idea/prompt is required' }, { status: 400 });
    }

    const safeTone = typeof tone === 'string' && tone.trim() ? tone.trim() : 'conversational but sharp';
    const safeLength: keyof typeof LENGTH_GUIDE = length === 'short' || length === 'long' ? length : 'medium';

    const post = await generatePost(idea.trim(), safeTone, safeLength);

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate blog post';
    console.error('[blog-generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
