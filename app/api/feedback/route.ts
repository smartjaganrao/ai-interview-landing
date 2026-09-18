import { NextRequest, NextResponse } from 'next/server';
import { db, verifyIdToken } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rating, category = 'ux', message = '', userEmail = '', userName = '', platform = 'web_landing', idToken } = body;

    // Validate rating
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    // Validate message
    const trimmedMessage = String(message).trim();
    if (!trimmedMessage) {
      return NextResponse.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    let uid: string | null = null;
    let verifiedEmail = userEmail;
    let verifiedName = userName;

    // Verify token if provided
    if (idToken) {
      try {
        const authUser = await verifyIdToken(idToken);
        if (authUser) {
          uid = authUser.uid;
          if (authUser.email) verifiedEmail = authUser.email;
        }
      } catch {
        /* proceed with guest details if token verify fails */
      }
    }

    const feedbackDoc = {
      rating: numRating,
      category: String(category).toLowerCase(),
      message: trimmedMessage.slice(0, 3000),
      userEmail: String(verifiedEmail).trim(),
      userName: String(verifiedName).trim(),
      userId: uid,
      platform: String(platform).trim() || 'web_landing',
      status: 'new',
      createdAt: Date.now(),
      userAgent: req.headers.get('user-agent') || '',
    };

    if (db) {
      const docRef = await db.collection('feedback').add(feedbackDoc);
      return NextResponse.json({ success: true, id: docRef.id });
    }

    // Fallback response if server-side db is uninitialized
    return NextResponse.json({ success: true, id: `local-${Date.now()}` });
  } catch (err) {
    console.error('[api/feedback] Error processing feedback:', err);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}
