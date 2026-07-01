import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

async function getResendConfig() {
  try {
    const adminDb = await (async () => {
      const { initializeApp, cert, getApps } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      const firebaseAdminConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
        return null;
      }

      const app = getApps().length === 0 ? initializeApp({ credential: cert(firebaseAdminConfig as any) }) : getApps()[0];
      return getFirestore(app);
    })();

    if (!adminDb) return null;

    const settingsSnap = await adminDb.collection('settings').doc('resend').get();
    const data = settingsSnap.data() as { apiKey?: string; fromEmail?: string } | undefined;

    return data?.apiKey && data?.fromEmail
      ? { apiKey: data.apiKey, fromEmail: data.fromEmail }
      : null;
  } catch {
    return null;
  }
}

interface EmailPayload {
  to: string[] | string;
  subject: string;
  html: string;
  fromName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EmailPayload = await request.json();
    const { to, subject, html, fromName } = payload;

    if (!to || !subject || !html) {
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
    const recipients = Array.isArray(to) ? to : [to];

    // Send in batches of 100 (Resend limit)
    const BATCH_SIZE = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      try {
        const { error } = await resend.batch.send(
          batch.map((email) => ({
            from: fromName ? `${fromName} <${resendConfig.fromEmail}>` : resendConfig.fromEmail,
            to: email,
            subject,
            html,
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
