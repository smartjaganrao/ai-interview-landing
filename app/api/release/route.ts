import { NextResponse } from 'next/server';
import { getLatestRelease } from '@/lib/github-release';

// Public, read-only — just metadata about the latest GitHub release (version,
// download URLs). No auth needed; the admin panel also reads this so the
// GitHub token only has to live in one place. Cached at the edge for 10
// minutes to match the underlying fetch cache in github-release.ts.
export async function GET() {
  const release = await getLatestRelease();
  return NextResponse.json(release, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
      // Public read-only metadata — safe for any origin (the desktop app's
      // own renderer, admin panel) to read directly.
      'Access-Control-Allow-Origin': '*',
    },
  });
}
