import { NextRequest, NextResponse } from 'next/server';

let db: any = null;

async function getFirestoreDb() {
  if (db) return db;

  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    const firebaseAdminConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Validate config
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
      throw new Error('Missing Firebase credentials in environment variables');
    }

    const app = getApps().length === 0 ? initializeApp({ credential: cert(firebaseAdminConfig as any) }) : getApps()[0];
    db = getFirestore(app);
    return db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

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

async function sendWhatsAppMessage(): Promise<boolean> {
  try {
    // For now, we're saving to Firestore and returning a WhatsApp link
    // In production, you'd integrate with Twilio or WhatsApp Cloud API
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, whatsappNumber, email, company, role } = body;

    // Validation
    if (!name || !age || !whatsappNumber || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Firestore instance
    const firestoreDb = await getFirestoreDb();

    // Generate voucher code
    const voucherCode = generateVoucherCode();
    const formattedPhone = formatPhoneNumber(whatsappNumber);

    // Save to Firestore
    const trialRef = firestoreDb.collection('free_trial_signups').doc();
    await trialRef.set({
      name,
      age: parseInt(age),
      whatsappNumber: formattedPhone,
      email,
      company: company || null,
      role: role || null,
      voucherCode,
      createdAt: new Date(),
      status: 'active',
    });

    // Send WhatsApp message
    await sendWhatsAppMessage();

    // Return WhatsApp link for fallback
    const messageText = `Hi ${name}! 🎉 Your JavihAI 1-week free trial voucher code is: ${voucherCode}. Use this code at https://javihai.in/pricing to unlock unlimited AI answers and more for 7 days. Happy prepping! 🚀`;
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;

    return NextResponse.json({
      success: true,
      voucherCode,
      whatsappLink,
      message: 'Voucher code generated and WhatsApp message ready',
    });
  } catch (error) {
    console.error('Free trial signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
