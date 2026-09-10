import { NextRequest, NextResponse } from 'next/server';
import { sendFreeTrialVoucher, sendNewLeadAlert } from '@/lib/email';
import { db } from '@/lib/firebase-admin';

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TRIAL7-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Ensure it has country code
  if (cleaned.startsWith('91')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { whatsappNumber, email } = body;

    // Validation — just the 2 fields the simplified form collects.
    if (!whatsappNumber || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Same Firebase Admin instance every other server-side route already
    // uses (FIREBASE_ADMIN_SDK_JSON) — this route previously initialized its
    // own, separate Admin SDK client off FIREBASE_PROJECT_ID/CLIENT_EMAIL/
    // PRIVATE_KEY, which were never actually set in any environment
    // (confirmed against .env.local and .env.vercel-production), so every
    // submission here failed at the Firestore write, silently, since forever.
    if (!db) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    // Generate voucher code
    const voucherCode = generateVoucherCode();
    const formattedPhone = formatPhoneNumber(whatsappNumber);

    // Save to Firestore
    const trialRef = db.collection('free_trial_signups').doc();
    await trialRef.set({
      whatsappNumber: formattedPhone,
      email,
      voucherCode,
      createdAt: new Date(),
      status: 'active',
    });

    // Email the voucher to the visitor, and alert support of the new lead.
    // Neither blocks the response — the signup is already saved above, which
    // is the part that actually matters if Resend has a bad day.
    const [voucherEmail] = await Promise.all([
      sendFreeTrialVoucher({ email, voucherCode }),
      sendNewLeadAlert({ whatsappNumber: formattedPhone, email, voucherCode }),
    ]);
    if (!voucherEmail.ok) {
      console.error('[free-trial] voucher email failed:', voucherEmail.error);
    }

    return NextResponse.json({
      success: true,
      voucherCode,
      message: 'Voucher code generated — check your email.',
    });
  } catch (error) {
    console.error('Free trial signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
