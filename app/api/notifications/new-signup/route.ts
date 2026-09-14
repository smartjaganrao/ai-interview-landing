import { NextRequest, NextResponse } from 'next/server';
import { db, verifyIdToken } from '@/lib/firebase-admin';
import { sendNewSignupAlert } from '@/lib/email';

/**
 * Fires once, right after a brand-new users/{uid} doc is created — from
 * either the web app (ensureUserDocs, lib/auth.ts) or the desktop app
 * (signInWithGoogle, auth.service.ts, which has no server of its own and
 * calls this route directly). Same shape/CORS pattern as
 * /api/notifications/profile-completed. Never blocks or fails the signup
 * flow: always responds 200 even if email sending is unconfigured or the
 * send itself fails. Idempotent via notifications.newSignupAlertSentAt.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: Record<string, unknown>, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, source } = await req.json();
    if (!idToken) return json({ success: false, error: 'Missing idToken' }, { status: 400 });

    const decoded = await verifyIdToken(idToken);
    if (!decoded) return json({ success: false, error: 'Invalid token' }, { status: 401 });

    if (!db) return json({ success: true, skipped: 'firestore-unavailable' });

    const userRef = db.collection('users').doc(decoded.uid);
    const snap = await userRef.get();
    const data = snap.data();
    if (!data) return json({ success: true, skipped: 'no-user-doc' });

    if (data.notifications?.newSignupAlertSentAt) {
      return json({ success: true, skipped: 'already-sent' });
    }

    const email = decoded.email || data.email || '';
    const name = data.name || 'there';

    const result = await sendNewSignupAlert({
      email, name,
      source: source === 'desktop' ? 'desktop' : 'web',
    });

    if (result.ok) {
      await userRef.set({ notifications: { newSignupAlertSentAt: Date.now() } }, { merge: true });
    }

    return json({ success: true, sent: result.ok, error: result.error });
  } catch (error) {
    console.error('[new-signup] error:', error);
    return json({ success: true, skipped: 'error' });
  }
}
