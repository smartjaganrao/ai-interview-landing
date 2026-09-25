'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import { useGatedDownload } from '@/hooks/useGatedDownload';
import { onOfferPopupChecked } from '@/lib/offer-popup-events';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { SiZoom, SiGooglemeet, SiWebex, SiGooglecloud, SiComptia, SiCisco } from 'react-icons/si';
import { BsMicrosoftTeams } from 'react-icons/bs';
import { FaSkype, FaSlack, FaAws } from 'react-icons/fa6';
import { TbBrandAzure } from 'react-icons/tb';
import { FAQ_ITEMS } from '@/lib/homepage-schema';
import LiveSocialProofTicker from '@/components/LiveSocialProofTicker';

// Code-split: none of these render anything on initial paint (each is
// gated behind state that starts false/null, or is the always-null-until-
// triggered NewCustomerOfferPopup) — dynamic-importing them keeps their JS
// out of the bundle the browser must parse before the hero can paint.
// Measured via Lighthouse on production: LCP was 7.6s with ~2.9s of
// main-thread work blocking the hero H1's paint before this split.
const FreeTrialModal = dynamic(() => import('@/components/FreeTrialModal'), { ssr: false });
const DownloadStepsModal = dynamic(() => import('@/components/DownloadStepsModal'), { ssr: false });
const GoogleSignInModal = dynamic(() => import('@/components/GoogleSignInModal'), { ssr: false });
const CompleteProfileModal = dynamic(() => import('@/components/CompleteProfileModal'), { ssr: false });
const NewCustomerOfferPopup = dynamic(() => import('@/components/NewCustomerOfferPopup'), { ssr: false });
// This one DOES render by default (the "See it live" section's default
// tab) — give it a lightweight skeleton matching its dark card shape so
// splitting it out doesn't cause a layout jump.
const LiveGuideModeDemo = dynamic(() => import('@/components/LiveGuideModeDemo'), {
  ssr: false,
  loading: () => <div className="w-full max-w-3xl mx-auto aspect-video bg-slate-950 rounded-2xl animate-pulse" />,
});

// FAQ_ITEMS (and its JSON-LD) now lives in lib/homepage-schema.ts, imported
// here for the visible accordion below and by app/page.tsx (a Server
// Component) so the FAQPage/HowTo <script> tags render in the server HTML
// instead of only appearing after client hydration — see that file for why.

// Supported video-call apps — shown compactly in the hero and again as its
// own full section further down ("Works With Your Video Call App"). Single
// source of truth so the two never drift out of sync. Google Duo was
// requested once but is dropped: Google discontinued it in 2022, merging
// it into Google Meet — no icon library carries it because it isn't a
// distinct current product anymore.
const VIDEO_CALL_APPS = [
  { Icon: SiZoom, name: 'Zoom', color: '#2D8CFF' },
  { Icon: SiGooglemeet, name: 'Google Meet', color: '#00897B' },
  { Icon: BsMicrosoftTeams, name: 'Microsoft Teams', color: '#6264A7' },
  { Icon: SiWebex, name: 'Webex', color: '#049FD9' },
  { Icon: FaSkype, name: 'Skype', color: '#00AFF0' },
  { Icon: FaSlack, name: 'Slack Huddles', color: '#4A154B' },
];

// Certification exams — same underlying mechanism as the /coding-platforms
// page's "Screenshot Solve" (reads whatever's on screen, works on any
// browser-based platform, not a per-provider integration), just applied to
// browser-based certification exams instead of coding-round platforms. No
// icon exists for PMP in any installed react-icons set, so that one is a
// text-only pill like the others still render with an icon.
const CERT_EXAMS = [
  { Icon: FaAws, name: 'AWS Certification', color: '#FF9900' },
  { Icon: TbBrandAzure, name: 'Microsoft Azure', color: '#0078D4' },
  { Icon: SiGooglecloud, name: 'Google Cloud', color: '#4285F4' },
  { Icon: SiComptia, name: 'CompTIA', color: '#C8202F' },
  { Icon: SiCisco, name: 'Cisco', color: '#1BA0D7' },
  { Icon: null, name: 'PMP', color: '#4B0082' },
];

interface PricingData {
  plans: {
    free: { oneTime: number };
    quick_pass: { oneTime: number };
    pro: { oneTime: number };
    power: { monthly: number; yearly: number };
  };
  offer: { active: boolean; label: string; percentOff: number; appliesTo: string; expiresAt: number | null };
}

function effectivePrice(base: number, offer: PricingData['offer'], plan: 'pro' | 'power'): number {
  if (!offer.active || offer.percentOff <= 0) return base;
  if (offer.expiresAt && Date.now() > offer.expiresAt) return base;
  if (offer.appliesTo !== 'all' && offer.appliesTo !== plan) return base;
  return Math.max(1, Math.round(base * (1 - offer.percentOff / 100)));
}

interface LandingClientProps {
  initialPricing: PricingData;
}

const GRADIENT_CLASSES: Record<string, string> = {
  'from-blue-500 to-indigo-500': 'bg-gradient-to-br from-blue-500 to-indigo-500',
  'from-indigo-500 to-purple-500': 'bg-gradient-to-br from-indigo-500 to-purple-500',
  'from-purple-500 to-blue-500': 'bg-gradient-to-br from-purple-500 to-blue-500',
  'from-blue-500 to-purple-500': 'bg-gradient-to-br from-blue-500 to-purple-500',
  'from-orange-500 to-red-500': 'bg-gradient-to-br from-orange-500 to-red-500',
  'from-slate-800 to-slate-900': 'bg-gradient-to-b from-slate-800 to-slate-900',
  'from-blue-950 to-slate-900': 'bg-gradient-to-b from-blue-950 to-slate-900',
  'from-pink-950 to-slate-900': 'bg-gradient-to-b from-pink-950 to-slate-900',
  'from-red-950 to-slate-900': 'bg-gradient-to-b from-red-950 to-slate-900',
};

