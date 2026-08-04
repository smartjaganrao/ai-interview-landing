import { NextRequest, NextResponse } from 'next/server';
import { db, verifyIdToken } from '@/lib/firebase-admin';
import { getServerCached } from '@/lib/server-cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json() as { idToken: string };
    const user = idToken ? await verifyIdToken(idToken) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const firestore = db;
    const cacheKey = `support:tickets:${user.uid}`;

    const tickets = await getServerCached(cacheKey, 30 * 1000, async () => {
      const snap = await firestore
        .collection('support_tickets')
        .where('userId', '==', user.uid)
        .limit(20)
        .get();

      return snap.docs.map((d: any) => ({
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
      })).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    });

    return NextResponse.json({ tickets });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to load tickets';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
