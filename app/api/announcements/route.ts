import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getServerCached } from '@/lib/server-cache';

export const dynamic = 'force-dynamic';

/** GET — public, read-only feed of active announcements for the landing site's "What's New" bell. */
export async function GET() {
  if (!db) {
    return NextResponse.json({ announcements: [] });
  }

  const data = await getServerCached('announcements:public', 5 * 60 * 1000, async () => {
    const snap = await db.collection('announcements').orderBy('createdAt', 'desc').limit(20).get();
    const announcements = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((a) => (a as { active?: boolean }).active !== false)
      .slice(0, 5);
    return { announcements };
  });

  return NextResponse.json(data);
}