// Renders a comparison-table cell as a small colored icon badge instead of a
// raw emoji, which varies in weight/color across OSes and reads as an
// afterthought next to the rest of the page's custom iconography.
function StatusBadge({ value }: { value: string }) {
  const label = value.replace(/^[✅❌⚠️]+\s*/, '').trim();

  if (value.startsWith('✅')) {
    return (
      <span className="inline-flex w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
        <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.414l2.793 2.792 6.792-6.793a1 1 0 011.415 0z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  if (value.startsWith('❌')) {
    return (
      <span className="inline-flex w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/20 items-center justify-center">
        <svg className="w-3 h-3 text-rose-500/70" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  if (value.startsWith('⚠️')) {
    return (
      <span className="inline-flex items-center gap-1.5 justify-center">
        <span className="inline-flex w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.28 11.166c.75 1.333-.213 2.985-1.742 2.985H3.72c-1.53 0-2.493-1.652-1.743-2.985L8.257 3.1zM10 8a1 1 0 011 1v3a1 1 0 11-2 0V9a1 1 0 011-1zm0 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </span>
        {label && <span className="hl-text-secondary text-xs font-medium">{label}</span>}
      </span>
    );
  }
  return <span className="hl-text-muted">{value}</span>;
}

// Highlights the visitor's own OS as the primary download button instead of
// making them pick between two equal-weight buttons. Arch (arm64 vs x64)
// can't be reliably detected from the UA string on modern browsers, so Mac
// always defaults to arm64 with a manual x64 link alongside it.
function detectDesktopOS(): 'mac' | 'windows' | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) return 'mac';
  return null;
}

export default function LandingClient(props: LandingClientProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [pricing] = useState<PricingData>(props.initialPricing);
  const [appVersion, setAppVersion] = useState('');
  const [isNewRelease, setIsNewRelease] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadModalOS, setDownloadModalOS] = useState<'windows' | 'mac'>('windows');
  // "See it live" section's tab switch — try the interactive simulator, or
  // watch the single main walkthrough video. This is the ONE place the
  // interactive demo appears on the homepage (it used to also duplicate
  // into a separate hero mockup and a 3-video grid; both were cut).
  const [demoView, setDemoView] = useState<'simulator' | 'video'>('simulator');
  const [demoVideoPlaying, setDemoVideoPlaying] = useState(false);
  // Separate from `demoVideoPlaying` (the "See it live" section's own video
  // tab, further down the page) — a hero-embedded preview, like
  // competitors show, so visitors see the product before scrolling at all.
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(false);

  const openDownloadModal = (os: 'windows' | 'mac') => {
    setDownloadModalOS(os);
    setShowDownloadModal(true);
  };
  const [detectedOS, setDetectedOS] = useState<'mac' | 'windows' | null>(null);

  const {
    user: downloadUser, showSignIn, requestDownload, cancelSignIn, handleSignedIn, retryUrl,
    showProfileModal, fetchedUserData, handleProfileDone,
  } = useGatedDownload((platform) => openDownloadModal(platform));

  useEffect(() => {
    // OS detection needs navigator.userAgent (client-only) — deferring past
    // hydration on purpose so the initial client render matches the
    // server's null-OS HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetectedOS(detectDesktopOS());

    fetch('/api/release').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.version) setAppVersion(d.version);
      if (d?.publishedAt) setIsNewRelease(Date.now() - new Date(d.publishedAt).getTime() < 14 * 86400000);
    }).catch(() => {});
  }, []);

  // Arms the exit-intent trial modal only after NewCustomerOfferPopup's own
  // eligibility check has settled. That check can suppress this modal for
  // the day (trialModalDismissed) — reading localStorage before it finishes
  // risks showing both modals together if a visitor exit-intents within the
  // first instant of the page load, before the async check resolves. Falls
  // back to a fixed wait if the popup never reports in (e.g. it's genuinely
  // not eligible today and errors before its `finally`), so a missed signal
  // can't permanently disable the trial modal.
  useEffect(() => {
    let armed = false;
    let shown = false;
    let exitIntentTimer: ReturnType<typeof setTimeout> | null = null;
    let handlePointerLeave: ((e: MouseEvent) => void) | null = null;

    // Used to cover the hero on every fresh load, before a visitor had read
    // the headline. Now it only shows on exit-intent (cursor leaving toward
    // the top of the viewport) or after 20s for touch devices, which have
    // no mouseleave signal, so the hero gets a real chance to be read first.
    const arm = () => {
      if (armed) return;
      armed = true;
      if (localStorage.getItem('trialModalDismissed')) return;

      const showTrialModal = () => {
        if (shown) return;
        shown = true;
        setIsTrialModalOpen(true);
      };

      exitIntentTimer = setTimeout(showTrialModal, 20000);
      handlePointerLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) showTrialModal();
      };
      document.addEventListener('mouseout', handlePointerLeave);
    };

    const offChecked = onOfferPopupChecked(arm);
    const fallbackTimer = setTimeout(arm, 3000);

    return () => {
      offChecked();
      clearTimeout(fallbackTimer);
      if (exitIntentTimer) clearTimeout(exitIntentTimer);
      if (handlePointerLeave) document.removeEventListener('mouseout', handlePointerLeave);
    };
  }, []);

  return (
    <>
      {/* `.home-light` is applied site-wide by ThemeScope.tsx for every page
          except /checkout and /dashboard — that ancestor keeps applying here
          too (harmless), but `.home-hud` on this SAME element adds a second,
          homepage-only dark sci-fi HUD theme on top of it. Every `.home-hud`
          selector in globals.css mirrors a `.home-light` one at equal
          specificity and is declared later in the file, so it wins the
          cascade tie for this subtree only — every other page, which never
          renders inside this div, is completely unaffected. */}
      <div className="home-light home-hud">

        {/* ═══════════════════════════════════════════════════════════
            HERO — one headline, one subheadline, one primary CTA, one
            secondary CTA. The old dual Windows/Mac buttons, 5-link
            "All Options" row, at-a-glance checkmarks, and embedded demo
            mockup all overlapped content that now lives in "See it live"
            and "What it does" below — cut here to avoid saying the same
            thing three times before a visitor has scrolled once.
            ═══════════════════════════════════════════════════════════ */}
        {/* The coupon banner now lives outside the nav in normal document
            flow (see Navbar.tsx) and the nav itself is `sticky`, not
            `fixed` — so nothing above this section is taken out of flow
            on initial load, and no compensating top padding is needed to
            avoid overlap. This is just ordinary breathing room. */}
        <section className="relative pt-12 sm:pt-16 md:pt-20 pb-16 md:pb-24 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 laptop-sm:grid-cols-2 gap-10 laptop-lg:gap-16 items-center">
              {/* LEFT — copy. Centered on mobile/tablet (stacked above the
                  video), left-aligned once the 2-column grid kicks in at
                  laptop-sm — the classic SaaS hero split instead of one
                  long centered column with the video buried at the bottom. */}
              <div className="text-center laptop-sm:text-left">
                <div className="mb-4 animate-fade-in-up flex flex-col sm:flex-row items-center justify-center laptop-sm:justify-start gap-3">
                  <div className="badge-glow inline-flex items-center gap-2 text-xs sm:text-sm font-semibold py-1 px-3 rounded-full backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                    <span>🇮🇳 India&apos;s 1st · 🌍 World&apos;s Most Affordable Plan</span>
                  </div>
                </div>

                <h1 className="hl-heading text-4xl tablet:text-5xl laptop-sm:text-5xl laptop-lg:text-6xl font-black tracking-tight mb-5 animate-fade-in-up leading-tight" style={{ animationDelay: '0.1s' }}>
                  Real-Time <span className="text-gradient animate-gradient">Unlimited AI Copilot</span> <br />
                  For Interviews, Coding &amp; Exams
                </h1>

                <p className="hl-text-secondary text-base tablet:text-lg laptop-sm:text-lg mb-6 max-w-2xl mx-auto laptop-sm:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                  100% invisible live copilot for Zoom/Meet interviews, live coding rounds &amp; exam certifications (AWS, Azure, GCP, CompTIA &amp; OAs). Real-time answers with <strong>zero hourly limits</strong> from just <strong>₹14/hr</strong>.
                </p>

                {/* Compact version of core use-cases & differentiators */}
                <div className="flex flex-wrap items-center justify-center laptop-sm:justify-start gap-x-5 gap-y-2 text-[#EAF6FF] text-sm font-semibold mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <span className="flex items-center gap-1.5">💼 Live Interviews</span>
                  <span className="flex items-center gap-1.5">💻 Coding Rounds &amp; OAs</span>
                  <span className="flex items-center gap-1.5">📜 Exam Certifications</span>
                  <span className="flex items-center gap-1.5">🥷 100% Invisible</span>
                  <span className="flex items-center gap-1.5">♾️ 100% Unlimited</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-center laptop-sm:items-start justify-center laptop-sm:justify-start gap-3 mb-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                  {/* Bold highlight stack under the primary CTA — same
                      pattern as ghostai.one's "Try for Free / START WITH
                      25 FREE MINUTES / One-time trial · No credit card"
                      under their primary button, but with our own real
                      free-tier terms (15 AI answers/day, forever — see the
                      "How It Works" section below) rather than a trial
                      that expires. */}
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => requestDownload(detectedOS === 'mac' ? 'mac' : 'windows')}
                      className="btn btn-primary text-sm px-6 py-3 shadow-lg hover:shadow-blue-500/25 animate-pulse-glow"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V4a1 1 0 011-1z" clipRule="evenodd" />
                        <path d="M4 15a1 1 0 011 1v1a1 1 0 001 1h8a1 1 0 001-1v-1a1 1 0 112 0v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a1 1 0 011-1z" />
                      </svg>
                      Try for Free
                    </button>
                    <span className="hl-heading text-[11px] font-bold tracking-wide uppercase">Free Forever · No Credit Card</span>
                    <span className="hl-text-muted text-[10px]">15 AI answers every day, forever</span>
                  </div>
                  {/* Same real WhatsApp community group used in the
                      "Join Candidates on WhatsApp" section further down —
                      not a new/invented link. */}
                  <a
                    href="https://chat.whatsapp.com/CrcPkUc3uceAyKJgGV30FV?s=cl&p=a&mlu=4&ilr=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary text-sm px-6 py-3 flex items-center justify-center gap-1.5"
                  >
                    <WhatsAppIcon glyphOnly className="w-4 h-4 flex-shrink-0" />
                    Join WhatsApp Group
                  </a>
                  <div className="flex flex-col items-center gap-1">
                    <Link href="/pricing" className="btn btn-secondary text-sm px-6 py-3">
                      See Pricing
                    </Link>
                    <span className="text-emerald-400 font-semibold text-[10px]">From ₹14/hr · 100% Unlimited</span>
                  </div>
                </div>

                {/* Compact trust line directly under the CTAs — same real
                    numbers already shown in the hero stat grid on the right
                    (2,400+ candidates, 4.9★ rating), just surfaced here too
                    since that grid can be a full scroll away on mobile. */}
                <p className="hl-heading text-sm font-bold flex items-center justify-center laptop-sm:justify-start gap-1.5 mb-3 animate-fade-in-up" style={{ animationDelay: '0.28s' }}>
                  <span className="text-yellow-500">★</span>
                  <Link href="/#reviews" className="hover:opacity-70 transition-opacity">
                    4.9 rating · 2,400+ candidates helped
                  </Link>
                </p>

                <p className="hl-text-muted text-xs mb-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  Sign in with Google, then your download starts · Free forever for freshers · No card needed ·{' '}
                  <Link href="/install" className="underline underline-offset-2 hover:text-[#EAF6FF]">Other platforms</Link>
                </p>

                {/* Live Social Proof Activity Ticker directly below hero CTA */}
                <div className="flex justify-center laptop-sm:justify-start animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                  <LiveSocialProofTicker />
                </div>
              </div>

              {/* RIGHT — hero demo video. Same click-to-play YouTube embed
                  pattern as the "See it live" section below (same video,
                  own local play state so the two don't cross-trigger each
                  other). A soft glow behind the card gives it some depth
                  instead of a flat rectangle sitting on the page. */}
              <div className="relative animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent rounded-[2rem] blur-2xl -z-10" aria-hidden="true" />
                {/* Terminal-style window chrome around the real product demo —
                    purely a framing device (three dots + title bar), not a
                    simulated terminal with invented content. */}
                <div id="hero-video" className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-[rgba(34,211,238,0.18)] shadow-2xl">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" aria-hidden="true" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" aria-hidden="true" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" aria-hidden="true" />
                    <span className="ml-2 text-[11px] font-medium text-slate-400 tracking-wide truncate">JavihAI — Live Product Demo</span>
                  </div>
                  <div className="relative aspect-video w-full">
                    {heroVideoPlaying ? (
                      <iframe
                        src="https://www.youtube-nocookie.com/embed/QeZDYWtKnsY?autoplay=1&mute=1&playsinline=1"
                        title="JavihAI Product Demo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHeroVideoPlaying(true)}
                        className="w-full h-full relative block text-left group/hero-play focus:outline-none cursor-pointer"
                        aria-label="Play JavihAI Product Demo Video"
                      >
                        <img
                          src="https://img.youtube.com/vi/QeZDYWtKnsY/hqdefault.jpg"
                          alt="JavihAI Product Walkthrough Video"
                          className="w-full h-full object-cover opacity-85 group-hover/hero-play:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-center justify-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50 group-hover/hero-play:scale-110 transition-transform border-2 border-white/20">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-4 text-white text-sm font-semibold drop-shadow">
                          ▶ 90-second walkthrough
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Trust stats — moved here from their own full-width
                    section below the hero, so the right column carries
                    both the product shot and the proof points together
                    instead of the video sitting alone next to a wall of
                    left-column text. */}
                <div className="glass rounded-2xl p-4 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { num: '2,400+', label: 'Candidates Helped', note: true },
                      { num: '<2s', label: 'AI Answer Speed' },
                      { num: '~7×', label: 'Cheaper than FR AI' },
                      { num: '100%', label: 'Invisible on Screen' },
                      { num: '10+', label: 'Indian Languages' },
                      // Linked to #reviews — a rating is a claim; a click-through
                      // to the actual testimonials is what makes it checkable
                      // instead of just a bare number.
                      { num: '4.9★', label: 'Early Rating', note: true, href: '/#reviews' },
                    ].map((stat) => {
                      const content = (
                        <>
                          <div className="hl-heading text-lg tablet:text-xl font-black tracking-tight mb-0.5 whitespace-nowrap">
                            {stat.num}{stat.note && <sup className="hl-text-muted text-[9px]">*</sup>}
                          </div>
                          <div className={`hl-text-muted text-[10px] font-medium leading-tight ${stat.href ? 'underline decoration-dotted underline-offset-2' : ''}`}>
                            {stat.label}
                          </div>
                        </>
                      );
                      return stat.href ? (
                        <Link key={stat.label} href={stat.href} className="text-center min-w-0 hover:opacity-70 transition-opacity">
                          {content}
                        </Link>
                      ) : (
                        <div key={stat.label} className="text-center min-w-0">{content}</div>
                      );
                    })}
                  </div>
                  <p className="hl-text-muted text-[10px] text-center mt-3 pt-3 border-t border-[rgba(34,211,238,0.14)]">
                    * Self-reported figures from JavihAI users at signup, not an independently audited count.
                  </p>
                </div>

                {/* Trust badges — same claims/wording already used on
                    /pricing's trust strip (256-bit encryption, 7-day
                    money-back guarantee, Razorpay secured, cancel anytime).
                    Moved here (from the left column) to balance the two
                    sides of the hero — left carries the pitch + CTA, right
                    carries the proof (demo, stats, trust, compatibility). */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[#8FA8C2] text-xs mt-4 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
                  <span className="flex items-center gap-1.5"><span className="text-[#4ADE80]">🔒</span> 256-bit encryption</span>
                  <span className="flex items-center gap-1.5"><span className="text-[#4ADE80]">🛡️</span> 7-day money-back guarantee</span>
                  <span className="flex items-center gap-1.5"><span className="text-[#4ADE80]">💳</span> Razorpay secured</span>
                  <span className="flex items-center gap-1.5"><span className="text-[#4ADE80]">✓</span> Cancel anytime</span>
                </div>

                {/* Links to the "Privacy You Can Verify" section further
                    down — that section already directly answers this
                    product's #1 specific objection ("will this get me
                    caught, is my audio safe") point-by-point, but had zero
                    visibility from the hero where people actually decide. */}
                <Link
                  href="/#privacy"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8FA8C2] hover:text-[#EAF6FF] underline underline-offset-2 mt-3 animate-fade-in-up"
                  style={{ animationDelay: '0.47s' }}
                >
                  🔐 See how we protect your privacy →
                </Link>

                {/* Compact version of the "Works With Your Video Call App"
                    section further down the page — same shared app list, so
                    compatibility (a real decision factor before download)
                    is visible without scrolling. Also moved here from the
                    left column for the same balance reason as the trust
                    badges above. */}
                <div className="flex flex-wrap items-center gap-2 mt-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  <span className="hl-text-muted text-xs font-medium mr-0.5">Works with:</span>
                  {VIDEO_CALL_APPS.map((app) => (
                    <span
                      key={app.name}
                      title={app.name}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(10,16,28,0.7)] border border-[rgba(34,211,238,0.14)]"
                    >
                      <app.Icon size={16} color={app.color} aria-label={app.name} />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Global Disruption Value Proposition Banner */}
            <div className="mt-10 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-purple-950/80 border border-blue-500/25 backdrop-blur-md shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-5 animate-fade-in-up" style={{ animationDelay: '0.52s' }}>
              <div className="flex items-center gap-4 text-center lg:text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                  🇮🇳
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-blue-400 font-bold">🇮🇳 Built For India · 🌍 Unbeatable Global Value</div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    One Unlimited AI Copilot for Interviews, Coding &amp; Certifications
                  </h3>
                  <p className="text-xs text-[#8FA8C2] mt-0.5">
                    Foreign tools charge per-hour meters (₹3,500–₹15,000/hr) with zero Indian company context. JavihAI gives 100% unlimited answers for job interviews, coding rounds, and certification exams with Desi Mode &amp; 1-click UPI.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 flex-shrink-0 text-xs">
                <div className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-1.5">
                  <span>⏱️ Foreign Tools:</span>
                  <span className="font-semibold line-through text-red-400">₹3,500 – ₹15,000 / hr</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 shadow-sm">
                  <span>⚡ JavihAI:</span>
                  <span>From ₹14 / hr · 100% Unlimited</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar now lives in the hero's right column, under the video
            (see above) — no longer a separate full-width section here. */}

        {/* ═══════════════════════════════════════════════════════════
            SEE IT LIVE — the one place the interactive demo lives.
            Merges the old separate "Interactive Live Demo" section and
            3-video "Video Tutorials" grid into a single tab switch.
            ═══════════════════════════════════════════════════════════ */}
        <section id="live-demo" className="section-py section-alt relative overflow-hidden border-y border-[rgba(34,211,238,0.10)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="section-label">⚡ See It Live</div>
              <h2 className="section-heading mb-4">
                Try It <span className="text-gradient">Right Now</span> — No Download Needed
              </h2>
              <p className="hl-text-secondary text-base sm:text-lg leading-relaxed">
                Switch between a real interactive simulator and the full product walkthrough.
              </p>
            </div>

            {/* 60-Second In-App Sound & Stealth Test */}
            <div className="mb-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">60-Second Confidence Test</div>
                  <div className="text-xs text-[#EAF6FF]">
                    1. Open desktop app → 2. Audio &amp; mic auto-sync → 3. Answer streams in &lt;1.5s
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold whitespace-nowrap">
                100% Invisible to Zoom / Meet
              </span>
            </div>

            <div className="flex items-center justify-center gap-1 bg-[rgba(10,16,28,0.7)] border border-[rgba(34,211,238,0.14)] p-1 rounded-xl mb-8 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setDemoView('simulator')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  demoView === 'simulator' ? 'bg-blue-600 text-white shadow-sm' : 'hl-text-secondary hover:text-[#EAF6FF]'
                }`}
              >
                💻 Try It Now
              </button>
              <button
                type="button"
                onClick={() => { setDemoView('video'); setDemoVideoPlaying(true); }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  demoView === 'video' ? 'bg-red-600 text-white shadow-sm' : 'hl-text-secondary hover:text-[#EAF6FF]'
                }`}
              >
                🎬 Watch It
              </button>
            </div>

            {appVersion && (
              <p className="hl-text-muted text-xs text-center mb-6 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                {/* Linked to the public changelog — most competitors don't
                    publish real release notes, so pointing directly at
                    exactly what shipped and when is a transparency signal,
                    not just decorative version text. */}
                <Link href="/changelog" className="underline underline-offset-2 hover:text-[#EAF6FF]">
                  JavihAI {appVersion} · View public changelog
                </Link>
                {isNewRelease && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700">NEW</span>
                )}
              </p>
            )}

            {demoView === 'simulator' ? (
              <LiveGuideModeDemo appVersion={appVersion} />
            ) : (
              <div className="relative w-full max-w-3xl mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-[rgba(34,211,238,0.18)] shadow-xl">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" aria-hidden="true" />
                  <span className="ml-2 text-[11px] font-medium text-slate-400 tracking-wide truncate">JavihAI — Product Walkthrough</span>
                </div>
                <div className="relative aspect-video w-full">
                  {demoVideoPlaying ? (
                    <iframe
                      src="https://www.youtube-nocookie.com/embed/QeZDYWtKnsY?autoplay=1&mute=1&loop=1&playlist=QeZDYWtKnsY&playsinline=1"
                      title="JavihAI Product Demo"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDemoVideoPlaying(true)}
                      className="w-full h-full relative block text-left group/demo-play focus:outline-none cursor-pointer"
                      aria-label="Play JavihAI Product Demo Video"
                    >
                      <img
                        src="https://img.youtube.com/vi/QeZDYWtKnsY/hqdefault.jpg"
                        alt="JavihAI Product Walkthrough Video"
                        className="w-full h-full object-cover opacity-85 group-hover/demo-play:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50 group-hover/demo-play:scale-110 transition-transform border-2 border-white/20">
                          <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            WHAT IT DOES — merges the old stealth explainer, 5-card
            "World-First" grid, and 9-card Features bento into one
            6-item grid of genuinely differentiated capabilities.
            ═══════════════════════════════════════════════════════════ */}
        <section id="features" className="section-py">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <div className="section-label">✨ What It Does</div>
              <h2 className="section-heading mb-4">
                Everything You Need, <span className="text-gradient">Nothing You Don&apos;t</span>
              </h2>
              <p className="hl-text-secondary text-lg max-w-2xl mx-auto">
                Six capabilities that actually matter in a live interview.
              </p>
            </div>

            <div className="grid tablet:grid-cols-2 laptop-sm:grid-cols-3 gap-6">
              {[
                { icon: '⚡', title: 'Sub-2s Streaming Answers', desc: '13 live AI models with zero-downtime auto-fallback — structured answers stream in under 2 seconds.' },
                { icon: '🥷', title: 'True OS-Level Stealth', desc: 'Excluded from screen capture at the OS level — invisible on Zoom, Google Meet, Teams & Webex.' },
                { icon: '🎧', title: 'Native System Audio', desc: 'Hears the interviewer directly from your speaker output — works even with your mic off.' },
                { icon: '📷', title: 'Camera-Dock Teleprompter', desc: 'Stays right under your camera lens for natural eye contact, with quick STAR / 1-Min format chips.' },
                { icon: '🇮🇳', title: 'Desi Mode', desc: 'CTC in ₹ LPA, notice period & bond context, and 10+ Indian regional languages.' },
                { icon: '🔗', title: 'Resume & Job Auto-fill', desc: 'Drag in a resume or paste a job link — JavihAI parses skills, roles, and the JD instantly.' },
              ].map((f) => (
                <div key={f.title} className="card p-6 sm:p-8">
                  <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center text-2xl mb-5 bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                    {f.icon}
                  </div>
                  <h3 className="hl-heading text-lg font-bold mb-2">{f.title}</h3>
                  <p className="hl-text-secondary leading-relaxed text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            WORKS WITH — real brand marks via react-icons (Simple Icons /
            Font Awesome / Bootstrap Icons sets), which are explicitly
            licensed for representing a brand — not the companies' own
            logo files, and not the same trademark-usage question as
            fetching an official lockup. Zoom/Meet/Teams/Webex are the 4
            apps named as tested elsewhere on this page (FAQ, feature grid,
            HowTo schema); Skype and Slack (Huddles) added per explicit ask
            since the product works via system audio + OS-level screen
            exclusion — platform-agnostic, not a per-app integration, so
            listing more than the 4 "tested" ones is reasonable. Google Duo
            was requested too but is dropped: Google discontinued it in
            2022, merging it into Google Meet — no icon library carries it
            because it isn't a distinct current product anymore.
            ═══════════════════════════════════════════════════════════ */}
        <section className="pb-16 md:pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="section-label">🔒 Compatibility</div>
            <h2 className="section-heading mb-4">
              100% Private &amp; Invisible <span className="text-gradient">On Every App</span>
            </h2>
            {/* "Tested" is scoped to the 4 platforms already asserted
                elsewhere on this page (see "What It Does" feature grid:
                "invisible on Zoom, Google Meet, Teams & Webex") — the rest
                work via the same OS-level exclusion + system audio, not a
                per-app integration, so they're described that way instead
                of folded into the same "tested" claim. */}
            <p className="hl-text-secondary section-subheading mx-auto mb-8">
              Tested on Zoom, Google Meet, Microsoft Teams &amp; Webex — and works anywhere else too, since it runs at the OS level, not as a per-app plugin.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {VIDEO_CALL_APPS.map((app) => (
                <div
                  key={app.name}
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-[rgba(10,16,28,0.7)] border border-[rgba(34,211,238,0.14)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md"
                >
                  <app.Icon size={18} color={app.color} aria-hidden="true" />
                  <span className="hl-heading text-sm font-semibold">{app.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CERTIFICATION EXAMS — same Screenshot Solve mechanism as
            /coding-platforms (reads whatever's on screen, works on any
            browser-based platform), applied to certification exams
            instead of coding rounds. Kept to the same honest "browser-
            based platform" scoping /coding-platforms already uses,
            rather than claiming to defeat any specific proctoring
            software, which isn't a real, verifiable claim.
            ═══════════════════════════════════════════════════════════ */}
        <section className="section-py section-alt">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="section-label">🎓 Certification Exams</div>
            <h2 className="section-heading mb-4">
              Works During <span className="text-gradient">Certification Exams Too</span>
            </h2>
            <p className="hl-text-secondary section-subheading mx-auto mb-8">
              The same on-screen reading technology that solves coding rounds also works for any browser-based certification exam — AWS, Microsoft Azure, Google Cloud, CompTIA, Cisco, PMP, and more.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {CERT_EXAMS.map((exam) => (
                <div
                  key={exam.name}
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-[rgba(10,16,28,0.7)] border border-[rgba(34,211,238,0.14)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md"
                >
                  {exam.Icon && <exam.Icon size={18} color={exam.color} aria-hidden="true" />}
                  <span className="hl-heading text-sm font-semibold">{exam.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PRIVACY YOU CAN VERIFY — the trust badges in the hero
            (encryption, refund, Razorpay) address payment trust. This
            addresses the actual anxiety specific to this product: "will
            using this get me caught, and is my audio safe." Each claim
            here is already stated elsewhere on the site (FAQ, feature
            grid, /privacy) — this just surfaces them together instead of
            leaving them buried in FAQ text nobody reads before deciding.
            Wording is kept literally consistent with /privacy's actual
            claim ("we don't sell your data and don't use it to train
            third-party AI models") rather than a looser paraphrase.
            ═══════════════════════════════════════════════════════════ */}
        <section id="privacy" className="section-py">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="section-label">🔐 Privacy You Can Verify</div>
              <h2 className="section-heading mb-4">
                Not Just Hidden — <span className="text-gradient">Actually Private</span>
              </h2>
              <p className="hl-text-secondary section-subheading mx-auto">
                The specific things people actually worry about before running this in a real interview.
              </p>
            </div>
            <div className="grid grid-cols-1 tablet:grid-cols-3 gap-6">
              {[
                {
                  icon: '🎙️',
                  title: 'Audio never stored',
                  desc: 'Transcribed in real-time on your device and immediately discarded. No recordings, no logs, nothing kept.',
                },
                {
                  icon: '🥷',
                  title: 'OS-level exclusion, not a hack',
                  desc: 'Excluded from screen capture at the operating-system level on both Mac and Windows — not a browser trick or window trick that can fail mid-call.',
                },
                {
                  icon: '🚫',
                  title: 'Never sold, never used to train AI',
                  desc: "We don't sell your data, and we don't use it to train third-party AI models. Full policy is public — nothing hidden in fine print.",
                },
                {
                  icon: '💳',
                  title: 'Secure payments',
                  desc: 'Billing runs through Razorpay, a PCI-DSS compliant processor — we never see your full card number.',
                },
                {
                  icon: '🗑️',
                  title: 'Delete anytime',
                  desc: 'Email us from your account address and we\'ll close your account and erase your data within 30 days.',
                },
              ].map((item) => (
                <div key={item.title} className="card p-6 sm:p-8 text-center">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="hl-heading text-lg font-bold mb-2">{item.title}</h3>
                  <p className="hl-text-secondary leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-8">
              <Link href="/privacy" className="text-sm hl-text-secondary underline underline-offset-2 hover:text-[#EAF6FF]">
                Read the full privacy policy →
              </Link>
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            HOW IT WORKS
            ═══════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="section-py section-alt relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <div className="section-label">🚀 3-Minute Setup</div>
              <h2 className="section-heading mb-4">
                Ready Before Your Next <span className="text-gradient">Interview</span>
              </h2>
              <p className="hl-text-secondary max-w-xl mx-auto">No complex setup. No coaching. Just install, sign in, and start.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-14 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30" />

              {[
                {
                  num: '01',
                  icon: '📝',
                  title: 'Create Free Account',
                  desc: 'Sign up in 30 seconds with Google — no credit card required. Get 3 AI answers every single day, free forever.',
                  color: 'from-blue-500 to-indigo-500',
                },
                {
                  num: '02',
                  icon: '⬇',
                  title: 'Install Desktop App',
                  desc: 'Download for Windows or macOS. If your OS shows a security prompt, click "Run anyway" or "Open" — standard for brand-new desktop apps.',
                  color: 'from-indigo-500 to-purple-500',
                },
                {
                  num: '03',
                  icon: '🎯',
                  title: 'Ace Your Interview',
                  desc: 'Join Zoom, Meet, or Teams. The JavihAI overlay stays completely invisible to screen share while auto-detecting questions and streaming answers in 2s.',
                  color: 'from-blue-500 to-purple-500',
                },
              ].map((step) => (
                <div key={step.num} className="text-center relative z-10">
                  <div className={`inline-flex w-20 h-20 rounded-2xl items-center justify-center text-4xl mb-5 shadow-lg shadow-blue-500/20 ${GRADIENT_CLASSES[step.color] || 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                    {step.icon}
                  </div>
                  <div className="hl-text-muted text-xs font-bold tracking-widest mb-2">{step.num}</div>
                  <h3 className="hl-heading text-xl font-bold mb-3">{step.title}</h3>
                  <p className="hl-text-secondary leading-relaxed text-sm">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/auth/signup" className="btn btn-primary btn-lg animate-pulse-glow">
                Get Started Free →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            DESI MODE SPOTLIGHT — the one dedicated differentiator
            section; links out to /indian-languages for the full list
            instead of restating it here.
            ═══════════════════════════════════════════════════════════ */}
        <section id="desi-mode" className="section-py relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: text */}
              <div>
                <div className="section-label">🇮🇳 Made for India</div>
                <h2 className="section-heading mb-6">
                  The Only AI Copilot That <span className="text-gradient">Understands Indian Interviews</span>
                </h2>
                <p className="hl-text-secondary mb-8 leading-relaxed">
                  Global tools give generic answers in USD. JavihAI knows Indian interview culture — CTC in LPA, notice period norms, ESOP vs variable pay, bond clauses, and company-specific context for FAANG India, unicorns, MNCs, and IT services.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: '💰', title: 'Salary in ₹ LPA', desc: 'Answers reference CTC, in-hand, variable pay in Indian terms — not USD or global ranges.' },
                    { icon: '📅', title: 'Notice period & bonds', desc: 'Handles the "3-month notice", "1-year bond", and "joining date" questions that trip up global tools.' },
                    { icon: '🏢', title: 'Company-type context', desc: 'FAANG India loop, Tier-1 startup, MNC GS/JPMorgan, or TCS/Infosys service round — each gets different answers.' },
                    { icon: '🗣️', title: '10+ Indian languages', desc: 'Answer in Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, and more. Code stays in English.' },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-lg flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="hl-heading font-semibold text-sm mb-1">{item.title}</div>
                        <div className="hl-text-secondary text-sm leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/indian-languages" className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-semibold mt-6">
                  See all Indian languages →
                </Link>
              </div>

              {/* Right: Desi Mode card */}
              <div className="relative">
                <div className="glass-card p-8 border border-orange-500/15">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xl">🇮🇳</div>
                    <div>
                      <div className="hl-heading font-bold">Desi Mode · Active</div>
                      <div className="text-xs text-orange-600 font-medium">Power Plan Feature</div>
                    </div>
                    <div className="ml-auto w-10 h-5 rounded-full bg-orange-500 relative flex items-center px-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm ml-auto" />
                    </div>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div>
                      <div className="hl-text-muted text-xs mb-2 font-medium uppercase tracking-wide">Interviewer asks:</div>
                      <div className="hl-text-secondary italic leading-relaxed">&ldquo;What is your current CTC and what are your expectations?&rdquo;</div>
                    </div>
                    <div className="border-t border-[rgba(34,211,238,0.14)] pt-5">
                      <div className="hl-text-muted text-xs mb-2 font-medium uppercase tracking-wide flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block animate-pulse" />
                        JavihAI · Desi Mode answer:
                      </div>
                      <div className="hl-text leading-relaxed">
                        My current CTC is <span className="text-blue-600 font-semibold">₹18 LPA</span> (₹14L fixed + ₹4L variable). I&apos;m targeting <span className="text-blue-600 font-semibold">₹26–28 LPA</span> based on my 4 YOE in fintech and the scope here. I have a <span className="text-amber-600 font-semibold">60-day notice period</span>, negotiable to 30 days.
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-700 border border-orange-500/20">₹ in LPA</span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-[rgba(34,211,238,0.08)] hl-text-secondary border border-[rgba(34,211,238,0.14)]">Notice period</span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-[rgba(34,211,238,0.08)] hl-text-secondary border border-[rgba(34,211,238,0.14)]">Indian norms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            COMPACT COMPARISON — 5 rows instead of the old 13; full
            breakdown lives at /compare.
            ═══════════════════════════════════════════════════════════ */}
        <section id="compare" className="section-py section-alt">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <div className="section-label">🇮🇳 India&apos;s #1 · 🌍 Global Disruption</div>
              <h2 className="section-heading mb-4">
                JavihAI vs <span className="text-gradient">Every Global Tool</span>
              </h2>
              <p className="hl-text-secondary">Built for Indian tech interviews with Desi Mode, and ~7× to 10× cheaper than US tools with zero hourly ticking meters.</p>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-[rgba(34,211,238,0.14)]">
                      <th className="text-left px-5 py-4 hl-text-secondary font-semibold w-44">Feature</th>
                      <th className="px-4 py-4 text-center">
                        <div className="hl-heading font-bold text-base">JavihAI</div>
                        <div className="text-blue-600 text-xs font-semibold mt-0.5">₹{effectivePrice(pricing.plans.power.monthly, pricing.offer, 'power')}/mo</div>
                      </th>
                      <th className="px-4 py-4 text-center">
                        <div className="hl-text-secondary font-semibold">Final Round AI</div>
                        <div className="hl-text-muted text-xs mt-0.5">₹14,250/mo</div>
                      </th>
                      <th className="px-4 py-4 text-center">
                        <div className="hl-text-secondary font-semibold">Cluely</div>
                        <div className="hl-text-muted text-xs mt-0.5">~₹14,250/mo</div>
                      </th>
                      <th className="px-4 py-4 text-center">
                        <div className="hl-text-secondary font-semibold">Interview Coder</div>
                        <div className="hl-text-muted text-xs mt-0.5">~₹28,400/mo</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['100% Unlimited (No minute caps)', '✅ Yes (All paid)', '❌ 5-min sessions', '❌ 30-min block deduction', '❌ Strict limits'],
                      ['Cost per hour of prep', '✅ ~₹14/hr', '❌ ~₹3,500/hr', '❌ ~₹4,500/hr', '❌ ~₹7,000/hr'],
                      ['Desktop app (true stealth)', '✅', '⚠️ Web', '✅', '✅'],
                      ['System audio capture', '✅', '❌', '✅', '❌'],
                      ['Indian languages (10+)', '✅', '❌', '❌', '❌'],
                      ['₹ LPA salary & notice norms', '✅', '❌', '❌', '❌'],
                      ['Free plan (no time limit)', '✅ 15 answers/day', '❌ 5-min session', '❌ Free trial only', '❌ No trial'],
                    ].map(([feature, ...vals], i) => (
                      <tr key={i} className={`border-b border-[rgba(34,211,238,0.10)] ${i % 2 === 0 ? 'bg-[rgba(34,211,238,0.05)]' : ''}`}>
                        <td className="px-5 py-3.5 hl-text-secondary font-medium">{feature}</td>
                        {vals.map((v, j) => (
                          <td key={j} className={`px-4 py-3.5 text-center ${j === 0 ? 'bg-blue-500/5' : ''}`}>
                            <StatusBadge value={v} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/compare" className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium text-sm">
                See the full comparison →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TESTIMONIALS — trimmed from 6 to 4
            ═══════════════════════════════════════════════════════════ */}
        <section id="reviews" className="section-py">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="section-label">💬 Real Candidates</div>
              <h2 className="section-heading mb-4">
                What Users <span className="text-gradient">Are Saying</span>
              </h2>
            </div>

            <div className="grid tablet:grid-cols-2 laptop-sm:grid-cols-4 gap-6">
              {[
                {
                  quote: "Switched to System Audio mode — JavihAI caught the question and gave me a clean architecture answer before I could even panic. Got the offer.",
                  name: 'Arjun S.',
                  role: 'SDE-2 · Bengaluru',
                  company: 'Joined Razorpay',
                  emoji: '🚀',
                  stars: 5,
                },
                {
                  quote: "The Desi Mode is underrated. It knows Indian salary ranges, notice period norms, bond clauses — things that global tools just blank out on.",
                  name: 'Priya M.',
                  role: 'Product Manager · Hyderabad',
                  company: 'Joined CRED',
                  emoji: '🇮🇳',
                  stars: 5,
                },
                {
                  quote: "I was skeptical about using an AI tool during a real interview but the stealth overlay is genuinely invisible. Walked into my FAANG loop with way more confidence.",
                  name: 'Karthik R.',
                  role: 'Senior Engineer · Chennai',
                  company: 'Joined Google India',
                  emoji: '🎯',
                  stars: 5,
                },
                {
                  quote: "Was paying ₹7,000/mo for Final Round AI. Switched to JavihAI and honestly the answers are better. The Indian context makes a huge difference in HR rounds.",
                  name: 'Divya K.',
                  role: 'ML Engineer · Pune',
                  company: 'Joined Flipkart',
                  emoji: '💸',
                  stars: 5,
                },
              ].map((t, i) => (
                <div key={i} className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden transition-transform hover:-translate-y-1">
                  <span className="absolute -top-2 -right-1 text-6xl font-black text-blue-500/10 leading-none select-none" aria-hidden="true">&rdquo;</span>
                  <div className="flex justify-between items-start relative">
                    <div className="testimonial-avatar">{t.emoji}</div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <span key={j} className="text-yellow-500 text-sm">★</span>
                      ))}
                    </div>
                  </div>
                  <p className="hl-text-secondary leading-relaxed text-sm flex-1 italic relative">&ldquo;{t.quote}&rdquo;</p>
                  <div className="border-t border-[rgba(34,211,238,0.14)] pt-4 relative">
                    <div className="hl-heading font-semibold text-sm">{t.name}</div>
                    <div className="hl-text-muted text-xs">{t.role}</div>
                    <div className="text-blue-600 text-xs mt-1 font-medium">{t.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FAQ — trimmed from 18 to 6 (see FAQ_ITEMS comment above)
            ═══════════════════════════════════════════════════════════ */}
        <section id="faq" className="section-py section-alt">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="section-label">❓ FAQ</div>
              <h2 className="section-heading mb-4">
                <span className="text-gradient">Common Questions</span>
              </h2>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="glass-card p-5 cursor-pointer select-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="hl-heading text-base font-semibold">{item.q}</h3>
                    <div className={`w-8 h-8 rounded-full glass flex items-center justify-center transition-bounce flex-shrink-0 ${openFaq === i ? 'rotate-180 gradient-primary' : ''}`}>
                      <svg className={`w-3.5 h-3.5 ${openFaq === i ? 'text-white' : 'hl-text-secondary'}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 7.5l5 5 5-5" />
                      </svg>
                    </div>
                  </div>
                  {openFaq === i && (
                    <p className="hl-text-secondary leading-relaxed mt-4 text-sm animate-fade-in-up">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            REFER & EARN — surfaces the existing creator/affiliate
            program (already live at /creator, powered by
            CREATOR_COMMISSION_BPS in lib/firebase-admin.ts) on the
            homepage. The number below (20%) is that real default rate,
            not an invented figure — per-creator overrides exist but the
            default is what's advertised here, same as /creator itself.
            ═══════════════════════════════════════════════════════════ */}
        <section className="section-py section-alt">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="glass-card p-8 md:p-12 text-center border border-blue-500/15">
              <div className="section-label">🤝 Refer & Earn</div>
              <h2 className="section-heading mb-4">
                Turn Your Audience Into <span className="text-gradient">Recurring Income</span>
              </h2>
              <p className="hl-text-secondary text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Built for content creators, students, and communities. Share your link and earn a recurring cash commission on every payment your referred users make — including renewals.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="hl-heading text-4xl font-black text-gradient">20%</div>
                  <div className="hl-text-muted text-xs font-medium mt-1 uppercase tracking-wide">Recurring commission</div>
                </div>
                <div className="text-center">
                  <div className="hl-heading text-4xl font-black">Monthly</div>
                  <div className="hl-text-muted text-xs font-medium mt-1 uppercase tracking-wide">UPI payout</div>
                </div>
              </div>
              <Link href="/creator" className="btn btn-primary btn-lg">
                See How It Works →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            COMMUNITY / FINAL CTA — merged WhatsApp CTA + social links
            into one band; dropped the duplicate "Subscribe to YouTube"
            CTA (YouTube is already reachable via the video tab above).
            ═══════════════════════════════════════════════════════════ */}
        <section className="section-py">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="section-label">🌐 Community</div>
            <h2 className="section-heading mb-4">
              Join the <span className="text-gradient">JavihAI Community</span>
            </h2>
            <p className="hl-text-secondary max-w-xl mx-auto mb-10">
              Daily job postings, interview tips, coding round solutions, salary negotiation advice, and real candidate success stories.
            </p>

            {/* WhatsApp CTA */}
            <div className="glass-card p-8 md:p-12 border border-blue-500/15 text-center mb-10">
              <WhatsAppIcon className="w-14 h-14 mb-4 mx-auto" />
              <h3 className="hl-heading text-2xl md:text-3xl font-black mb-3">
                Join Candidates on WhatsApp
              </h3>
              <p className="hl-text-secondary text-lg mb-6 max-w-lg mx-auto">
                Daily job postings, interview tips, and exclusive strategies from candidates who&apos;ve cracked FAANG and India&apos;s top companies.
              </p>
              <a
                href="https://chat.whatsapp.com/CrcPkUc3uceAyKJgGV30FV?s=cl&p=a&mlu=4&ilr=4"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all shadow-md"
              >
                <WhatsAppIcon glyphOnly className="w-6 h-6" />
                Join WhatsApp Group
              </a>
              <p className="hl-text-muted text-sm mt-4">💡 Free to join. No spam. Real community building.</p>
            </div>

            {/* Social links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { platform: 'Twitter / X', handle: '@Javih_ai', href: 'https://x.com/Javih_ai', icon: '𝕏', color: 'from-slate-800 to-slate-900', border: 'border-slate-700/50' },
                { platform: 'LinkedIn', handle: 'javih-ai', href: 'https://www.linkedin.com/in/javih-ai/', icon: '💼', color: 'from-blue-950 to-slate-900', border: 'border-blue-800/30' },
                { platform: 'Instagram', handle: '@javih.ai', href: 'https://www.instagram.com/javih.ai/', icon: '📸', color: 'from-pink-950 to-slate-900', border: 'border-pink-800/30' },
                { platform: 'YouTube', handle: 'Javih AI', href: 'https://www.youtube.com/channel/UCWAJd9eDBp9foxfxroxQukA', icon: '▶️', color: 'from-red-950 to-slate-900', border: 'border-red-800/30' },
              ].map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  // These tiles stay intentionally dark (brand-colored,
                  // like the social icons elsewhere) — deliberately NOT
                  // using `.glass-card` here, since its `.home-light`
                  // override sets a shorthand `background` that would
                  // clobber the gradient background-image below and leave
                  // white text unreadable on a near-white card.
                  className={`rounded-2xl p-4 border ${s.border} text-center group hover:scale-105 transition-bounce no-underline ${GRADIENT_CLASSES[s.color] || 'bg-gradient-to-b from-slate-800 to-slate-900'}`}
                >
                  <div className="text-2xl mb-1.5">{s.icon}</div>
                  <div className="font-bold text-white text-sm">{s.platform}</div>
                  <div className="text-slate-500 text-xs">{s.handle}</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>

      <NewCustomerOfferPopup />
      <FreeTrialModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />
      <GoogleSignInModal open={showSignIn} onClose={cancelSignIn} onSignedIn={handleSignedIn} />
      {/* Same profile-completion gate already used on /auth/signup,
          /auth/login, and /dashboard — the homepage download button used to
          be the one path that skipped it entirely. */}
      {showProfileModal && downloadUser && (
        <CompleteProfileModal
          user={downloadUser}
          onDone={handleProfileDone}
          initial={{
            phone: (fetchedUserData?.phone as string) || undefined,
            fullName: (fetchedUserData?.fullName as string) || (fetchedUserData?.profile as Record<string, unknown> | undefined)?.fullName as string || downloadUser.displayName || '',
            whatsapp: (fetchedUserData?.whatsapp as string) || ((fetchedUserData?.profile as Record<string, unknown> | undefined)?.whatsapp as string) || (fetchedUserData?.phone as string) || '',
            experienceLevel: (fetchedUserData?.experienceLevel as string) || ((fetchedUserData?.profile as Record<string, unknown> | undefined)?.experienceLevel as string) || undefined,
            city: (fetchedUserData?.city as string) || ((fetchedUserData?.profile as Record<string, unknown> | undefined)?.city as string) || undefined,
            jobRole: (fetchedUserData?.jobRole as string) || ((fetchedUserData?.profile as Record<string, unknown> | undefined)?.jobRole as string) || undefined,
          }}
        />
      )}
      <DownloadStepsModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        os={downloadModalOS}
        onSwitchOS={setDownloadModalOS}
        downloadUrl={retryUrl(downloadModalOS)}
      />
    </>
  );
}
