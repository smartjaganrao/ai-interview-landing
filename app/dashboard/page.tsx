'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { refreshAllData, clearAllData, type ActivityData } from '@/lib/data-sync';
import { setSubscription as setSubAction } from '@/lib/slices/subscriptionSlice';
import { setUser } from '@/lib/slices/userSlice';
import CompleteProfileModal, { isProfileComplete } from '@/components/CompleteProfileModal';
import DownloadStepsModal from '@/components/DownloadStepsModal';
import DownloadPromptModal from '@/components/DownloadPromptModal';
import LiveGuideModeDemo from '@/components/LiveGuideModeDemo';
import { CompanyPrepPacks } from '@/components/CompanyPrepPacks';
import { AudioDiagnosticModal } from '@/components/AudioDiagnosticModal';
import { trackEvent } from '@/components/GoogleAnalytics';
import { PLANS, PlanId, migratePlanId, getPlanById } from '@/lib/pricing-config';
import { buildWhatsAppLink } from '@/lib/whatsapp-link';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

const DOWNLOAD_PROMPT_SHOWN_KEY = 'javihai_download_prompt_shown';
const DOWNLOAD_PROMPT_DELAY_MS = 1500;

const WINDOWS_DOWNLOAD_URL = '/api/download/win';
const MAC_DOWNLOAD_URL = '/api/download/mac';

