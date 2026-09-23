'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { buildWhatsAppLink, getWhatsAppDisplayNumber } from '@/lib/whatsapp-link';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { onOfferPopupVisibility } from '@/lib/offer-popup-events';

// Navbar renders on every page via the root layout, so a statically-
// imported FeedbackModal (which imports firebase/firestore directly) put
// the Firestore SDK in every page's initial bundle — not just wherever
// feedback is submitted. Gated behind showFeedbackModal (starts false),
// so dynamic-importing it costs nothing visible.
const FeedbackModal = dynamic(() => import('@/components/FeedbackModal'), { ssr: false });

interface Announcement { id: string; title: string; body: string; link: string | null; createdAt: number }

const SEEN_KEY = 'javihai_announcements_seen_at';

function WhatsNewBell({ isLightPage = false }: { isLightPage?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list: Announcement[] = d?.announcements || [];
        setItems(list);
        const lastSeen = Number(localStorage.getItem(SEEN_KEY) || 0);
        setUnread(list.some(a => a.createdAt > lastSeen));
      })
      .catch(() => {});
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
      setUnread(false);
    }
  };

  if (items.length === 0) return null;

  // Same isLightPage-branch convention as the rest of Navbar.tsx — the
  // dropdown panel isn't inside `.home-light`'s DOM subtree, so it needs its
  // own inline light variant rather than relying on a CSS override.
  const triggerClass = isLightPage
    ? 'relative p-2 rounded-lg text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)] transition-smooth'
    : 'relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-smooth';
  const panelClass = isLightPage
    ? 'absolute right-0 top-full mt-2 w-96 bg-white/95 backdrop-blur-xl border border-[rgba(26,21,18,0.08)] shadow-xl rounded-2xl p-3 z-50 animate-fade-in-up max-h-[70vh] flex flex-col'
    : 'absolute right-0 top-full mt-2 w-96 glass-heavy rounded-2xl p-3 z-50 animate-fade-in-up max-h-[70vh] flex flex-col';
  const panelHeadingClass = isLightPage ? 'px-3 py-2 text-base font-bold text-[#1A1512] mb-1' : 'px-3 py-2 text-base font-bold text-white mb-1';
  const itemClass = isLightPage
    ? 'block rounded-xl border border-[rgba(26,21,18,0.08)] bg-[rgba(26,21,18,0.03)] px-4 py-3 hover:bg-[rgba(26,21,18,0.06)] transition-smooth'
    : 'block rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-smooth';
  const itemTitleClass = isLightPage ? 'text-sm font-semibold text-[#1A1512] leading-snug' : 'text-sm font-semibold text-white leading-snug';
  const itemBodyClass = isLightPage ? 'text-sm text-[#57534E] leading-relaxed mb-2' : 'text-sm text-slate-300 leading-relaxed mb-2';
  const itemDateClass = isLightPage ? 'text-xs text-[#78716C]' : 'text-xs text-slate-500';

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={toggleOpen} aria-label="What's new" className={triggerClass}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={panelClass}>
            <div className={panelHeadingClass}>What&apos;s New</div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {items.map((a) => (
                <a
                  key={a.id}
                  href={a.link || undefined}
                  className={itemClass}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className={itemTitleClass}>{a.title}</div>
                    {a.link && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
                        Open
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </span>
                    )}
                  </div>
                  <p className={itemBodyClass}>{a.body}</p>
                  <div className={itemDateClass}>{new Date(a.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface FeaturedCoupon {
  code: string;
  label: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  appliesTo: string;
}

/**
 * Slim announcement-bar strip above the nav row, inside the same fixed
 * container as the rest of Navbar so the two share one box instead of
 * fighting over `top-0` — see [[dynamic-pricing]] skill for the coupon
 * model this reads from. Same /api/coupons/featured `coupon` field the
 * /pricing page's inline card already shows (NewCustomerOfferPopup is a
 * separate flow, for the `popup` field). Shown to all visitors, no
 * auth/plan targeting. The close button only hides it for the current
 * page view (component state) — dismissal is intentionally not persisted,
 * so the banner reappears on the next page load/visit.
 */
function OfferBanner() {
  const [coupon, setCoupon] = useState<FeaturedCoupon | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  // Hidden for as long as NewCustomerOfferPopup's own modal is on screen —
  // both pitch the same "get a discount" message, and showing this strip
  // underneath a blocking modal advertising the same thing reads as
  // duplicate nagging rather than two separate features.
  const [popupModalOpen, setPopupModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/coupons/featured')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c: FeaturedCoupon | null = d?.coupon ?? null;
        if (!c) return;
        setCoupon(c);
      })
      .catch(() => {});
  }, []);

  useEffect(() => onOfferPopupVisibility(setPopupModalOpen), []);

  if (!coupon || dismissed || popupModalOpen) return null;

  const discountText = coupon.discountType === 'percent'
    ? `${coupon.discountValue}% off`
    : `₹${coupon.discountValue} off`;

  // Diwali-themed banner (gold/maroon/orange, matching the DIWALI15 coupon)
  // instead of the generic purple/pink promo gradient — swap back to that
  // once the festive coupon period ends.
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-900/95 via-orange-700/95 to-amber-600/95 backdrop-blur-sm border-b border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      {/* Twinkling sparks scattered behind the text — cheap CSS-only effect
          sized for a slim banner, not a full particle system. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <span className="absolute left-[6%] top-1 text-xs animate-firecracker" style={{ animationDelay: '0s' }}>✨</span>
        <span className="absolute left-[18%] top-2.5 text-[10px] animate-firecracker" style={{ animationDelay: '0.5s' }}>✨</span>
        <span className="absolute left-[32%] top-0.5 text-xs animate-firecracker" style={{ animationDelay: '1.1s' }}>✨</span>
        <span className="absolute left-[62%] top-2 text-[10px] animate-firecracker" style={{ animationDelay: '0.3s' }}>✨</span>
        <span className="absolute left-[76%] top-0.5 text-xs animate-firecracker" style={{ animationDelay: '0.9s' }}>✨</span>
        <span className="absolute left-[90%] top-2 text-xs animate-firecracker" style={{ animationDelay: '1.4s' }}>✨</span>
        <span className="absolute left-[97%] top-1 text-[10px] animate-firecracker" style={{ animationDelay: '0.7s' }}>✨</span>
      </div>
      <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-6 py-2 flex items-center justify-center gap-3 text-sm text-white relative">
        <span className="font-semibold text-center">
          <span className="animate-pulse-glow inline-block rounded-full">🪔</span>{' '}Use code{' '}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(coupon.code).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="underline decoration-dotted underline-offset-4 hover:text-white/80 font-mono"
            title="Copy code"
          >
            {coupon.code}
          </button>{' '}
          for {discountText}
          {coupon.label ? ` — ${coupon.label}` : ''}
          {copied && <span className="ml-2 text-white/90">Copied!</span>}
        </span>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss offer"
          className="absolute right-6 p-1 rounded hover:bg-white/20 transition-smooth"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Always-visible support number — a direct wa.me link, not the FAQ chat
 * widget (that's WhatsAppButton.tsx, the floating icon). `compact` drops
 * the pill background/border for the cramped mobile top row; both variants
 * hide themselves entirely if NEXT_PUBLIC_WHATSAPP_NUMBER isn't set.
 */
function SupportNumberLink({ compact = false, isLightPage = false }: { compact?: boolean; isLightPage?: boolean }) {
  const waLink = buildWhatsAppLink("Hi! I'd like to talk to JavihAI support.");
  const display = getWhatsAppDisplayNumber();
  if (!waLink || !display) return null;

  const linkClass = isLightPage
    ? (compact
        ? 'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)] transition-smooth text-[11px] font-medium whitespace-nowrap'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(26,21,18,0.03)] border border-[rgba(26,21,18,0.1)] hover:border-green-600/40 text-[#57534E] hover:text-[#1A1512] transition-smooth text-xs font-medium whitespace-nowrap')
    : (compact
        ? 'flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-smooth text-[11px] font-medium whitespace-nowrap'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-green-500/30 text-slate-300 hover:text-white transition-smooth text-xs font-medium whitespace-nowrap');

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener"
      className={linkClass}
      aria-label={`Message JavihAI support on WhatsApp at ${display}`}
    >
      <WhatsAppIcon glyphOnly className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
      <span>{display}</span>
    </a>
  );
}

import { AudioDiagnosticModal } from '@/components/AudioDiagnosticModal';

const APP_PATHS = ['/dashboard', '/resume', '/jobs', '/mock-interview', '/creator'];

export default function Navbar() {
  const pathname = usePathname();
  const isAppPage = APP_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  // Every page now renders the dark "HUD" theme (see `.home-hud` in
  // globals.css, applied site-wide by ThemeScope.tsx) instead of the old
  // per-route light/dark split, so the navbar's every isLightPage branch
  // (logo color, dividers, buttons, mobile menu, support link, bell) now
  // always takes the dark path. Kept as a named const, not inlined, so
  // none of those branches below need touching individually.
  const isLightPage = false;
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAudioDiagModal, setShowAudioDiagModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('feedback') === '1') {
        setShowFeedbackModal(true);
      }
      if (params.get('audiocheck') === '1' || params.get('mic') === '1') {
        setShowAudioDiagModal(true);
      }
    }
  }, [pathname]);

  // Navbar renders on every page via the root layout, so a static Firebase
  // import here put the SDK in every page's initial bundle — not just the
  // homepage. Dynamic-imported for the same reason as useAuth.ts/
  // useGatedDownload.ts; sign-out behavior/timing is unchanged since this
  // only ever ran on click, never during render.
  const handleSignOut = async () => {
    const [{ auth }, { signOut }] = await Promise.all([
      import('@/lib/firebase'),
      import('firebase/auth'),
    ]);
    await signOut(auth);
    router.push('/');
  };

  // Light-nav link styling only ever applies on `/` (isLightPage), which is
  // the only route rendered inside `.home-light`. Every other marketing
  // page keeps the dark `text-slate-300 hover:text-white` treatment.
  const marketingLinkClass = isLightPage
    ? 'px-3.5 py-2 text-[#57534E] hover:text-[#1A1512] transition-smooth rounded-lg hover:bg-[rgba(26,21,18,0.05)] text-sm'
    : 'px-3.5 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5 text-sm';
  const marketingMobileLinkClass = isLightPage
    ? 'px-4 py-3 text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)] rounded-lg transition-smooth'
    : 'px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth';

  // Same isLightPage pattern as marketingLinkClass above, extended to every
  // other nav element that hardcoded dark-theme colors — Mic Check/Feedback
  // buttons, Sign In/Sign Out/Dashboard, the hamburger icon, and the mobile
  // menu's divider. Navbar renders outside `.home-light`'s DOM subtree (see
  // globals.css), so these can't be fixed via a `.home-light` CSS override
  // without risking that same selector reaching LandingClient's own
  // intentionally-dark content — inline arbitrary-value classes here keep
  // the fix local to Navbar only, matching how marketingLinkClass already
  // does it.
  const iconBtnClass = isLightPage
    ? 'p-1.5 text-xs text-[#57534E] hover:text-[#1A1512] flex items-center gap-1'
    : 'p-1.5 text-xs text-slate-300 hover:text-white flex items-center gap-1';
  const feedbackBtnClass = isLightPage
    ? 'px-3 py-1.5 rounded-lg text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)] transition-smooth text-xs font-medium flex items-center gap-1.5'
    : 'px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-smooth text-xs font-medium flex items-center gap-1.5';
  const signInClass = isLightPage
    ? 'btn text-[#1A1512] bg-white/70 border border-[rgba(26,21,18,0.15)] hover:bg-white'
    : 'btn btn-signin';
  const dashboardBtnClass = isLightPage
    ? 'btn text-[#1E5FA8] bg-[rgba(30,144,255,0.06)] border border-[rgba(30,144,255,0.25)] hover:bg-[rgba(139,43,226,0.08)]'
    : 'btn btn-secondary';
  const signOutBtnClass = isLightPage
    ? 'btn text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)]'
    : 'btn btn-ghost';
  const hamburgerBtnClass = isLightPage
    ? 'p-2 rounded-lg text-[#1A1512] hover:bg-[rgba(26,21,18,0.06)] transition-smooth'
    : 'p-2 rounded-lg text-white hover:bg-white/10 transition-smooth';
  const mobileFeedbackClass = isLightPage
    ? 'px-4 py-3 text-indigo-700 hover:text-indigo-900 hover:bg-[rgba(26,21,18,0.05)] rounded-lg transition-smooth text-left flex items-center gap-2 font-medium'
    : 'px-4 py-3 text-indigo-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth text-left flex items-center gap-2 font-medium';
  const dividerClass = isLightPage ? 'h-px bg-[rgba(26,21,18,0.1)] my-2' : 'h-px bg-white/10 my-2';

  return (
    <>
      {/* Coupon banner lives in normal document flow, NOT inside the sticky
          nav — it renders once at the top of the page, scrolls away with
          the rest of the content, and never affects the nav's own height
          or position. The nav below is `sticky` (not `fixed`), so on
          initial load it simply sits in flow right after the banner (no
          overlap, no compensating padding needed anywhere else on the
          page) and only pins to the viewport top once scrolled up to that
          point — by which time the banner has already scrolled out of
          view. This replaces the earlier fixed-nav-plus-manual-padding
          approach, which broke twice (hero overlap, then a cramped-looking
          banner) because the banner's variable height (1 vs 2 lines) had
          to be guessed at in unrelated components. */}
      <OfferBanner />
      {/* Always carries an explicit background (not just after scroll) —
          with `sticky` positioning the nav sits in normal flow rather than
          floating as a transparent overlay above the hero, so a
          "transparent until scrolled" nav would otherwise reveal the
          plain dark `body` background behind it instead of blending with
          the page. */}
      <nav className={`sticky top-0 left-0 right-0 z-50 transition-smooth ${isLightPage ? 'nav-light-solid' : 'nav-solid'} ${
        scrolled ? 'py-3' : 'py-5'
      }`}>
      <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-12 w-12 group-hover:scale-110 transition-bounce">
            <Image src="/logo.svg" alt="JavihAI" width={48} height={48} unoptimized className="h-12 w-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            <div className="absolute inset-0 h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl" style={{display:'none'}} id="logo-fallback">J</div>
          </div>
          <div>
            <div className={`font-bold text-lg ${isLightPage ? 'text-[#1A1512]' : 'text-white'}`}>JavihAI</div>
            <div className={`text-xs -mt-1 ${isLightPage ? 'text-[#78716C]' : 'text-slate-400'}`}>Master Every Question</div>
          </div>
        </Link>

        {/* Desktop Nav — one link set for everyone, on every page. Dashboard
            is deliberately NOT a nav link here: it's still only reachable
            via the auth-gated button in the Auth Actions block below
            (Dashboard+Sign Out when signed in, Sign In when not) — that's
            the one thing that should actually require being logged in.
            Resume/Jobs/Mocks used to be hidden from signed-out visitors
            entirely (only shown via a route-based nav swap on those exact
            pages) — now they're always visible so people can actually find
            them without already being on that URL. Creator (the
            referral/payout program) was added back in explicitly after
            being footer-only for a while.

            Guide (#how-it-works), Blog, and FAQ (#faq) are one click away
            in the footer instead — 8+ links crowded the row even after
            moving the desktop breakpoint up to laptop-sm. Blog specifically
            got added to Footer.tsx first since it had no other nav entry
            point before that trim. */}
        <div className="hidden laptop-lg:flex items-center gap-1">
          <Link href="/pricing" className={marketingLinkClass}>
            Pricing
          </Link>
          <Link href="/resume" className={marketingLinkClass}>
            Resume
          </Link>
          <Link href="/jobs" className={marketingLinkClass}>
            Jobs
          </Link>
          <Link href="/mock-interview" className={marketingLinkClass}>
            Mock Interview
          </Link>
          <Link href="/creator" className={marketingLinkClass}>
            Creator
          </Link>
        </div>

        {/* Auth Actions */}
        <div className="hidden laptop-lg:flex items-center gap-3">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className={feedbackBtnClass}
            title="Give Feedback"
            aria-label="Give Feedback"
          >
            <span>💬</span>
          </button>
          <SupportNumberLink isLightPage={isLightPage} />
          <WhatsNewBell isLightPage={isLightPage} />
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard" className={dashboardBtnClass}>
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} className={signOutBtnClass}>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className={signInClass}>
                  Sign In
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile: support number + bell + menu button */}
        <div className="laptop-lg:hidden flex items-center gap-0.5">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className={iconBtnClass}
          >
            💬
          </button>
          <SupportNumberLink compact isLightPage={isLightPage} />
          <WhatsNewBell isLightPage={isLightPage} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={hamburgerBtnClass}
          >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {/* This panel isn't a descendant of `.home-light` (Navbar renders
          outside that wrapper — see globals.css), so `.glass-heavy` alone
          would stay dark here even on the homepage. Branch to an explicit
          light surface instead of relying on a CSS override that can't
          reach this element. */}
      {mobileOpen && (
        <div className={isLightPage
          ? 'laptop-lg:hidden bg-white/95 backdrop-blur-xl border border-[rgba(26,21,18,0.08)] shadow-xl mt-3 mx-6 rounded-2xl p-6 animate-fade-in-up'
          : 'laptop-lg:hidden glass-heavy mt-3 mx-6 rounded-2xl p-6 animate-fade-in-up'
        }>
          <div className="flex flex-col gap-2">
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
              Pricing
            </Link>
            <Link href="/resume" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
              Resume
            </Link>
            <Link href="/jobs" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
              Jobs
            </Link>
            <Link href="/mock-interview" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
              Mock Interview
            </Link>
            <Link href="/creator" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
              Creator
            </Link>
            <button
              onClick={() => { setMobileOpen(false); setShowFeedbackModal(true); }}
              className={mobileFeedbackClass}
            >
              <span>💬</span> Give Feedback
            </button>
            <div className={dividerClass}></div>
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className={dashboardBtnClass}>
                  Dashboard
                </Link>
                <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className={signOutBtnClass}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className={signInClass}>
                  Sign In
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)} className="btn btn-primary">
                  Get Started Free →
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <FeedbackModal
        open={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        user={user}
        platform={isAppPage ? 'web_dashboard' : 'web_landing'}
      />

      <AudioDiagnosticModal
        isOpen={showAudioDiagModal}
        onClose={() => setShowAudioDiagModal(false)}
      />
      </nav>
    </>
  );
}
