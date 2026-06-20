import { NextRequest, NextResponse } from 'next/server';
import { db, verifyIdToken } from '@/lib/firebase-admin';
import { sendNewTicketAlert } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken, title, description, category } = await request.json() as {
      idToken: string; title: string; description: string; category: string;
    };

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    const user = idToken ? await verifyIdToken(idToken) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const now = Date.now();
    const ref = await db.collection('support_tickets').add({
      userId: user.uid,
      userEmail: user.email ?? '',

      title: title.trim(),
      description: description.trim(),
      category: category || 'other',
      status: 'open',
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
      messages: [{
        senderType: 'user',
        senderUid: user.uid,
        senderEmail: user.email ?? '',
        message: description.trim(),
        timestamp: now,
      }],
    });

    // Notify admin — non-blocking
    sendNewTicketAlert({
      ticketId: ref.id,
      title: title.trim(),
      category: category || 'other',
      userEmail: user.email ?? '',
      message: description.trim(),
    }).catch(() => {});

    return NextResponse.json({ ok: true, ticketId: ref.id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create ticket';
    console.error('[support/ticket POST]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
