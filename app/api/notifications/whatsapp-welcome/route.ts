import { NextRequest, NextResponse } from 'next/server';
import { db, verifyIdToken } from '@/lib/firebase-admin';
import { sendWhatsAppTemplate } from '@/lib/whatsapp';

/**
 * Fires once, right after a user completes their profile (registration's
 * final step in this app — see CompleteProfileModal). Never blocks or
 * fails the profile-save flow: always responds 200 even if WhatsApp
 * sending is unconfigured or the send itself fails.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });

    const decoded = await verifyIdToken(idToken);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    if (!db) return NextResponse.json({ success: true, skipped: 'firestore-unavailable' });

    const userRef = db.collection('users').doc(decoded.uid);
    const snap = await userRef.get();
    const data = snap.data();
    if (!data) return NextResponse.json({ success: true, skipped: 'no-user-doc' });

    // Idempotent — profile completion can re-save (e.g. user edits a field
    // before the mandatory gate closes), only the first save should message.
    if (data.notifications?.whatsappWelcomeSentAt) {
      return NextResponse.json({ success: true, skipped: 'already-sent' });
    }

    const whatsapp: string | undefined = data.profile?.whatsapp || data.whatsapp || data.phone;
    if (!whatsapp) return NextResponse.json({ success: true, skipped: 'no-whatsapp-number' });

    const firstName = ((data.profile?.fullName || data.fullName || data.name || 'there') as string).split(' ')[0];
    const contentSid = process.env.TWILIO_TEMPLATE_WELCOME_SID;
    if (!contentSid) return NextResponse.json({ success: true, skipped: 'template-not-configured' });

    const result = await sendWhatsAppTemplate({
      to: whatsapp,
      contentSid,
      contentVariables: { '1': firstName },
    });

    if (result.ok) {
      await userRef.set({ notifications: { whatsappWelcomeSentAt: Date.now() } }, { merge: true });
    }

    return NextResponse.json({ success: true, sent: result.ok, error: result.error });
  } catch (error) {
    console.error('[whatsapp-welcome] error:', error);
    // Still 200 — this is a best-effort notification, never a blocker.
    return NextResponse.json({ success: true, skipped: 'error' });
  }
}
