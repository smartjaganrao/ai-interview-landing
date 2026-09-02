'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface Announcement { id: string; title: string; body: string; link: string | null; createdAt: number }

const SEEN_KEY = 'javihai_announcements_seen_at';

function WhatsNewBell() {
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

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={toggleOpen} aria-label="What's new" className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-smooth">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 glass-heavy rounded-2xl p-3 z-50 animate-fade-in-up max-h-[70vh] flex flex-col">
            <div className="px-3 py-2 text-base font-bold text-white mb-1">What&apos;s New</div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {items.map((a) => (
                <a
                  key={a.id}
                  href={a.link || undefined}
                  className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-smooth"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="text-sm font-semibold text-white leading-snug">{a.title}</div>
                    {a.link && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
                        Open
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-2">{a.body}</p>
                  <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
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

const BANNER_DISMISS_KEY_PREFIX = 'offerBannerDismissed:';

/**
 * Slim announcement-bar strip above the nav row, inside the same fixed
 * container as the rest of Navbar so the two share one box instead of
 * fighting over `top-0` — see [[dynamic-pricing]] skill for the coupon
 * model this reads from. Same /api/coupons/featured `coupon` field the
 * /pricing page's inline card already shows (NewCustomerOfferPopup is a
 * separate flow, for the `popup` field). Shown to all visitors, no
 * auth/plan targeting. Dismissal is keyed by coupon code in localStorage,
 * so closing it stays closed for that code but a newly-featured coupon
 * shows again.
 */
function OfferBanner() {
  const [coupon, setCoupon] = useState<FeaturedCoupon | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/coupons/featured')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c: FeaturedCoupon | null = d?.coupon ?? null;
        if (!c) return;
        try {
          if (localStorage.getItem(`${BANNER_DISMISS_KEY_PREFIX}${c.code}`)) return;
        } catch { /* ignore */ }
        setCoupon(c);
      })
      .catch(() => {});
  }, []);

  if (!coupon || dismissed) return null;

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
          onClick={() => {
            try { localStorage.setItem(`${BANNER_DISMISS_KEY_PREFIX}${coupon.code}`, '1'); } catch { /* ignore */ }
            setDismissed(true);
          }}
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

const APP_PATHS = ['/dashboard', '/resume', '/jobs', '/mock-interview', '/creator'];

export default function Navbar() {
  const pathname = usePathname();
  const isAppPage = APP_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-smooth ${
      scrolled ? 'glass-heavy py-3' : 'py-5'
    }`}>
      <OfferBanner />
      <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-10 w-10 group-hover:scale-110 transition-bounce">
            <img src="/logo.svg" alt="JavihAI" className="h-10 w-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            <div className="absolute inset-0 h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg" style={{display:'none'}} id="logo-fallback">J</div>
          </div>
          <div>
            <div className="font-bold text-lg text-white">JavihAI</div>
            <div className="text-xs text-slate-400 -mt-1">Master Every Question</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {isAppPage ? (
            <>
              <Link href="/" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Home
              </Link>
              <Link href="/dashboard" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Dashboard
              </Link>
              <Link href="/resume" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Resume Builder
              </Link>
              <Link href="/jobs" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Jobs
              </Link>
              <Link href="/mock-interview" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Mock Interview
              </Link>
              <Link href="/pricing" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Plans
              </Link>
            </>
          ) : (
            <>
              <Link href="/#how-it-works" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                How It Works
              </Link>
              <Link href="/#features" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Features
              </Link>
              <Link href="/#why" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Desi Mode
              </Link>
              <Link href="/#reviews" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Reviews
              </Link>
              <Link href="/pricing" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Pricing
              </Link>
              <Link href="/blog" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                Blog
              </Link>
              <Link href="/#faq" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
                FAQ
              </Link>
            </>
          )}
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          <WhatsNewBell />
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard" className="btn btn-secondary">
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="btn btn-ghost">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="btn btn-signin">
                  Sign In
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile: bell + menu button */}
        <div className="md:hidden flex items-center gap-1">
          <WhatsNewBell />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-smooth"
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
      {mobileOpen && (
        <div className="md:hidden glass-heavy mt-3 mx-6 rounded-2xl p-6 animate-fade-in-up">
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
                  Resume Builder
                </Link>
                <Link href="/jobs" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Jobs
                </Link>
                <Link href="/mock-interview" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Mock Interview
                </Link>
                <Link href="/pricing" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Plans
                </Link>
              </>
            ) : (
              <>
                <Link href="/#how-it-works" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  How It Works
                </Link>
                <Link href="/#features" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Features
                </Link>
                <Link href="/#why" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Desi Mode
                </Link>
                <Link href="/#reviews" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Reviews
                </Link>
                <Link href="/pricing" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Pricing
                </Link>
                <Link href="/blog" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  Blog
                </Link>
                <Link href="/#faq" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
                  FAQ
                </Link>
              </>
            )}
            <div className="h-px bg-white/10 my-2"></div>
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn btn-secondary">
                  Dashboard
                </Link>
                <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className="btn btn-ghost">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn btn-signin">
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
    </nav>
  );
}
