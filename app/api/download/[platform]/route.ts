import { NextRequest, NextResponse } from 'next/server';

const VERSION = 'v1.3.3';
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const asset = ASSETS[platform];
  if (!asset) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

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
