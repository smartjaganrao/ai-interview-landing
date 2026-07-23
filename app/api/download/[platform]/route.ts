import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getLatestReleaseRaw } from '@/lib/github-release';

// Increase Vercel function timeout to 5 minutes so large binaries (100+ MB) can
// stream fully before the function is killed. Requires Vercel Pro plan.
export const maxDuration = 300;

const REPO = 'smartjaganrao/ai-interview-helper';
const EXT: Record<string, string> = { win: '.exe', mac: '.dmg' };
const MAC_PREFERRED_SUBSTRING = 'mac-universal.dmg';
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

function pickAssetName(release: Awaited<ReturnType<typeof getLatestReleaseRaw>>, platform: string, ext: string): string | null {
  if (!release?.assets?.length) return null;
  if (platform === 'mac') {
    const preferred = release.assets.find((a) => a.name.includes(MAC_PREFERRED_SUBSTRING));
    if (preferred) return preferred.name;
  }
  const found = release.assets.find((a) => a.name.endsWith(ext));
  return found?.name ?? null;
}

function buildDirectUrl(tag: string, assetName: string) {
  return `https://github.com/${REPO}/releases/download/${tag}/${assetName}`;
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
  if (release) {
    const assetName = pickAssetName(release, platform, ext);
    if (assetName) {
      const token = process.env.GITHUB_TOKEN;
      const assetMatch = release.assets.find((a) => a.name === assetName);

      if (token && assetMatch) {
        logDownload(req, platform, release.tag_name);
        const assetRes = await fetch(
          `https://api.github.com/repos/${REPO}/releases/assets/${assetMatch.id}`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/octet-stream' } }
        );

        if (assetRes.ok && assetRes.body) {
          return new Response(assetRes.body, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${assetName}"`,
            },
          });
        }

        console.error(`[download] authenticated proxy failed status=${assetRes.status}`);
      }

      logDownload(req, platform, release.tag_name);
      return NextResponse.redirect(buildDirectUrl(release.tag_name, assetName), 302);
    }
  }

  return NextResponse.redirect(LATEST_RELEASE_URL, 302);
}