function detectDesktopOS(): 'mac' | 'windows' | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) return 'mac';
  return null;
}

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const userData = useAppSelector((state) => state.user.data);
  const subData = useAppSelector((state) => state.subscription.data);
  const usageData = useAppSelector((state) => state.usage.data);
  const [activity, setActivity] = useState<ActivityData>({ totalSessions: 0, totalQuestions: 0 });
  const [dataReady, setDataReady] = useState({ user: false, sub: false, usage: false, activity: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportTab, setSupportTab] = useState<'new'|'history'>('new');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState('');
  const [myTickets, setMyTickets] = useState<Array<{
    id: string; title: string; category: string; status: string;
    createdAt: number; updatedAt: number;
    messages: Array<{ senderType: 'user'|'admin'; senderEmail: string; message: string; timestamp: number }>;
  }>>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string|null>(null);
  const [appVersion, setAppVersion] = useState('');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [videoFilter, setVideoFilter] = useState<'all' | 'windows' | 'mac' | 'overview'>('all');
  // Only true when the current release has a portable exe distinct from
  // the main Windows download (see winPortableUrl in lib/github-release.ts)
  // — avoids showing a second link that would just redownload the same file.
  const [winPortableAvailable, setWinPortableAvailable] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [detectedOS, setDetectedOS] = useState<'mac' | 'windows' | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [modalOS, setModalOS] = useState<'windows' | 'mac'>('windows');
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [showAudioDiag, setShowAudioDiag] = useState(false);
  // "Got the offer" referral prompt — explicitly opt-in (the user clicks to
  // confirm a real outcome, nothing is inferred or automated) per the
  // sensitivity of this product category. Dismissal persists the same way
  // trialModalDismissed does elsewhere on the site: a localStorage flag, not
  // a new Firestore field, since this is a one-time "don't ask again" state,
  // not data anything else needs to read.
  const [offerConfirmed, setOfferConfirmed] = useState(false);
  const [referralInfo, setReferralInfo] = useState<{ code: string; link: string; reward: number } | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    if (searchParams.get('audiocheck') === '1' || searchParams.get('mic') === '1') {
      setShowAudioDiag(true);
    }
  }, [searchParams]);

  // /api/download requires a signed-in Firebase ID token (see the public
  // landing/install pages' gated download flow) — this page is already
  // behind the auth redirect above, so we just need to attach a fresh token
  // instead of the old uid/email query params, which the API no longer reads.
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const withToken = (url: string, token: string) => {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}token=${encodeURIComponent(token)}`;
  };

  useEffect(() => {
    fetch('/api/release').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.version) setAppVersion(d.version);
      setWinPortableAvailable(!!d?.winPortableUrl);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const os = detectDesktopOS();
    setDetectedOS(os);
    if (os === 'windows') setVideoFilter('windows');
    else if (os === 'mac') setVideoFilter('mac');
    setOfferConfirmed(!!localStorage.getItem('javihai_offer_confirmed'));
  }, []);

  useEffect(() => {
    if (user) {
      const checkDownload = localStorage.getItem('javihai_downloaded');
      setHasDownloaded(!!checkDownload);
    }
  }, [user]);

  // Proactive install help — fires only on the real friction point: they
  // clicked download but haven't started a session a while later. Firing
  // this blindly on page load (before anyone has even tried anything) just
  // trains people to ignore it.
  useEffect(() => {
    if (!hasDownloaded || activity.totalSessions > 0) return;
    const timer = setTimeout(() => setShowInstallHelp(true), 45000);
    return () => clearTimeout(timer);
  }, [hasDownloaded, activity.totalSessions]);

  useEffect(() => {
    if (!authLoading && user && userData && dataReady.user) {
      if (!isProfileComplete(userData)) {
        setShowProfilePrompt(true);
      }
    }
  }, [user, userData, authLoading, dataReady.user]);

  // Nudge freshly-logged-in users to actually download the desktop app —
  // the hero card further down the page is passive and easy to miss.
  // Waits for showProfilePrompt to resolve first so the two full-screen
  // modals never stack; sessionStorage gate means it reappears each new
  // login session (until they've downloaded) but not on every navigation
  // within one session.
  useEffect(() => {
    if (authLoading || !user || hasDownloaded || showProfilePrompt) return;
    if (sessionStorage.getItem(DOWNLOAD_PROMPT_SHOWN_KEY)) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(DOWNLOAD_PROMPT_SHOWN_KEY, '1');
      setShowDownloadPrompt(true);
      trackEvent('download_prompt_shown', 'conversion', detectedOS ?? 'unknown');
    }, DOWNLOAD_PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [authLoading, user, hasDownloaded, showProfilePrompt, detectedOS]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsSyncing(true);
      setDataReady({ user: false, sub: false, usage: false, activity: false });

      try {
        const result = await refreshAllData(user.uid);
        if (result.user) setDataReady(prev => ({ ...prev, user: true }));
        if (result.subscription) setDataReady(prev => ({ ...prev, sub: true }));
        if (result.usage) setDataReady(prev => ({ ...prev, usage: true }));
        setActivity(result.activity);
        setDataReady(prev => ({ ...prev, activity: true }));
      } catch (err) {
        console.error('[dashboard] failed to load data:', err);
        setDataReady({ user: true, sub: true, usage: true, activity: true });
      } finally {
        setIsSyncing(false);
      }
    };

    loadData();
  }, [user?.uid]);

  const handleGotOffer = async () => {
    if (!user || referralLoading) return;
    setReferralLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/referral/me', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code && data.link) setReferralInfo({ code: data.code, link: data.link, reward: data.reward });
      }
    } catch { /* referral share is a bonus — never block the confirmation */ }
    setReferralLoading(false);
    localStorage.setItem('javihai_offer_confirmed', 'true');
    setOfferConfirmed(true);
  };

  const handleRefresh = async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await refreshAllData(user.uid, { force: true });
      setActivity(result.activity);
      if (result.user) setDataReady(prev => ({ ...prev, user: true }));
      if (result.subscription) setDataReady(prev => ({ ...prev, sub: true }));
      if (result.usage) setDataReady(prev => ({ ...prev, usage: true }));
      setDataReady(prev => ({ ...prev, activity: true }));
    } catch {
      console.error('[dashboard] refresh failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadMyTickets = async () => {
    if (!user) return;
    setTicketsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/support/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) { const d = await res.json(); setMyTickets(d.tickets || []); }
    } catch { /* silent */ }
    setTicketsLoading(false);
  };

  const toggleCancel = async (cancel: boolean) => {
    if (!user || cancelBusy) return;
    setCancelBusy(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, cancel }),
      });
      if (res.ok) {
        dispatch(setSubAction({ ...(subData || {}), cancelAtPeriodEnd: cancel } as any));
      }
    } catch { /* silent */ }
    setCancelBusy(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      clearAllData();
      router.push('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
  }, [searchParams]);

  // Mac's variant is an architecture choice (arm64 default, x64 opt-in).
  // Windows' variant is between two permanent, independently-offered
  // binaries — the installer (default, auto-updates) and the portable exe
  // (opt-in, no install/auto-update) — not an arch choice.
  const handleDownload = async (platform: 'windows' | 'mac', variant?: 'x64' | 'portable') => {
    if (!user) return;
    localStorage.setItem('javihai_downloaded', 'true');
    setHasDownloaded(true);
    setShowDownloadPrompt(false);
    // Both tabs opened synchronously (before any await) so popup blockers
    // still see them as a direct result of the click, not unsolicited popups.
    const newTab = window.open('', '_blank');
    const waTab = window.open('', '_blank');
    const token = await user.getIdToken();
    setDownloadToken(token);
    const base = platform === 'windows' ? WINDOWS_DOWNLOAD_URL : MAC_DOWNLOAD_URL;
    const queryKey = platform === 'mac' ? 'arch' : 'variant';
    const url = withToken(variant ? `${base}?${queryKey}=${variant}` : base, token);
    if (newTab) newTab.location.href = url;
    else window.open(url, '_blank', 'noopener');

    // Real-time sales visibility for the team — a pre-filled WhatsApp message
    // the visitor still has to press Send on (no outbound automation exists;
    // Twilio/Meta template approval is a separate, still-blocked effort).
    const waLink = buildWhatsAppLink(`Hi! I just downloaded JavihAI for ${platform}${variant ? ` (${variant})` : ''} — ${user.email ?? ''}`);
    if (waLink) {
      if (waTab) waTab.location.href = waLink;
      else window.open(waLink, '_blank', 'noopener');
    } else {
      waTab?.close();
    }

    setModalOS(platform);
    setShowDownloadModal(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const rawPlan = userData?.plan || 'free';
  const plan = migratePlanId(rawPlan) as PlanId;
  const planConfig = getPlanById(plan) || PLANS[0];
  // Three visual steps, but only two honest, independently-verifiable
  // signals — "installed & opened" can't be observed from the browser
  // (nothing on the desktop side reports back to this localStorage), so
  // step 2 rides along with step 3 rather than faking its own checkmark.
  // "First session" comes from real Firestore session counts instead.
  const hasFirstSession = activity.totalSessions > 0;
  const onboardingStepsDone = hasFirstSession ? 3 : hasDownloaded ? 1 : 0;
  const onboardingPercent = (onboardingStepsDone / 3) * 100;

  return (
    <>
      {showProfilePrompt && user && (
        <CompleteProfileModal
          user={user}
          onDone={(saved) => {
            setShowProfilePrompt(false);
            if (saved) dispatch(setUser({ ...(userData || {}), ...saved } as any));
          }}
          initial={{
            phone: userData?.phone,
            fullName: userData?.fullName || user.displayName || '',
            whatsapp: userData?.whatsapp || userData?.phone || '',
            experienceLevel: userData?.experienceLevel,
            city: userData?.city,
            jobRole: userData?.jobRole,
            referralSource: userData?.referralSource,
          }}
        />
      )}

      <DownloadStepsModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        os={modalOS}
        onSwitchOS={setModalOS}
        downloadUrl={downloadToken ? withToken(modalOS === 'windows' ? WINDOWS_DOWNLOAD_URL : MAC_DOWNLOAD_URL, downloadToken) : (modalOS === 'windows' ? WINDOWS_DOWNLOAD_URL : MAC_DOWNLOAD_URL)}
      />

      <DownloadPromptModal
        open={showDownloadPrompt}
        onClose={() => { setShowDownloadPrompt(false); trackEvent('download_prompt_dismissed', 'conversion'); }}
        os={detectedOS}
        appVersion={appVersion}
        onDownload={(platform) => { trackEvent('download_prompt_clicked', 'conversion', platform); handleDownload(platform); }}
      />

      <AudioDiagnosticModal
        isOpen={showAudioDiag}
        onClose={() => setShowAudioDiag(false)}
      />

      {showSuccessBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="glass-heavy rounded-xl p-4 border border-green-500/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">✓</div>
            <div>
              <div className="font-semibold text-white">Welcome to {planConfig.name}! 🎉</div>
              <div className="text-sm text-slate-400">Your account has been upgraded successfully.</div>
            </div>
          </div>
        </div>
      )}

      <section className="pt-12 sm:pt-16 md:pt-20 pb-12 min-h-screen">
        <div className="max-w-6xl mx-auto px-6">

          {/* ==================== IDENTITY ==================== */}
          <div className="card flex items-center justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white flex-shrink-0">
                {(userData?.name || userData?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              {!dataReady.user ? (
                <div className="animate-pulse space-y-1.5">
                  <div className="h-3.5 bg-white/5 rounded w-28"></div>
                  <div className="h-3 bg-white/5 rounded w-36"></div>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-sm text-white leading-tight">{userData?.name || userData?.fullName || 'Welcome'}</div>
                  <div className="text-xs text-slate-400">{userData?.email || user?.email}</div>
                </div>
              )}
            </div>

            {!dataReady.user || !dataReady.sub ? (
              <div className="animate-pulse flex items-center gap-3">
                <div className="h-6 bg-white/5 rounded-full w-24"></div>
                <div className="h-8 bg-white/5 rounded-lg w-28"></div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="badge text-xs">{planConfig.emoji} {planConfig.name}</span>
                {subData?.planType === 'one-time' && subData.hoursRemaining !== undefined && !planConfig.isUnlimited && (
                  <span className="text-xs text-indigo-300">{subData.hoursRemaining > 0 ? `${subData.hoursRemaining.toFixed(1)}h left` : 'Hours exhausted'}</span>
                )}
                {subData?.planType === 'one-time' && planConfig.isUnlimited && subData.expiresAt && (
                  <span className="text-xs text-indigo-300">{Date.now() < subData.expiresAt ? `Expires ${new Date(subData.expiresAt).toLocaleDateString()}` : 'Expired'}</span>
                )}
                <span className="text-xs text-slate-400">
                  <span className="text-white font-semibold">{userData?.createdAt ? Math.max(1, Math.floor((Date.now() - userData.createdAt) / 86400000)) : 1}</span> days as member
                </span>
                {plan === 'free' ? (
                  <Link href="/pricing" className="btn btn-primary text-xs px-4 py-2">Upgrade →</Link>
                ) : subData?.planType === 'one-time' && !planConfig.isUnlimited && (subData.hoursRemaining ?? 0) <= 0 ? (
                  <Link href="/pricing" className="btn btn-primary text-xs px-4 py-2">Buy Hours →</Link>
                ) : (
                  <Link href="/pricing" className="btn btn-secondary text-xs px-4 py-2">Manage Plan</Link>
                )}
              </div>
            )}
          </div>

          {/* ==================== PRIMARY FOCUS ==================== */}
          <div className="card card-glow bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 mb-6">
            {!hasFirstSession ? (
                <>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="badge text-xs">🚀 Quick Onboarding &amp; Setup</div>
                    <div className="text-xs text-slate-400 font-medium">{onboardingStepsDone}/3 steps completed</div>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black mb-2 text-white">
                    3 steps to your first <span className="text-gradient">AI-assisted</span> interview
                  </h1>
                  <p className="text-xs text-slate-400 mb-4">
                    Follow these 3 quick steps to install JavihAI on your desktop and run your first session.
                  </p>

                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${onboardingPercent}%` }}></div>
                  </div>

                  <div className="space-y-3.5">
                    {/* Step 1: Download */}
                    <div className={`p-4 rounded-xl border transition-all ${hasDownloaded ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${hasDownloaded ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
                            {hasDownloaded ? '✓' : '1'}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white">{hasDownloaded ? 'Step 1: Download Completed' : 'Step 1: Download JavihAI Desktop App'}</span>
                            <div className="text-xs text-slate-400">Choose your operating system below</div>
                          </div>
                        </div>
                        {hasDownloaded && <span className="text-xs font-bold text-green-400 bg-green-500/15 px-2.5 py-1 rounded-full border border-green-500/20">Ready to Install</span>}
                      </div>

                      <div className="pl-9 mt-2">
                        {detectedOS === null && (
                          <div className="mb-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-slate-300">
                            <div className="font-bold text-indigo-300 flex items-center gap-1 mb-1">
                              📱 On a mobile phone or tablet?
                            </div>
                            <div>
                              JavihAI is a desktop app for <strong className="text-white">Windows & Mac</strong>. Open <strong className="text-white">javihai.in/dashboard</strong> on your computer to run the installer, or send yourself the link:
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <button
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText('https://javihai.in/dashboard');
                                    alert('Copied link: https://javihai.in/dashboard\nPaste this on your computer browser!');
                                  }
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-medium border border-slate-700"
                              >
                                📋 Copy Link for PC
                              </button>
                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Open this link on your PC to download JavihAI:\nhttps://javihai.in/dashboard')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 rounded text-[11px] font-medium border border-emerald-500/30"
                              >
                                💬 Send to WhatsApp
                              </a>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <button onClick={() => handleDownload('windows')} className={`btn ${detectedOS === 'mac' ? 'btn-secondary' : 'btn-primary shadow-md'}`}>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                            ⬇ Download for Windows {appVersion ? `(${appVersion})` : ''}
                          </button>
                          <button onClick={() => handleDownload('mac')} className={`btn ${detectedOS === 'mac' ? 'btn-primary shadow-md' : 'btn-secondary'}`}>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/></svg>
                            ⬇ Download for Mac {appVersion ? `(${appVersion})` : ''}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-slate-400">
                          {winPortableAvailable && (
                            <button onClick={() => handleDownload('windows', 'portable')} className="text-indigo-300 hover:underline font-medium">
                              Windows Portable .exe (No Install)
                            </button>
                          )}
                          {winPortableAvailable && <span>&middot;</span>}
                          <button onClick={() => handleDownload('mac', 'x64')} className="text-indigo-300 hover:underline font-medium">
                            Mac Intel x64 .dmg
                          </button>
                          <span>&middot;</span>
                          <Link href="/install" className="text-slate-400 hover:text-slate-200 underline underline-offset-2 font-medium">
                            Full Install Guide &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Install & sign in */}
                    <div className={`p-4 rounded-xl border transition-all ${hasDownloaded ? 'bg-white/5 border-indigo-500/30' : 'bg-white/[0.02] border-white/5 opacity-75'}`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-indigo-500/20 text-indigo-300">2</div>
                        <div>
                          <span className="text-sm font-bold text-white">Step 2: Install &amp; Grant Permissions</span>
                          <div className="text-xs text-slate-400">Run file &rarr; Allow security prompt &rarr; Sign in</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-9 mb-3">
                        Run the downloaded installer. On <strong className="text-white">Windows</strong>, if SmartScreen appears, click <strong className="text-white">&quot;More info &rarr; Run anyway&quot;</strong>. On <strong className="text-white">Mac</strong>, right-click &rarr; <strong className="text-white">&quot;Open&quot;</strong> and grant <strong className="text-white">Screen Recording</strong> permission for audio capture.
                      </p>
                      
                      <div className="pl-9 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setActiveVideo('uEDFnlf1hiw');
                            setVideoFilter('windows');
                            document.getElementById('video-tutorials')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-all cursor-pointer"
                        >
                          ▶ Watch Windows Setup Video
                        </button>
                        <button
                          onClick={() => {
                            setActiveVideo('LvCAOrlH8zs');
                            setVideoFilter('mac');
                            document.getElementById('video-tutorials')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-all cursor-pointer"
                        >
                          ▶ Watch Mac Setup Video
                        </button>
                      </div>

                      {showInstallHelp && (
                        <div className="mt-3 ml-9 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">🤔</span>
                            <p className="text-xs text-slate-300 max-w-sm">Need assistance? Check the video guides below or message us on WhatsApp.</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link href="/install" className="btn btn-secondary text-xs px-3 py-1.5">Install Guide</Link>
                            <button
                              onClick={() => {
                                setShowInstallHelp(false);
                                setShowSupport(true);
                                const waLink = buildWhatsAppLink('Hi! I need help installing JavihAI.');
                                if (waLink) window.open(waLink, '_blank', 'noopener');
                              }}
                              className="btn btn-primary text-xs px-3 py-1.5"
                            >
                              Get Help
                            </button>
                            <button onClick={() => setShowInstallHelp(false)} className="text-slate-500 hover:text-white text-lg px-1" aria-label="Dismiss">✕</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 3: First session */}
                    <div className="p-4 rounded-xl border bg-white/[0.02] border-white/5 opacity-75">
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-white/10 text-slate-400">3</div>
                        <div>
                          <span className="text-sm font-bold text-white">Step 3: Join Your Call &amp; Stream AI Answers</span>
                          <div className="text-xs text-slate-400">Works on Zoom, Google Meet &amp; Teams</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed pl-9">
                        Sign into the desktop app with <strong className="text-white">{user?.email}</strong>. Select <strong className="text-white">System Audio</strong> mode, join your call, and press <strong className="text-white">Start</strong> or press <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-[11px] font-mono">Alt</kbd>/<kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-[11px] font-mono">⌥</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-[11px] font-mono">L</kbd> to listen.
                      </p>
                    </div>

                    {/* Interactive Live Demo Preview */}
                    <div id="live-demo-section" className="pt-4 border-t border-white/10 mt-4 scroll-mt-24">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <span>🎮</span> Practice Live Simulator Before Your Call
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowAudioDiag(true)}
                            className="text-[11px] font-semibold text-teal-300 hover:text-white bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 rounded-lg border border-teal-500/30 transition-colors flex items-center gap-1.5"
                          >
                            <span>🎧</span> Test Mic &amp; Audio
                          </button>
                          <span className="text-[10px] text-slate-400">No download required</span>
                        </div>
                      </div>
                      <LiveGuideModeDemo compact appVersion={appVersion} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Returning-user view (hasFirstSession) replaces the whole
                      "3 steps to get started" card above, INCLUDING its
                      download step — meaning download disappeared from the
                      dashboard entirely once someone had a real session. A
                      new machine, a wiped OS, or an accidental uninstall all
                      leave that user with no obvious way back to the binary
                      from here; they'd have to already know about /install.
                      Small, always-visible link instead of repeating the
                      full step-1 card (this audience already knows how to
                      install — they just need the file again). */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-5 pb-4 border-b border-white/5">
                    <span className="text-xs text-slate-500">Need it on another computer, or reinstalling?</span>
                    <div className="flex items-center gap-1 -mx-2">
                      {/* py-2 -mx-2 combo: the text stays visually the same
                          small link, but the actual tappable area grows to a
                          comfortable touch target instead of matching the
                          16px text line-height (measured live at 320px —
                          confirmed this is the ONLY redownload path for a
                          returning user, worth a real hit-area, not just
                          matching the existing zero-padding text-link style
                          elsewhere on this page). */}
                      <button onClick={() => handleDownload('windows')} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-2">
                        ⬇ Windows {appVersion ? `(${appVersion})` : ''}
                      </button>
                      <button onClick={() => handleDownload('mac')} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-2">
                        ⬇ Mac {appVersion ? `(${appVersion})` : ''}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-5 flex-wrap">
                    {!dataReady.activity ? (
                      <div className="animate-pulse flex gap-6">
                        <div className="h-9 w-20 bg-white/5 rounded"></div>
                        <div className="h-9 w-20 bg-white/5 rounded"></div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="text-xl font-black text-white leading-none">{activity.totalQuestions}</div>
                          <div className="text-xs text-slate-400 mt-1">Questions practiced</div>
                        </div>
                        <div>
                          <div className="text-xl font-black text-white leading-none">{activity.totalSessions}</div>
                          <div className="text-xs text-slate-400 mt-1">Interview sessions</div>
                        </div>
                      </>
                    )}
                  </div>

                  {plan === 'free' && usageData ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold">📊 Today&apos;s Usage</h3>
                          <div className="text-[11px] text-slate-400">Resets daily at 12:00 AM IST (Midnight)</div>
                        </div>
                        <button onClick={handleRefresh} disabled={isSyncing} className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                          {isSyncing ? 'Refreshing…' : '↻ Refresh'}
                        </button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6 mb-6">
                        {[
                          { label: 'AI Answers', used: Math.min(usageData.tokensUsed / 500, 3), total: 3 },
                          { label: 'Voice Minutes', used: usageData.voiceMinutes, total: 5 },
                          { label: 'Screenshots', used: usageData.screenshotsUsed, total: 2 },
                        ].map((stat, i) => {
                          const percent = Math.min((stat.used / stat.total) * 100, 100);
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">{stat.label}</span>
                                <span className="text-xs text-slate-500">{Math.round(stat.used)}/{stat.total}</span>
                              </div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <h4 className="font-bold text-white mb-0.5">Need unlimited access?</h4>
                            <p className="text-sm text-slate-300">Upgrade for unlimited answers, voice mode, and screen analysis</p>
                          </div>
                          <Link href="/pricing" className="btn btn-primary">See Plans →</Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-bold mb-4">✨ Your Premium Benefits</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: '🎯', label: 'Full AI Access', desc: 'No daily limits' },
                          { icon: '🎤', label: 'Voice Mode', desc: 'Interview practice' },
                          { icon: '💻', label: 'Screen Mode', desc: 'Invisible overlay' },
                          { icon: plan === 'power' ? '⚡' : '🚀', label: plan === 'power' ? 'Unlimited Power' : '7 Days Unlimited', desc: plan === 'power' ? 'Unlimited everything' : '7 days full access' },
                        ].map((b, i) => (
                          <div key={i} className="card text-center">
                            <div className="text-3xl mb-2">{b.icon}</div>
                            <div className="font-bold text-white text-sm mb-1">{b.label}</div>
                            <div className="text-xs text-slate-400">{b.desc}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

          {/* ==================== PRE-INTERVIEW AUDIO & MIC READINESS CARD ==================== */}
          <div className="card mb-6 border border-teal-500/30 bg-teal-950/20 backdrop-blur-sm p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-2xl shrink-0">
                  🎧
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20 mb-1.5">
                    Pre-Interview Readiness Check
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Test Your Microphone &amp; Speaker Audio Before Your Live Call
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Verify that your microphone volume levels are reactive, check speaker clarity with a sample interviewer question, and review OS loopback permissions so you enter your interview with 100% confidence.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setShowAudioDiag(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>Launch Audio Diagnostic Tool</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================== TOP INDIAN TECH COMPANY PREP PACKS ==================== */}
          <div className="mb-6">
            <CompanyPrepPacks
              onSelectQuestion={() => {
                const demoEl = document.getElementById('live-demo-section');
                if (demoEl) {
                  demoEl.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }
              }}
            />
          </div>

          {/* ==================== VIDEO INSTALLATION & SETUP GUIDES ==================== */}
          <div id="video-tutorials" className="card card-glow mb-6 border border-indigo-500/20 bg-indigo-950/20 scroll-mt-24">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="badge text-xs mb-1">🎬 Video Tutorials</div>
                <h2 className="text-lg font-bold text-white">Watch Installation &amp; Setup Guides</h2>
                <p className="text-xs text-slate-400 mt-0.5">Step-by-step video instructions for Windows, Mac, and product features</p>
              </div>
              <Link href="/install" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                Full Setup Guide &rarr;
              </Link>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Videos' },
                { id: 'windows', label: '🪟 Windows Setup' },
                { id: 'mac', label: '🍎 macOS Setup' },
                { id: 'overview', label: '🚀 Product Overview' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVideoFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    videoFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                  {detectedOS === tab.id && (
                    <span className="text-[10px] bg-indigo-400/20 px-1.5 py-0.5 rounded-full text-indigo-200 ml-1.5 font-normal">
                      Your OS
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  id: 'QeZDYWtKnsY',
                  category: 'overview',
                  title: 'Full Product Walkthrough',
                  tag: '🚀 Product Overview',
                  desc: 'See JavihAI in action during live calls, screenshot solving, and Desi Mode.',
                },
                {
                  id: 'uEDFnlf1hiw',
                  category: 'windows',
                  title: 'Windows 10/11 Setup Guide',
                  tag: '🪟 Windows Setup',
                  desc: 'Step-by-step video to download, run installer, and bypass SmartScreen.',
                },
                {
                  id: 'LvCAOrlH8zs',
                  category: 'mac',
                  title: 'macOS Installation & Permissions',
                  tag: '🍎 macOS Setup',
                  desc: 'Complete guide for Mac Applications drag, Gatekeeper, and Screen Recording.',
                },
              ]
                .filter((v) => videoFilter === 'all' || v.category === videoFilter)
                .map((v) => (
                  <div key={v.id} className="bg-slate-950/80 rounded-xl p-3.5 border border-white/10 flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                    <div>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 mb-3 border border-white/5">
                        {activeVideo === v.id ? (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=1&playsinline=1`}
                            title={v.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveVideo(v.id)}
                            className="w-full h-full relative block text-left focus:outline-none group/player cursor-pointer"
                            aria-label={`Play ${v.title}`}
                          >
                            <img
                              src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                              alt={v.title}
                              className="w-full h-full object-cover opacity-80 group-hover/player:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 group-hover/player:bg-slate-950/20 transition-colors flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover/player:scale-110 transition-transform">
                                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                      <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-1.5">
                        {v.tag}
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {v.desc}
                      </p>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Watch on YouTube &rarr;
                    </a>
                  </div>
                ))}
            </div>
          </div>

          {/* ==================== GOT THE OFFER? (referral) ==================== */}
          {/* Only shown to users who've actually had a real session — asking
              a brand-new signup "how did it go?" makes no sense. Purely
              opt-in: nothing here is inferred from usage, the user has to
              click to say it happened. */}
          {hasFirstSession && !offerConfirmed && (
            <div className="card mb-4 border-green-500/20 bg-green-500/5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="font-bold text-white mb-0.5">How did your interview go?</h4>
                  <p className="text-sm text-slate-400">Got the offer? Share JavihAI and you both get credit.</p>
                </div>
                <button onClick={handleGotOffer} disabled={referralLoading} className="btn btn-primary disabled:opacity-50">
                  {referralLoading ? 'Loading…' : '🎉 I got the offer!'}
                </button>
              </div>
            </div>
          )}
          {referralInfo && (
            <div className="card mb-4 border-green-500/30 bg-green-500/5">
              <h4 className="font-bold text-white mb-1">🎉 Congrats! Share your referral link</h4>
              <p className="text-sm text-slate-400 mb-3">
                When a friend upgrades to a paid plan using your link, you both get ₹{referralInfo.reward} account credit.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="flex-1 min-w-[200px] text-xs text-indigo-300 bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 break-all">
                  {referralInfo.link}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(referralInfo.link).catch(() => {});
                    setReferralCopied(true);
                    setTimeout(() => setReferralCopied(false), 2000);
                  }}
                  className="btn btn-secondary text-sm"
                >
                  {referralCopied ? '✓ Copied' : 'Copy link'}
                </button>
              </div>
            </div>
          )}

          {/* ==================== EXPLORE ==================== */}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Explore</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <Link href="/resume" className="card flex items-center gap-3 hover:border-purple-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl flex-shrink-0">📄</div>
              <div>
                <div className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors">Resume Builder</div>
                <div className="text-xs text-slate-400">ATS-ready in seconds</div>
              </div>
            </Link>
            <Link href="/jobs" className="card flex items-center gap-3 hover:border-green-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-xl flex-shrink-0">💼</div>
              <div>
                <div className="font-semibold text-sm text-white group-hover:text-green-300 transition-colors">Job Recommendations</div>
                <div className="text-xs text-slate-400">Top tech jobs</div>
              </div>
            </Link>
            <Link href="/install" className="card flex items-center gap-3 hover:border-blue-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-xl flex-shrink-0">📖</div>
              <div>
                <div className="font-semibold text-sm text-white group-hover:text-blue-300 transition-colors">Installation Guide</div>
                <div className="text-xs text-slate-400">Step-by-step setup</div>
              </div>
            </Link>
          </div>

          <div className="card mb-6">
            <h3 className="text-sm font-bold mb-3">💬 Support</h3>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  setShowSupport(true);
                  const waLink = buildWhatsAppLink('Hi! I need help with JavihAI.');
                  if (waLink) window.open(waLink, '_blank', 'noopener');
                }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all text-center"
              >
                <WhatsAppIcon className="w-6 h-6 mb-1 mx-auto" />
                <div className="text-xs font-semibold">WhatsApp</div>
              </button>
              <button onClick={() => { setShowSupport(true); setSupportTab('new'); setTicketCategory('technical'); }} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all text-center">
                <div className="text-xl mb-1">🐛</div>
                <div className="text-xs font-semibold">Report Bug</div>
              </button>
              <button onClick={() => { setShowSupport(true); setSupportTab('history'); loadMyTickets(); }} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all text-center">
                <div className="text-xl mb-1">📋</div>
                <div className="text-xs font-semibold">My Tickets</div>
              </button>
            </div>
          </div>

          {/* ==================== DESKTOP APP TUTORIAL ==================== */}
          <details key={dataReady.activity ? 'ready' : 'pending'} open={!hasFirstSession} id="how-to-use" className="card mb-6 scroll-mt-24">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold inline">📖 How to Use the Desktop App</h2>
                <p className="text-xs text-slate-400 mt-0.5">A 60-second walkthrough + keyboard shortcuts</p>
              </div>
              <Link href="/install" onClick={(e) => e.stopPropagation()} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex-shrink-0">
                Full setup guide →
              </Link>
            </summary>

            <div className="grid md:grid-cols-4 gap-3 mb-6">
              {[
                { n: '1', icon: '🔑', title: 'Sign in', desc: 'Open JavihAI and sign in with this account.' },
                { n: '2', icon: '🎧', title: 'Pick your audio', desc: 'Choose System Audio to hear the interviewer, or Mic to speak questions yourself.' },
                { n: '3', icon: '🎥', title: 'Join your call', desc: 'Start Zoom, Meet, or Teams as usual — JavihAI stays invisible on screen share.' },
                { n: '4', icon: '⚡', title: 'Get answers', desc: 'Questions are auto-detected and answered in under 2 seconds. No typing needed.' },
              ].map((step) => (
                <div key={step.n} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0">{step.n}</span>
                    <span className="text-lg">{step.icon}</span>
                  </div>
                  <div className="font-semibold text-sm text-white mb-0.5">{step.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{step.desc}</div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="text-xs text-slate-400 mb-3 font-medium">⌨️ Key shortcuts — Windows: Alt · Mac: ⌥ Option</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  { label: 'Start / stop listening', keys: 'Alt/⌥ + L' },
                  { label: 'Switch mic ↔ system audio', keys: 'Alt/⌥ + M' },
                  { label: 'Analyze screen (Screenshot Solve)', keys: 'Alt/⌥ + A' },
                  { label: 'Show / hide overlay — works anywhere', keys: 'Alt/⌥ + H' },
                  { label: 'Restore after screen share', keys: 'Alt/⌥ + Shift + S' },
                  { label: 'All shortcuts (inside the app)', keys: 'Alt/⌥ + /' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/[0.03]">
                    <span className="text-xs text-slate-300">{row.label}</span>
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-[11px] font-mono whitespace-nowrap">{row.keys}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* ==================== SUPPORT TICKETS ==================== */}
          {showSupport && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">💬 Support Tickets</h2>
                <button onClick={() => setShowSupport(false)} className="text-slate-400 hover:text-white text-xl px-2">✕</button>
              </div>
              <div className="flex gap-2 mb-5 border-b border-white/10 pb-3">
                <button onClick={() => setSupportTab('new')} className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${supportTab === 'new' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}>New Ticket</button>
                <button onClick={() => { setSupportTab('history'); loadMyTickets(); }} className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${supportTab === 'history' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}>My Tickets</button>
              </div>
              {supportTab === 'new' && (
                ticketStatus === 'sent' ? (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-green-400 font-semibold">Ticket submitted!</p>
                    <p className="text-slate-400 text-sm mt-1">We&apos;ll reply to {user?.email} within 24 hours.</p>
                    <button onClick={() => { setTicketStatus(''); setSupportTab('history'); loadMyTickets(); }} className="mt-4 text-indigo-400 text-sm hover:text-indigo-300">View my tickets →</button>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user || !ticketTitle.trim() || !ticketDesc.trim()) return;
                    setTicketSending(true);
                    try {
                      const idToken = await user.getIdToken();
                      const res = await fetch('/api/support/ticket', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken, title: ticketTitle.trim(), description: ticketDesc.trim(), category: ticketCategory }),
                      });
                      if (res.ok) { setTicketStatus('sent'); setTicketTitle(''); setTicketDesc(''); }
                      else setTicketStatus('error');
                    } catch { setTicketStatus('error'); }
                    setTicketSending(false);
                  }} className="space-y-4">
                    <input type="text" placeholder="Subject / Title" required value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                    <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing / Payment</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="other">Other</option>
                    </select>
                    <textarea placeholder="Describe your issue in detail…" required rows={4} value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
                    {ticketStatus === 'error' && <p className="text-red-400 text-sm">⚠ Failed to submit. Try again.</p>}
                    <button type="submit" disabled={ticketSending} className="w-full btn btn-primary disabled:opacity-50">{ticketSending ? 'Submitting…' : 'Submit Ticket →'}</button>
                  </form>
                )
              )}
              {supportTab === 'history' && (
                ticketsLoading ? <p className="text-slate-400 text-sm text-center py-6">Loading…</p> : myTickets.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm">No tickets yet.</p>
                    <button onClick={() => setSupportTab('new')} className="mt-2 text-indigo-400 text-sm hover:text-indigo-300">Submit your first ticket →</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTickets.map((t) => {
                      const hasAdminReply = t.messages.some(m => m.senderType === 'admin');
                      const isExpanded = expandedTicket === t.id;
                      const statusColor = t.status === 'resolved' ? 'text-green-400' : t.status === 'in-progress' ? 'text-yellow-400' : 'text-indigo-400';
                      return (
                        <div key={t.id} className="border border-white/10 rounded-xl overflow-hidden">
                          <button onClick={() => setExpandedTicket(isExpanded ? null : t.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left">
                            <div>
                              <span className="text-white text-sm font-semibold">{t.title}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs font-semibold ${statusColor}`}>{t.status.replace('-',' ')}</span>
                                {hasAdminReply && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Reply received</span>}
                              </div>
                            </div>
                            <span className="text-slate-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                              {t.messages.map((m, i) => (
                                <div key={i} className={`flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.senderType === 'admin' ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-100' : 'bg-white/5 border border-white/10 text-slate-300'}`}>
                                    <div className="text-xs text-slate-500 mb-1">{m.senderType === 'admin' ? '🛡 JavihAI Support' : '👤 You'} · {new Date(m.timestamp).toLocaleString()}</div>
                                    <p className="whitespace-pre-wrap">{m.message}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={loadMyTickets} className="text-slate-500 text-xs hover:text-slate-400 w-full text-center pt-1">↻ Refresh</button>
                  </div>
                )
              )}
            </div>
          )}

          {/* ==================== ACCOUNT & BILLING ==================== */}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Account &amp; Billing</h3>

          {subData && (
            <div className="card mb-4">
              <h3 className="font-bold mb-4">🧾 Subscription &amp; Billing</h3>
              {!dataReady.sub ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-white/5 rounded w-32"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-16 bg-white/5 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Status</div>
                      <div className="inline-flex items-center gap-2 text-green-400 font-semibold text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        {subData.status === 'active' ? 'Active' : subData.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Billing</div>
                      <div className="text-white font-semibold text-sm capitalize">{subData.billing || 'One-time'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Amount</div>
                      <div className="text-white font-semibold text-sm">{subData.amount ? `₹${subData.amount}` : '—'}</div>
                    </div>
                    {planConfig.billingType === 'subscription' && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Renews On</div>
                        <div className="text-white font-semibold text-sm">
                          {subData.renewalDate ? new Date(subData.renewalDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    )}
                    {planConfig.billingType === 'one_time' && !planConfig.isUnlimited && subData.hoursRemaining !== undefined && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Hours Left</div>
                        <div className="text-white font-semibold text-sm">{subData.hoursRemaining.toFixed(1)}h</div>
                      </div>
                    )}
                    {planConfig.billingType === 'one_time' && planConfig.isUnlimited && subData.expiresAt && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Expires On</div>
                        <div className="text-white font-semibold text-sm">{new Date(subData.expiresAt).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                  {subData.paymentId && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                      <div className="text-xs text-slate-500 font-mono">Payment ID: {subData.paymentId}</div>
                      <Link href="/pricing" className="text-indigo-400 text-sm font-semibold">Change Plan →</Link>
                    </div>
                  )}
                  {planConfig.billingType === 'subscription' && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      {subData.cancelAtPeriodEnd ? (
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <p className="text-sm text-yellow-300">⏳ Won&apos;t renew. Access until {subData.renewalDate ? new Date(subData.renewalDate).toLocaleDateString() : 'period ends'}.</p>
                          <button onClick={() => toggleCancel(false)} disabled={cancelBusy} className="text-indigo-400 text-sm font-semibold disabled:opacity-50">
                            {cancelBusy ? 'Working…' : 'Resume plan'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <p className="text-sm text-slate-500">Cancel anytime — access until renewal date.</p>
                          <button onClick={() => toggleCancel(true)} disabled={cancelBusy} className="text-slate-400 hover:text-red-400 text-sm font-semibold disabled:opacity-50">
                            {cancelBusy ? 'Working…' : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">⚙️ Account Details</h2>
              <button onClick={handleRefresh} disabled={isSyncing} className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                {isSyncing ? 'Refreshing…' : '↻ Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Email', value: userData?.email || user?.email },
                { label: 'Name', value: userData?.name || userData?.fullName || 'Not set' },
                { label: 'WhatsApp', value: userData?.whatsapp || userData?.phone || 'Not set' },
                { label: 'Job Role', value: userData?.jobRole || 'Not set' },
                { label: 'Experience', value: userData?.experienceLevel || 'Not set' },
                { label: 'City', value: userData?.city || 'Not set' },
                { label: 'Member Since', value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '-' },
                { label: 'How did you hear about us?', value: userData?.referralSource || userData?.acquisition?.customerSelectedSource || 'Not set' },
                { label: 'User ID', value: user?.uid?.slice(0, 16) + '...' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                  <div className="text-white text-sm font-medium">{item.value}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowProfilePrompt(true)} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold mt-4">
              {isProfileComplete(userData) ? 'Edit details' : '+ Complete profile'}
            </button>
          </div>

        </div>
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
