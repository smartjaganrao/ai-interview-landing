import { NextRequest, NextResponse } from 'next/server';
import { db, verifyIdToken } from '@/lib/firebase-admin';
import { sendProfileCompletedAlert } from '@/lib/email';

/**
 * Fires once, right after a user completes the mandatory profile form —
 * from either the web app (CompleteProfileModal) or the desktop app
 * (AcquisitionPrompt, which calls this same route directly since it has no
 * server of its own). Never blocks or fails the profile-save flow: always
 * responds 200 even if email sending is unconfigured or the send itself
 * fails. Idempotent via notifications.profileCompletedAlertSentAt, so
 * completing on one app and re-saving (or completing) on the other never
 * sends a second alert.
 *
 * A submitted `supportQuery` also opens a real support_tickets doc (same
 * shape as app/api/support/ticket/route.ts) instead of only living inside
 * this email — these are rare, high-intent leads (someone stuck on install
 * asking for help), so they get a status/priority/owner in the admin Support
 * page rather than depending on the alert email being read. No second admin
 * email for it — sendProfileCompletedAlert above already surfaces the query.
 *
 * Unlike whatsapp-welcome (web-only, same-origin), the desktop app calls
 * this route directly from its Electron renderer — a real cross-origin
 * fetch (http://localhost:<port> -> javihai.in), not exempt from CORS just
 * for being localhost. `*` is safe here since auth is a bearer idToken in
 * the body, not a cookie — there's nothing for a third-party origin to ride
 * on for free the way there would be with cookie-based auth.
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

    if (data.notifications?.profileCompletedAlertSentAt) {
      return json({ success: true, skipped: 'already-sent' });
    }

    const profile = data.profile ?? {};
    const name = profile.fullName || data.fullName || data.name || 'there';
    const whatsapp = profile.whatsapp || data.whatsapp || data.phone;
    const experienceLevel = profile.experienceLevel || data.experienceLevel;
    const jobRole = profile.jobRole || data.jobRole;
    const city = profile.city || data.city;
    const acquisitionSource = data.acquisition?.customerSelectedSource;
    if (!whatsapp || !experienceLevel || !jobRole || !city || !acquisitionSource) {
      return json({ success: true, skipped: 'profile-incomplete' });
    }

    const result = await sendProfileCompletedAlert({
      email: decoded.email || data.email || '',
      name,
      whatsapp,
      experienceLevel,
      jobRole,
      city,
      acquisitionSource,
      supportQuery: profile.supportQuery || null,
      source: source === 'desktop' ? 'desktop' : 'web',
    });

    let ticketId: string | undefined;
    if (result.ok) {
      await userRef.set({ notifications: { profileCompletedAlertSentAt: Date.now() } }, { merge: true });

      if (profile.supportQuery) {
        const now = Date.now();
        const email = decoded.email || data.email || '';
        const ticketRef = await db.collection('support_tickets').add({
          userId: decoded.uid,
          userEmail: email,
          title: `Installation help — ${name}`,
          description: profile.supportQuery,
          category: 'technical',
          status: 'open',
          priority: 'high',
          createdAt: now,
          updatedAt: now,
          messages: [{
            senderType: 'user',
            senderUid: decoded.uid,
            senderEmail: email,
            message: profile.supportQuery,
            timestamp: now,
          }],
        });
        ticketId = ticketRef.id;
      }
    }

    return json({ success: true, sent: result.ok, ticketId, error: result.error });
  } catch (error) {
    console.error('[profile-completed] error:', error);
    return json({ success: true, skipped: 'error' });
  }
}
