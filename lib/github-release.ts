// Single source of truth for "what's the latest desktop release" — fetched
// live from GitHub instead of a hardcoded version string that drifts out of
// sync on every release (the old NEXT_PUBLIC_APP_VERSION / LATEST_RELEASE_TAG
// approach required a code change or env-var edit + redeploy every time).
//
// Repo is private, so this needs GITHUB_TOKEN (already used by the download
// proxy route). Cached for 10 minutes via Next's fetch cache — cheap, and
// fresh enough that a new release shows up site-wide without a deploy.

const REPO = 'smartjaganrao/ai-interview-helper';
const REVALIDATE_SECONDS = 600;

export interface LatestRelease {
  version: string;       // e.g. "v1.8.1"
  releaseUrl: string;
  macUrl: string | null;
  winUrl: string | null;
  publishedAt: string | null;
}

// Used only if GitHub is unreachable or misconfigured — keeps pages rendering
// instead of throwing, at the cost of showing a stale version.
const FALLBACK: LatestRelease = {
  version: 'v1.10.0',
  releaseUrl: `https://github.com/${REPO}/releases/latest`,
  macUrl: null,
  winUrl: null,
  publishedAt: null,
};

interface GithubAsset { id: number; name: string; browser_download_url: string }
interface GithubRelease {
  tag_name: string;
  html_url: string;
  published_at: string;
  assets: GithubAsset[];
}

/** Raw release + asset ids — needed by the download proxy to stream a private
 *  repo's binary via the authenticated assets API (browser_download_url alone
 *  401s on a private repo without going through that endpoint). */
export async function getLatestReleaseRaw(): Promise<GithubRelease | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json() as GithubRelease;
  } catch {
    return null;
  }
}

export async function getLatestRelease(): Promise<LatestRelease> {
  const release = await getLatestReleaseRaw();
  if (!release) return FALLBACK;

  const mac = release.assets.find((a) => a.name.endsWith('.dmg'));
  const win = release.assets.find((a) => a.name.endsWith('.exe') || (a.name.includes('win') && a.name.endsWith('.zip')));

  return {
    version: release.tag_name,
    releaseUrl: release.html_url,
    macUrl: mac?.browser_download_url ?? null,
    winUrl: win?.browser_download_url ?? null,
    publishedAt: release.published_at,
  };
}
