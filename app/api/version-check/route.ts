import { NextResponse } from 'next/server';

// Bump this to force older clients to update before they can use the app.
// Format: semver string e.g. "1.3.4"
const MIN_VERSION = '1.3.4';
const DOWNLOAD_URL = 'https://www.javihai.in/#download';

function parseVersion(v: string): number[] {
  return v.replace(/[^0-9.]/g, '').split('.').map(Number);
}

function isAtLeast(current: string, minimum: string): boolean {
  const cur = parseVersion(current);
  const min = parseVersion(minimum);
  for (let i = 0; i < 3; i++) {
    const c = cur[i] ?? 0;
    const m = min[i] ?? 0;
    if (c > m) return true;
    if (c < m) return false;
  }
  return true;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const version = searchParams.get('v') ?? '0.0.0';
  const ok = isAtLeast(version, MIN_VERSION);

  return NextResponse.json(
    {
      ok,
      currentVersion: version,
      minVersion: MIN_VERSION,
      downloadUrl: DOWNLOAD_URL,
      message: ok
        ? null
        : `Version ${version} is no longer supported. Please download v${MIN_VERSION} or later to continue.`,
    },
    {
      headers: {
        // Public read-only metadata — the Electron renderer's origin (file://
        // or localhost in dev) differs from javihai.in, so without this the
        // browser blocks the renderer from reading the response body and the
        // version gate fails open silently.
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
