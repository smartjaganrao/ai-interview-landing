'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';

const PENDING_KEY = 'javihai_pending_download';

export type DownloadPlatform = 'windows' | 'mac';
// Mac's variant is an architecture choice (arm64 default, x64 opt-in).
// Windows' variant is between two permanent, independently-offered
// binaries — the NSIS installer (default, auto-updates) and the portable
// exe (opt-in, no install/auto-update) — not an arch choice.
type DownloadVariant = 'x64' | 'portable';
type PendingDownload = { platform: DownloadPlatform; variant?: DownloadVariant };

const DOWNLOAD_PATH: Record<DownloadPlatform, string> = {
  windows: '/api/download/win',
  mac: '/api/download/mac',
};

function buildUrl(platform: DownloadPlatform, token: string, variant?: DownloadVariant): string {
  const params = new URLSearchParams({ token });
  if (variant) params.set(platform === 'mac' ? 'arch' : 'variant', variant);
  return `${DOWNLOAD_PATH[platform]}?${params.toString()}`;
}

/**
 * Gates the desktop download links behind Google sign-in — /api/download
 * now requires a valid Firebase ID token server-side, so this is real
 * enforcement, not just a hidden button.
 *
 * A signed-in click fetches a fresh ID token and opens the authenticated
 * download URL directly. A signed-out click opens the sign-in modal instead
 * and resumes the download once auth completes. That resume has to survive
 * a full page reload: `googleSignIn()` falls back to `signInWithRedirect`
 * when the popup is blocked, which navigates away and back, so the pending
 * choice is persisted to localStorage rather than kept only in memory.
 */
export function useGatedDownload(onDownloadStart?: (platform: DownloadPlatform) => void) {
  const { user, loading: authLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const pendingRef = useRef<PendingDownload | null>(null);

  const startDownload = async (pending: PendingDownload, authedUser: User) => {
    // Open the tab synchronously (before the async getIdToken() call) so
    // Safari's popup blocker still sees this as a direct user gesture.
    const newTab = window.open('', '_blank');
    const freshToken = await authedUser.getIdToken();
    setToken(freshToken);
    const url = buildUrl(pending.platform, freshToken, pending.variant);
    if (newTab) newTab.location.href = url;
    else window.open(url, '_blank', 'noopener');
    onDownloadStart?.(pending.platform);
  };

  const requestDownload = (platform: DownloadPlatform, variant?: DownloadVariant) => {
    if (user) {
      startDownload({ platform, variant }, user);
      return;
    }
    pendingRef.current = { platform, variant };
    try { localStorage.setItem(PENDING_KEY, JSON.stringify({ platform, variant })); } catch {}
    setShowSignIn(true);
  };

  const cancelSignIn = () => {
    setShowSignIn(false);
    pendingRef.current = null;
    try { localStorage.removeItem(PENDING_KEY); } catch {}
  };

  const handleSignedIn = (signedInUser: User) => {
    setShowSignIn(false);
    const pending = pendingRef.current;
    pendingRef.current = null;
    try { localStorage.removeItem(PENDING_KEY); } catch {}
    if (pending) startDownload(pending, signedInUser);
  };

  // Resumes a download queued before the redirect-based sign-in fallback —
  // the popup path is already handled by handleSignedIn above.
  useEffect(() => {
    if (authLoading || !user || pendingRef.current) return;
    let pending: PendingDownload | null = null;
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) pending = JSON.parse(raw);
    } catch {}
    if (!pending) return;
    try { localStorage.removeItem(PENDING_KEY); } catch {}
    startDownload(pending, user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // For "download didn't start? try again" links — reuses the same token
  // rather than fetching a new one, and follows whichever OS tab is active.
  const retryUrl = (platform: DownloadPlatform) =>
    user && token ? buildUrl(platform, token) : DOWNLOAD_PATH[platform];

  return { user, showSignIn, requestDownload, cancelSignIn, handleSignedIn, retryUrl };
}
