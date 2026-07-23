import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getLatestReleaseRaw } from '@/lib/github-release';

// Increase Vercel function timeout to 5 minutes so large binaries (100+ MB) can
// stream fully before the function is killed. Requires Vercel Pro plan.
export const maxDuration = 300;

const REPO = 'smartjaganrao/ai-interview-helper';
const EXT: Record<string, string> = { win: '.exe', mac: '.dmg' };
const MAC_PREFERRED = 'mac-universal.dmg';
const LATEST_RELEASE_URL = `https://github.com/${REPO}/releases/latest`;

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

function pickAsset(release: Awaited<ReturnType<typeof getLatestReleaseRaw>>, platform: string, ext: string) {
  if (!release?.assets?.length) return null;
  if (platform === 'mac') {
    const preferred = release.assets.find((a) => a.name === MAC_PREFERRED);
    if (preferred) return preferred;
  }
  const found = release.assets.find((a) => a.name.endsWith(ext));
  return found ?? null;
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
    // Don't hard-fail the user on transient GitHub/API issues; send them to
    // the GitHub releases page where they can manually grab the right file.
    return NextResponse.redirect(LATEST_RELEASE_URL, 302);
  }

  const found = pickAsset(release, platform, ext);
  if (!found) {
    return NextResponse.redirect(LATEST_RELEASE_URL, 302);
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
    return NextResponse.redirect(found.browser_download_url, 302);
  }

  return new Response(assetRes.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${found.name}"`,
    },
  });
}
