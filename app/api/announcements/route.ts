import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/** GET — public, read-only feed of active announcements for the landing site's "What's New" bell. */
export async function GET() {
  if (!db) {
    return NextResponse.json({ announcements: [] });
  }

  // No compound where+orderBy (avoids needing a composite index) — fetch
  // recent docs unsorted-by-filter, then filter+sort client-side.
  const snap = await db.collection('announcements').orderBy('createdAt', 'desc').limit(20).get();
  const announcements = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((a) => (a as { active?: boolean }).active !== false)
    .slice(0, 5);

  return NextResponse.json({ announcements });
}
