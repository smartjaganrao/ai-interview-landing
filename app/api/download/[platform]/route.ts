import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Increase Vercel function timeout to 5 minutes so large binaries (100+ MB) can
// stream fully before the function is killed. Requires Vercel Pro plan.
export const maxDuration = 300;

// Set LATEST_RELEASE_TAG in Vercel env vars (e.g. "v1.3.4") to avoid a code
// deploy on every release. Falls back to the constant below if unset.
const VERSION = process.env.LATEST_RELEASE_TAG ?? 'v1.4.0';
const REPO = 'smartjaganrao/ai-interview-helper';

const ASSETS: Record<string, { file: string; mime: string }> = {
  win: {
    file: `JavihAI-${VERSION}-portable-win-x64.exe`,
    mime: 'application/octet-stream',
  },
  mac: {
    file: `JavihAI-${VERSION}-mac-universal.dmg`,
    mime: 'application/octet-stream',
  },
};

/**
 * Records a download attempt to `download_events` so the admin App-Usage funnel
 * can compare downloads against activation. Fire-and-forget — never blocks or
 * fails the actual binary download. `uid`/`email` are best-effort attribution
 * from query params (the dashboard appends them when the user is signed in).
 */
function logDownload(req: NextRequest, platform: string) {
  if (!db) return;
  const { searchParams } = new URL(req.url);
  db.collection('download_events').add({
    platform,
    version: VERSION,
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
  const asset = ASSETS[platform];
  if (!asset) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

  logDownload(req, platform);

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Download not configured' }, { status: 503 });
  }

  const githubUrl = `https://api.github.com/repos/${REPO}/releases/assets`;

  // Fetch the release to get the asset ID
  const releaseRes = await fetch(
    `https://api.github.com/repos/${REPO}/releases/tags/${VERSION}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  );

  if (!releaseRes.ok) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  }

  const release = await releaseRes.json() as { assets: { id: number; name: string }[] };
  const found = release.assets.find(a => a.name === asset.file);
  if (!found) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  // Stream the binary directly to the user
  const assetRes = await fetch(
    `${githubUrl}/${found.id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/octet-stream',
      },
    }
  );

  if (!assetRes.ok || !assetRes.body) {
    return NextResponse.json({ error: 'Download failed' }, { status: 502 });
  }

  return new Response(assetRes.body, {
    headers: {
      'Content-Type': asset.mime,
      'Content-Disposition': `attachment; filename="${asset.file}"`,
    },
  });
}
