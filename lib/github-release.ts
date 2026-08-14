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
  version: 'v1.13.10',
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
  try {
    const latestRes = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/vnd.github+json',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!latestRes.ok) {
      const text = await latestRes.text().catch(() => '');
      console.error(`[github-release] non-ok status=${latestRes.status} body=${text.slice(0, 200)}`);
      return null;
    }

    const latestJson = await latestRes.json() as { tag_name?: string };
    const tag = latestJson.tag_name;
    if (!tag) {
      console.error('[github-release] missing tag_name in latest release');
      return null;
    }

    const taggedRes = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${encodeURIComponent(tag)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/vnd.github+json',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!taggedRes.ok) {
      const text = await taggedRes.text().catch(() => '');
      console.error(`[github-release] tag fetch non-ok status=${taggedRes.status} body=${text.slice(0, 200)}`);
      return null;
    }

    const json = (await taggedRes.json()) as GithubRelease;
    if (!json?.tag_name || !Array.isArray(json.assets)) {
      console.error('[github-release] malformed release payload');
      return null;
    }

    return json;
  } catch (err) {
    console.error('[github-release] fetch failed:', err);
    return null;
  }
}

export async function getLatestRelease(): Promise<LatestRelease> {
  const release = await getLatestReleaseRaw();
  if (!release) return FALLBACK;

  const toDirectUrl = (assetName: string) =>
    `https://github.com/${REPO}/releases/download/${release.tag_name}/${assetName}`;

  return {
    version: release.tag_name,
    releaseUrl: release.html_url,
    macUrl: toDirectUrl(release.assets.find((a) => a.name.endsWith('.dmg'))?.name ?? ''),
    winUrl: toDirectUrl(release.assets.find((a) => a.name.endsWith('.exe'))?.name ?? ''),
    publishedAt: release.published_at,
  };
}
