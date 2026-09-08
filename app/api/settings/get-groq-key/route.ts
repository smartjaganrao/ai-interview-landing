import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, checkAiQuota, notifyQuotaExceededOnce } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'idToken required' }, { status: 400 });
    }

    const user = await verifyIdToken(idToken);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Same ban/quota gate as /api/groq/stream — this hands back a real,
    // reusable Groq key (used by the desktop app's Whisper transcription),
    // so "is signed in" alone isn't enough; a banned or over-quota user
    // could otherwise get the key here and bypass the quota gate entirely.
    const quota = await checkAiQuota(user.uid);
    if (!quota.allowed) {
      if (quota.banned) {
        return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
      }
      if (quota.plan === 'free' && user.email) {
        void notifyQuotaExceededOnce(user.uid, user.email, '');
      }
      return NextResponse.json(
        { error: quota.plan === 'free' ? 'Daily AI quota reached. Upgrade to Pro for unlimited AI.' : 'Daily AI quota reached. Try again tomorrow, or contact support if this is unexpected.' },
        { status: 429 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq not configured' }, { status: 503 });
    }

    return NextResponse.json({ groqApiKey });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
