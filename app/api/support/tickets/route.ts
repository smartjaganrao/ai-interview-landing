import { NextRequest, NextResponse } from 'next/server';
import { db, verifyIdToken } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json() as { idToken: string };
    const user = idToken ? await verifyIdToken(idToken) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const snap = await db
      .collection('support_tickets')
      .where('userId', '==', user.uid)
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();

    const tickets = snap.docs.map((d: any) => ({
      id: d.id,
      title: d.data().title,
      category: d.data().category,
      status: d.data().status,
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt,
      messages: (d.data().messages || []) as Array<{
        senderType: 'user' | 'admin';
        senderEmail: string;
        message: string;
        timestamp: number;
      }>,
    }));

    return NextResponse.json({ tickets });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to load tickets';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
