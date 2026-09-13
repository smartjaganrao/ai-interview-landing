import { NextRequest, NextResponse } from 'next/server';
import { getLatestReleaseRaw } from '@/lib/github-release';

export const maxDuration = 300;

const REPO = 'smartjaganrao/ai-interview-helper';

/**
 * Generic-provider update feed for the desktop app's electron-updater —
 * NOT the same as /api/download, which requires sign-in. ai-interview-helper
 * is a private repo, so electron-updater's built-in "github" provider can't
 * check for updates: any token capable of reading a private repo's releases
 * via the GitHub API also grants Contents:read on the whole repo (the
 * Releases and Contents APIs share that permission), so embedding one in
 * the shipped app would hand out full source access to anyone who extracts
 * it — not an acceptable tradeoff just to keep this specific check working.
 *
 * Instead, package.json's build.publish is a "generic" provider pointing
 * here: electron-updater fetches <this-url>/latest-mac.yml (unauthenticated,
 * from its own perspective), reads which asset filename it names, and
 * fetches that same filename from this same base URL — both requests land
 * on this one dynamic route, keyed only by filename. GITHUB_TOKEN stays
 * server-side, exactly like /api/download already does; the desktop app
 * itself never holds any repo-scoped credential.
 *
 * Deliberately unauthenticated (unlike /api/download): this only ever
 * serves compiled release artifacts and the version-check YAML — the same
 * things a PUBLIC repo's release page would expose to anyone regardless of
 * sign-in. The thing actually being protected by keeping the repo private
 * is the source tree, which this route never touches.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  const release = await getLatestReleaseRaw();
  if (!release) {
    console.error('[updates] no release data available — cannot serve update feed');
    return NextResponse.json({ error: 'Update feed temporarily unavailable' }, { status: 503 });
  }

  const asset = release.assets.find((a) => a.name === filename);
  if (!asset) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('[updates] GITHUB_TOKEN is not set — cannot proxy private repo asset');
    return NextResponse.json({ error: 'Update feed not configured' }, { status: 500 });
  }

  const assetRes = await fetch(
    `https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/octet-stream' } },
  );

  if (!assetRes.ok || !assetRes.body) {
    console.error(`[updates] authenticated proxy failed status=${assetRes.status} filename=${filename}`);
    return NextResponse.json({ error: 'Update fetch failed' }, { status: 502 });
  }

  // electron-updater must always see the CURRENT manifest/binary, never a
  // cached stale one — this is the actual update-check path, not a page
  // view. No length-based caching either: same reasoning.
  return new Response(assetRes.body, {
    headers: {
      'Content-Type': filename.endsWith('.yml') ? 'text/yaml; charset=utf-8' : 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  });
}
