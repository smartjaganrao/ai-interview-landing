import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

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

const LENGTH_GUIDE = {
  short: '~600-800 words',
  medium: '~1000-1400 words',
  long: '~1800-2400 words',
};

async function generatePost(idea: string, tone: string, length: keyof typeof LENGTH_GUIDE): Promise<GeneratedPost> {
  const apiKey = process.env.GROQ_API_KEY;
  // TEMPORARY diagnostic — booleans/lengths only, never the actual secret values.
  console.log('[blog-generate][diag]', JSON.stringify({
    hasGroqKey: !!apiKey,
    groqKeyLen: apiKey?.length ?? 0,
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    hasFirebaseAdmin: !!process.env.FIREBASE_ADMIN_SDK_JSON,
    hasCronSecret: !!process.env.CRON_SECRET,
    envKeyCount: Object.keys(process.env).length,
  }));
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
- Weave in one or two natural mentions of JavihAI where genuinely relevant (e.g. "tools like JavihAI that listen in real time") — do NOT turn it into an ad, and do NOT add a generic "try JavihAI today" CTA block at the end.
- Ground it in the Indian job-interview context (INR/LPA, Indian company names, HackerRank/LeetCode rounds, Hinglish where it fits naturally) without forcing it into every sentence.

Requirements for "seoTitle": under 60 characters, includes the primary keyword naturally.
Requirements for "seoDescription": under 155 characters, includes a reason to click.
Requirements for "tags": 3-6 short lowercase tags relevant to the post (e.g. "interview prep", "system design", "resume tips").`;

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4000,
    response_format: { type: 'json_object' },
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
