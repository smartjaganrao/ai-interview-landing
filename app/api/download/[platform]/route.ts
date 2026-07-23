import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getLatestReleaseRaw } from '@/lib/github-release';

// Increase Vercel function timeout to 5 minutes so large binaries (100+ MB) can
// stream fully before the function is killed. Requires Vercel Pro plan.
export const maxDuration = 300;

const REPO = 'smartjaganrao/ai-interview-helper';
const EXT: Record<string, string> = { win: '.exe', mac: '.dmg' };

/**
 * Records a download attempt to `download_events` so the admin App-Usage funnel
 * can compare downloads against activation. Fire-and-forget — never blocks or
 * fails the actual binary download. `uid`/`email` are best-effort attribution
 * from query params (the dashboard appends them when the user is signed in).
 */
function logDownload(req: NextRequest, platform: string, version: string) {
  if (!db) return;
  const { searchParams } = new URL(req.url);
  db.collection('download_events').add({
    platform,
    version,
    uid: searchParams.get('uid') || null,
    email: (searchParams.get('email') || '').toLowerCase() || null,
    userAgent: req.headers.get('user-agent') || null,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    createdAt: Date.now(),
  }).catch(() => { /* never block the download */ });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const ext = EXT[platform];
  if (!ext) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

  // Always use the live GitHub release so this never drifts.
  const release = await getLatestReleaseRaw();
  if (!release) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  }

  const found = release.assets.find((a) => a.name.endsWith(ext));
  if (!found) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  logDownload(req, platform, release.tag_name);

  const token = process.env.GITHUB_TOKEN;

  // If we have a token, proxy the binary download through the authenticated
  // assets API so private-repo downloads work too.
  // If no token is configured, fall back to a public browser download.
  if (!token) {
    return NextResponse.redirect(found.browser_download_url, 302);
  }

  const assetRes = await fetch(
    `https://api.github.com/repos/${REPO}/releases/assets/${found.id}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/octet-stream' } }
  );

  if (!assetRes.ok || !assetRes.body) {
    return NextResponse.json({ error: 'Download failed' }, { status: 502 });
  }

  return new Response(assetRes.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${found.name}"`,
    },
  });
}
