'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { buildWhatsAppLink, getWhatsAppDisplayNumber } from '@/lib/whatsapp-link';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { onOfferPopupVisibility } from '@/lib/offer-popup-events';

interface Announcement { id: string; title: string; body: string; link: string | null; createdAt: number }

const SEEN_KEY = 'javihai_announcements_seen_at';

function WhatsNewBell({ isHomePage = false }: { isHomePage?: boolean }) {
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

  // Same isHomePage-branch convention as the rest of Navbar.tsx — the
  // dropdown panel isn't inside `.home-light`'s DOM subtree, so it needs its
  // own inline light variant rather than relying on a CSS override.
  const triggerClass = isHomePage
    ? 'relative p-2 rounded-lg text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)] transition-smooth'
    : 'relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-smooth';
  const panelClass = isHomePage
    ? 'absolute right-0 top-full mt-2 w-96 bg-white/95 backdrop-blur-xl border border-[rgba(26,21,18,0.08)] shadow-xl rounded-2xl p-3 z-50 animate-fade-in-up max-h-[70vh] flex flex-col'
    : 'absolute right-0 top-full mt-2 w-96 glass-heavy rounded-2xl p-3 z-50 animate-fade-in-up max-h-[70vh] flex flex-col';
  const panelHeadingClass = isHomePage ? 'px-3 py-2 text-base font-bold text-[#1A1512] mb-1' : 'px-3 py-2 text-base font-bold text-white mb-1';
  const itemClass = isHomePage
    ? 'block rounded-xl border border-[rgba(26,21,18,0.08)] bg-[rgba(26,21,18,0.03)] px-4 py-3 hover:bg-[rgba(26,21,18,0.06)] transition-smooth'
    : 'block rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-smooth';
  const itemTitleClass = isHomePage ? 'text-sm font-semibold text-[#1A1512] leading-snug' : 'text-sm font-semibold text-white leading-snug';
  const itemBodyClass = isHomePage ? 'text-sm text-[#57534E] leading-relaxed mb-2' : 'text-sm text-slate-300 leading-relaxed mb-2';
  const itemDateClass = isHomePage ? 'text-xs text-[#78716C]' : 'text-xs text-slate-500';

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

  return (
    <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm">
      <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-6 py-2 flex items-center justify-center gap-3 text-sm text-white relative">
        <span className="font-semibold text-center">
          🎟️ Use code{' '}
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
function SupportNumberLink({ compact = false, isHomePage = false }: { compact?: boolean; isHomePage?: boolean }) {
  const waLink = buildWhatsAppLink("Hi! I'd like to talk to JavihAI support.");
  const display = getWhatsAppDisplayNumber();
  if (!waLink || !display) return null;

  const linkClass = isHomePage
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

import FeedbackModal from '@/components/FeedbackModal';
import { AudioDiagnosticModal } from '@/components/AudioDiagnosticModal';

const APP_PATHS = ['/dashboard', '/resume', '/jobs', '/mock-interview', '/creator'];

export default function Navbar() {
  const pathname = usePathname();
  const isAppPage = APP_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  // Only the homepage renders inside `.home-light` (see globals.css) — every
  // other marketing page (pricing, blog, compare/*, etc.) keeps the current
  // dark nav. Mirrors the isAppPage pattern above.
  const isHomePage = pathname === '/';
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

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  // Light-nav link styling only ever applies on `/` (isHomePage), which is
  // the only route rendered inside `.home-light`. Every other marketing
  // page keeps the dark `text-slate-300 hover:text-white` treatment.
  const marketingLinkClass = isHomePage
    ? 'px-3.5 py-2 text-[#57534E] hover:text-[#1A1512] transition-smooth rounded-lg hover:bg-[rgba(26,21,18,0.05)] text-sm'
    : 'px-3.5 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5 text-sm';
  const marketingMobileLinkClass = isHomePage
    ? 'px-4 py-3 text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)] rounded-lg transition-smooth'
    : 'px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth';

  // Same isHomePage pattern as marketingLinkClass above, extended to every
  // other nav element that hardcoded dark-theme colors — Mic Check/Feedback
  // buttons, Sign In/Sign Out/Dashboard, the hamburger icon, and the mobile
  // menu's divider. Navbar renders outside `.home-light`'s DOM subtree (see
  // globals.css), so these can't be fixed via a `.home-light` CSS override
  // without risking that same selector reaching LandingClient's own
  // intentionally-dark content — inline arbitrary-value classes here keep
  // the fix local to Navbar only, matching how marketingLinkClass already
  // does it.
  const iconBtnClass = isHomePage
    ? 'p-1.5 text-xs text-[#57534E] hover:text-[#1A1512] flex items-center gap-1'
    : 'p-1.5 text-xs text-slate-300 hover:text-white flex items-center gap-1';
  const micCheckClass = isHomePage
    ? 'px-2.5 py-1.5 rounded-lg text-teal-700 hover:text-teal-900 hover:bg-teal-500/10 border border-teal-600/25 transition-smooth text-xs font-medium flex items-center gap-1.5'
    : 'px-2.5 py-1.5 rounded-lg text-teal-300 hover:text-white hover:bg-teal-500/10 border border-teal-500/20 transition-smooth text-xs font-medium flex items-center gap-1.5';
  const feedbackBtnClass = isHomePage
    ? 'px-3 py-1.5 rounded-lg text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)] transition-smooth text-xs font-medium flex items-center gap-1.5'
    : 'px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-smooth text-xs font-medium flex items-center gap-1.5';
  const signInClass = isHomePage
    ? 'btn text-[#1A1512] bg-white/70 border border-[rgba(26,21,18,0.15)] hover:bg-white'
    : 'btn btn-signin';
  const dashboardBtnClass = isHomePage
    ? 'btn text-[#1E5FA8] bg-[rgba(30,144,255,0.06)] border border-[rgba(30,144,255,0.25)] hover:bg-[rgba(139,43,226,0.08)]'
    : 'btn btn-secondary';
  const signOutBtnClass = isHomePage
    ? 'btn text-[#57534E] hover:text-[#1A1512] hover:bg-[rgba(26,21,18,0.05)]'
    : 'btn btn-ghost';
  const hamburgerBtnClass = isHomePage
    ? 'p-2 rounded-lg text-[#1A1512] hover:bg-[rgba(26,21,18,0.06)] transition-smooth'
    : 'p-2 rounded-lg text-white hover:bg-white/10 transition-smooth';
  const mobileMicClass = isHomePage
    ? 'px-4 py-3 text-teal-700 hover:text-teal-900 hover:bg-[rgba(26,21,18,0.05)] rounded-lg transition-smooth text-left flex items-center gap-2 font-medium'
    : 'px-4 py-3 text-teal-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth text-left flex items-center gap-2 font-medium';
  const mobileFeedbackClass = isHomePage
    ? 'px-4 py-3 text-indigo-700 hover:text-indigo-900 hover:bg-[rgba(26,21,18,0.05)] rounded-lg transition-smooth text-left flex items-center gap-2 font-medium'
    : 'px-4 py-3 text-indigo-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth text-left flex items-center gap-2 font-medium';
  const dividerClass = isHomePage ? 'h-px bg-[rgba(26,21,18,0.1)] my-2' : 'h-px bg-white/10 my-2';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-smooth ${
      scrolled ? `${isHomePage ? 'nav-light-solid' : 'nav-solid'} py-3` : 'py-5'
    }`}>
      <OfferBanner />
      <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-10 w-10 group-hover:scale-110 transition-bounce">
            <Image src="/logo.svg" alt="JavihAI" width={40} height={40} unoptimized className="h-10 w-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            <div className="absolute inset-0 h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg" style={{display:'none'}} id="logo-fallback">J</div>
          </div>
          <div>
            <div className={`font-bold text-lg ${isHomePage ? 'text-[#1A1512]' : 'text-white'}`}>JavihAI</div>
            <div className={`text-xs -mt-1 ${isHomePage ? 'text-[#78716C]' : 'text-slate-400'}`}>Master Every Question</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {isAppPage ? (
            <>
              <Link href="/" className="px-3.5 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5 text-sm">
                Home
              </Link>
              <Link href="/dashboard" className="px-3.5 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5 text-sm">
                Dashboard
              </Link>
              <Link href="/resume" className="px-3.5 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5 text-sm">
                Resume
              </Link>
              <Link href="/jobs" className="px-3.5 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5 text-sm">
                Jobs
              </Link>
              <Link href="/mock-interview" className="px-3.5 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5 text-sm">
                Mocks
              </Link>
              <Link href="/pricing" className="px-3.5 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5 text-sm">
                Pricing
              </Link>
            </>
          ) : (
            <>
              <Link href="/#how-it-works" className={marketingLinkClass}>
                How It Works
              </Link>
              <Link href="/pricing" className={marketingLinkClass}>
                Pricing
              </Link>
              <Link href="/compare" className={marketingLinkClass}>
                Compare
              </Link>
              <Link href="/blog" className={marketingLinkClass}>
                Blog
              </Link>
              <Link href="/#faq" className={marketingLinkClass}>
                FAQ
              </Link>
            </>
          )}
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setShowAudioDiagModal(true)}
            className={micCheckClass}
            title="Pre-Interview Audio & Mic Check"
          >
            <span>🎧</span>
            <span>Mic Check</span>
          </button>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className={feedbackBtnClass}
            title="Give Feedback"
          >
            <span>💬</span>
            <span>Feedback</span>
          </button>
          <SupportNumberLink isHomePage={isHomePage} />
          <WhatsNewBell isHomePage={isHomePage} />
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
        <div className="md:hidden flex items-center gap-0.5">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className={iconBtnClass}
          >
            💬
          </button>
          <SupportNumberLink compact isHomePage={isHomePage} />
          <WhatsNewBell isHomePage={isHomePage} />
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
        <div className={isHomePage
          ? 'md:hidden bg-white/95 backdrop-blur-xl border border-[rgba(26,21,18,0.08)] shadow-xl mt-3 mx-6 rounded-2xl p-6 animate-fade-in-up'
          : 'md:hidden glass-heavy mt-3 mx-6 rounded-2xl p-6 animate-fade-in-up'
        }>
          <div className="flex flex-col gap-2">
            {isAppPage ? (
              <>
                <Link href="/" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Home
                </Link>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Dashboard
                </Link>
                <Link href="/resume" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Resume
                </Link>
                <Link href="/jobs" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Jobs
                </Link>
                <Link href="/mock-interview" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Mocks
                </Link>
                <Link href="/pricing" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Pricing
                </Link>
              </>
            ) : (
              <>
                <Link href="/#how-it-works" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
                  How It Works
                </Link>
                <Link href="/pricing" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
                  Pricing
                </Link>
                <Link href="/compare" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
                  Compare
                </Link>
                <Link href="/blog" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
                  Blog
                </Link>
                <Link href="/#faq" onClick={() => setMobileOpen(false)} className={marketingMobileLinkClass}>
                  FAQ
                </Link>
              </>
            )}
            <button
              onClick={() => { setMobileOpen(false); setShowAudioDiagModal(true); }}
              className={mobileMicClass}
            >
              <span>🎧</span> Mic & Audio Diagnostics
            </button>
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
  );
}
