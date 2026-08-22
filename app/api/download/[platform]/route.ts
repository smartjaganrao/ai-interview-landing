import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getLatestReleaseRaw } from '@/lib/github-release';

export const maxDuration = 300;

const REPO = 'smartjaganrao/ai-interview-helper';
const EXT: Record<string, string> = { win: '.exe', mac: '.dmg' };
const MAC_ARM64_SUBSTRING = 'mac-arm64.dmg';
const MAC_X64_SUBSTRING = 'mac-x64.dmg';
// Last-resort fallback only — the live release hasn't been re-cut with the
// arch-split build yet, so mac-arm64.dmg/mac-x64.dmg don't exist there. Once
// a new release IS cut, this is never reached (the two lookups above win).
const MAC_UNIVERSAL_SUBSTRING = 'mac-universal.dmg';
const WIN_PREFERRED_SUBSTRING = 'portable-win-x64.exe';

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

  const release = await getLatestReleaseRaw();
  if (!release) {
    console.error('[download] no release data available — cannot serve direct download');
    return NextResponse.json({ error: 'Download temporarily unavailable' }, { status: 503 });
  }

  // ?arch=x64 lets the install page offer Intel Mac users the x64 build
  // directly instead of only ever serving the arm64-preferred default.
  const arch = new URL(req.url).searchParams.get('arch');
  const macSubstring = arch === 'x64' ? MAC_X64_SUBSTRING : MAC_ARM64_SUBSTRING;
  const macFallbackSubstring = arch === 'x64' ? MAC_ARM64_SUBSTRING : MAC_X64_SUBSTRING;

  const assetName = platform === 'mac'
    ? (release.assets.find((a) => a.name.includes(macSubstring) && !a.name.endsWith('.blockmap'))?.name
      ?? release.assets.find((a) => a.name.includes(macFallbackSubstring) && !a.name.endsWith('.blockmap'))?.name
      ?? release.assets.find((a) => a.name.includes(MAC_UNIVERSAL_SUBSTRING) && !a.name.endsWith('.blockmap'))?.name)
    : release.assets.find((a) => a.name.includes(WIN_PREFERRED_SUBSTRING) && !a.name.endsWith('.blockmap'))?.name;

  if (!assetName) {
    console.error(`[download] no matching asset found for platform=${platform} arch=${arch ?? 'default'}`);
    return NextResponse.json({ error: 'Download temporarily unavailable' }, { status: 503 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('[download] GITHUB_TOKEN is not set — cannot proxy private repo asset');
    return NextResponse.json({ error: 'Download not configured' }, { status: 500 });
  }

  const assetMatch = release.assets.find((a) => a.name === assetName);
  if (!assetMatch) {
    console.error(`[download] asset "${assetName}" disappeared between lookup and fetch`);
    return NextResponse.json({ error: 'Download temporarily unavailable' }, { status: 503 });
  }

  logDownload(req, platform, release.tag_name);
  const assetRes = await fetch(
    `https://api.github.com/repos/${REPO}/releases/assets/${assetMatch.id}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/octet-stream' } }
  );

  if (!assetRes.ok || !assetRes.body) {
    console.error(`[download] authenticated proxy failed status=${assetRes.status}`);
    return NextResponse.json({ error: 'Download failed, please try again' }, { status: 502 });
  }

  return new Response(assetRes.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${assetName}"`,
    },
  });
}
