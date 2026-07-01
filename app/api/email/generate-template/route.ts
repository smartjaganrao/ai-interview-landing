import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export const dynamic = 'force-dynamic';

const TEMPLATE_PROMPTS = {
  reengagement_inactive: 'Create a professional, friendly re-engagement email for users who havent used our AI interview preparation app in 30+ days. Include: warm greeting, highlight key features they missed, call-to-action to get back, offer to help. Make it around 200 words.',
  reengagement_never: 'Create a welcoming onboarding email for users who signed up but never activated the desktop app. Include: simple setup instructions, main features (real-time help, system audio capture, Indian language support), success stories, CTA to download and try. Around 200 words.',
  promotion_feature: 'Create a promotional email announcing a new feature for an AI interview prep app. Make it exciting, highlight benefits, include CTA. Around 180 words.',
  promotion_offer: 'Create a promotional email for a special offer/discount on subscription plans. Include: limited-time urgency, plan comparison if needed, testimonial or social proof, CTA to upgrade. Around 180 words.',
  usage_reminder: 'Create a helpful usage reminder email for Pro plan users showing their remaining quota. Include: encouragement, tips for maximizing usage, upgrade information. Around 150 words.',
};

async function generateTemplate(
  type: keyof typeof TEMPLATE_PROMPTS,
  customPrompt?: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const client = new Groq({ apiKey });
  const systemPrompt = `You are an expert email template designer. Create professional, engaging HTML email templates that:
- Use inline styles (no external CSS)
- Are mobile-responsive
- Have proper spacing and typography
- Include brand colors (#6366F1 for primary, dark backgrounds)
- Are suitable for Resend email service
- Include only the HTML body content, no DOCTYPE or html/body tags`;

  const userPrompt = customPrompt || TEMPLATE_PROMPTS[type];

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Create an email template for:\n${userPrompt}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Groq API');
  }

  return content;
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

    const html = await generateTemplate(type as keyof typeof TEMPLATE_PROMPTS, customPrompt);

    return NextResponse.json({
      ok: true,
      html,
      type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate template';
    console.error('[email-template]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
