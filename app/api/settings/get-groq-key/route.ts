import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST — Get Groq API key for main process.
 *
 * Security: The main Electron process sends a Firebase ID token to verify the user.
 * The server validates the token, reads the Groq key from Firestore (stored by admin),
 * and returns it. The key is stored server-side in Firestore and never distributed
 * with the app; each run fetches it fresh.
 *
 * Request body:
 *   { idToken: string (Firebase ID token from desktop app) }
 *
 * Response:
 *   { groqApiKey: string | null }
 */
export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 503 });

  const { idToken } = await req.json();
  if (!idToken) {
    return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
  }

  // Verify Firebase token (admin verification)
  try {
    const admin = (await import('firebase-admin')).default;
    await admin.auth().verifyIdToken(idToken);
    // Token is valid; user is authenticated
  } catch (err) {
    console.error('[get-groq-key] Token verification failed:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Read Groq key from Firestore (stored by admin panel)
  try {
    const doc = await db.collection('settings').doc('api_keys').get();
    const groqApiKey = doc.exists ? doc.data()?.groqApiKey : null;

    if (!groqApiKey) {
      console.warn('[get-groq-key] No Groq key found in Firestore');
      return NextResponse.json({ groqApiKey: null });
    }

    return NextResponse.json({ groqApiKey });
  } catch (err) {
    console.error('[get-groq-key] Firestore read failed:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve key from server' },
      { status: 500 }
    );
  }
}
