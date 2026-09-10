import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, isUserBanned } from '@/lib/firebase-admin';

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

    // Ban gate only — this hands back a real, reusable Groq key (used by the
    // desktop app's Whisper transcription and cached/reused across many
    // transcriptions), so "is signed in" alone isn't enough; a banned user
    // could otherwise get a working key here regardless of quota. The actual
    // per-feature quota (screenshot/system_audio/mic) is enforced at answer
    // -generation time in /api/groq/stream instead — this key-fetch happens
    // far less often than individual answers, so gating it on a specific
    // feature's count here would never track real per-answer usage anyway.
    const { banned } = await isUserBanned(user.uid);
    if (banned) {
      return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
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
