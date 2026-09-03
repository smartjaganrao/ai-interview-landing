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
  version: 'v1.17.0',
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

export interface ChangelogEntry {
  version: string;
  releaseUrl: string;
  publishedAt: string | null;
  notes: string; // raw markdown body from `gh release create --notes`
}

/** Every desktop release, newest first — for the public /changelog page. */
export async function getAllReleases(): Promise<ChangelogEntry[]> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/vnd.github+json',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[github-release] releases list non-ok status=${res.status} body=${text.slice(0, 200)}`);
      return [];
    }
    const json = (await res.json()) as Array<GithubRelease & { body?: string; draft?: boolean; prerelease?: boolean }>;
    const seen = new Set<string>();
    return json
      .filter((r) => !r.draft && !r.prerelease && r.tag_name)
      // Some older tags were re-cut and appear twice in the API response
      // (same tag_name, different release id) — keep only the first (the
      // list is already newest-first, so this keeps the current one).
      .filter((r) => (seen.has(r.tag_name) ? false : (seen.add(r.tag_name), true)))
      .map((r) => ({
        version: r.tag_name,
        releaseUrl: r.html_url,
        publishedAt: r.published_at,
        notes: r.body || '',
      }));
  } catch (err) {
    console.error('[github-release] releases list fetch failed:', err);
    return [];
  }
}

export async function getLatestRelease(): Promise<LatestRelease> {
  const release = await getLatestReleaseRaw();
  if (!release) return FALLBACK;

  const toDirectUrl = (assetName: string) =>
    `https://github.com/${REPO}/releases/download/${release.tag_name}/${assetName}`;

  // Prefer arm64 (Apple Silicon), then x64. Universal is a last-resort
  // fallback only — it's what the live release actually has until a new
  // release is cut with the arch-split build; once one is, this branch
  // is never reached since arm64/x64 will exist.
  const macAsset =
    release.assets.find((a) => a.name.includes('mac-arm64.dmg') && !a.name.endsWith('.blockmap')) ??
    release.assets.find((a) => a.name.includes('mac-x64.dmg') && !a.name.endsWith('.blockmap')) ??
    release.assets.find((a) => a.name.includes('mac-universal.dmg') && !a.name.endsWith('.blockmap'));
  const winAsset = release.assets.find((a) => a.name.includes('portable-win-x64.exe') && !a.name.endsWith('.sha256'));

  return {
    version: release.tag_name,
    releaseUrl: release.html_url,
    macUrl: toDirectUrl(macAsset?.name ?? ''),
    winUrl: toDirectUrl(winAsset?.name ?? ''),
    publishedAt: release.published_at,
  };
}
