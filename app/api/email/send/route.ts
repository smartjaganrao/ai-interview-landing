import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const DEFAULT_FROM = 'JavihAI <onboarding@resend.dev>';

let cachedResendConfig: ResendConfig | null = null;
let cachedResendConfigExpiresAt = 0;
const RESEND_CONFIG_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

/**
 * Resolves the Resend API key + From address the same way the admin panel
 * does (lib/resend-server.ts): admin-managed keys in Firestore
 * (settings/api_keys) take precedence, falling back to env vars.
 */
async function getResendConfig(): Promise<ResendConfig | null> {
  const now = Date.now();
  if (cachedResendConfig && cachedResendConfigExpiresAt > now) {
    return cachedResendConfig;
  }

  try {
    if (db) {
      const doc = await db.collection('settings').doc('api_keys').get();
      const data = doc.exists ? doc.data() : null;
      if (data?.resendApiKey) {
        cachedResendConfig = {
          apiKey: data.resendApiKey as string,
          fromEmail: (data.resendFromEmail as string) || process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
        };
        cachedResendConfigExpiresAt = now + RESEND_CONFIG_CACHE_TTL;
        return cachedResendConfig;
      }
    }
  } catch { /* fall through to env */ }

  if (process.env.RESEND_API_KEY) {
    cachedResendConfig = {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    };
    cachedResendConfigExpiresAt = now + RESEND_CONFIG_CACHE_TTL;
    return cachedResendConfig;
  }

  return null;
}

interface PersonalizedRecipient {
  email: string;
  html: string;
}

interface EmailPayload {
  // Either a plain address list (every recipient gets the same `html`), or
  // a per-recipient array carrying already-personalized html (used by
  // promotions/send after substituting merge fields like {{first_name}}
  // per user — this route has no recipient identity of its own to do that
  // substitution itself).
  to: string[] | string | PersonalizedRecipient[];
  subject: string;
  html?: string;
  fromName?: string;
}

function isPersonalizedRecipients(to: EmailPayload['to']): to is PersonalizedRecipient[] {
  return Array.isArray(to) && to.length > 0 && typeof to[0] === 'object';
}

export async function POST(request: NextRequest) {
  try {
    const payload: EmailPayload = await request.json();
    const { to, subject, html, fromName } = payload;

    if (!to || !subject || (!html && !isPersonalizedRecipients(to))) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const resendConfig = await getResendConfig();
    if (!resendConfig) {
      return NextResponse.json(
        { error: 'Email service not configured. Add Resend API key in Settings → API Keys.' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendConfig.apiKey);
    const recipients: PersonalizedRecipient[] = isPersonalizedRecipients(to)
      ? to
      : (Array.isArray(to) ? (to as string[]) : [to as string]).map((email) => ({ email, html: html! }));

    // Send in batches of 100 (Resend limit)
    const BATCH_SIZE = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      try {
        const { error } = await resend.batch.send(
          batch.map((recipient) => ({
            from: fromName ? `${fromName} <${resendConfig.fromEmail}>` : resendConfig.fromEmail,
            to: recipient.email,
            subject,
            html: recipient.html,
          }))
        );

        if (error) {
          failed += batch.length;
          console.error('[email-send] Batch error:', error);
        } else {
          sent += batch.length;
        }
      } catch (err) {
        failed += batch.length;
        console.error('[email-send] Batch failed:', err);
      }

      // Small delay between batches
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      total: recipients.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('[email-send]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
