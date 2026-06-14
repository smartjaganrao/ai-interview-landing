import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';

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

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq not configured' }, { status: 503 });
    }

    return NextResponse.json({ groqApiKey });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
