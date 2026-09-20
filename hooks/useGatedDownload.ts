'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { buildWhatsAppLink } from '@/lib/whatsapp-link';
import { isProfileComplete } from '@/lib/auth';

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
  // Profile-completeness gate — reuses the same CompleteProfileModal already
  // wired into /auth/signup, /auth/login, and /dashboard. Before this, the
  // homepage/install-page download button was the one path that let someone
  // sign in via the lightweight GoogleSignInModal and download indefinitely
  // without ever completing their profile (name/WhatsApp/role/etc.), since
  // this hook never checked isProfileComplete at all.
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fetchedUserData, setFetchedUserData] = useState<Record<string, unknown> | null>(null);
  const profilePendingRef = useRef<{ pending: PendingDownload; user: User } | null>(null);

  const startDownload = async (pending: PendingDownload, authedUser: User) => {
    // Both tabs opened synchronously (before any await) so popup blockers
    // still see them as a direct result of the click, not unsolicited
    // popups — same reasoning as the download tab itself.
    const newTab = window.open('', '_blank');
    const waTab = window.open('', '_blank');
    const freshToken = await authedUser.getIdToken();
    setToken(freshToken);
    const url = buildUrl(pending.platform, freshToken, pending.variant);
    if (newTab) newTab.location.href = url;
    else window.open(url, '_blank', 'noopener');

    // Real-time sales visibility for the team — a pre-filled WhatsApp message
    // the visitor still has to press Send on (no outbound automation exists;
    // Twilio/Meta template approval is a separate, still-blocked effort).
    const waLink = buildWhatsAppLink(
      `Hi! I just downloaded JavihAI for ${pending.platform}${pending.variant ? ` (${pending.variant})` : ''} — ${authedUser.email ?? ''}`
    );
    if (waLink) {
      if (waTab) waTab.location.href = waLink;
      else window.open(waLink, '_blank', 'noopener');
    } else {
      waTab?.close();
    }

    onDownloadStart?.(pending.platform);
  };

  // Checks profile completeness before actually starting the download —
  // shows CompleteProfileModal and parks the download until it's done if
  // the profile isn't complete yet, otherwise downloads immediately.
  const proceedIfProfileComplete = async (pending: PendingDownload, authedUser: User) => {
    let userData: Record<string, unknown> | null = null;
    try {
      const snap = await getDoc(doc(db, 'users', authedUser.uid));
      userData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
    } catch {
      // Firestore unreachable — don't block a real Google-authenticated
      // download on it; same "let them through" reasoning /auth/signup's
      // syncAfterAuth uses for this exact failure mode.
      startDownload(pending, authedUser);
      return;
    }
    if (isProfileComplete(userData)) {
      startDownload(pending, authedUser);
      return;
    }
    profilePendingRef.current = { pending, user: authedUser };
    setFetchedUserData(userData);
    setShowProfileModal(true);
  };

  const requestDownload = (platform: DownloadPlatform, variant?: DownloadVariant) => {
    if (user) {
      proceedIfProfileComplete({ platform, variant }, user);
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
    if (pending) proceedIfProfileComplete(pending, signedInUser);
  };

  // Called by CompleteProfileModal's onDone once the profile form is
  // actually submitted — only now does the parked download proceed.
  const handleProfileDone = () => {
    setShowProfileModal(false);
    const parked = profilePendingRef.current;
    profilePendingRef.current = null;
    if (parked) startDownload(parked.pending, parked.user);
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
    proceedIfProfileComplete(pending, user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // For "download didn't start? try again" links — reuses the same token
  // rather than fetching a new one, and follows whichever OS tab is active.
  const retryUrl = (platform: DownloadPlatform) =>
    user && token ? buildUrl(platform, token) : DOWNLOAD_PATH[platform];

  return {
    user, showSignIn, requestDownload, cancelSignIn, handleSignedIn, retryUrl,
    showProfileModal, fetchedUserData, handleProfileDone,
  };
}
