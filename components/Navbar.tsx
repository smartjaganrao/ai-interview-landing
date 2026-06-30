'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
          <div className="absolute right-0 top-full mt-2 w-80 glass-heavy rounded-2xl p-2 z-50 animate-fade-in-up">
            <div className="px-3 py-2 text-sm font-semibold text-white">What&apos;s New</div>
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
              {items.map((a) => (
                <a
                  key={a.id}
                  href={a.link || undefined}
                  className="px-3 py-2 rounded-xl hover:bg-white/5 transition-smooth block"
                  onClick={() => setOpen(false)}
                >
                  <div className="text-sm font-medium text-white">{a.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.body}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(a.createdAt).toLocaleDateString()}</div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
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
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
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
          <Link href="/#how-it-works" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5" title="Learn how JavihAI works in 3 minutes">
            How It Works
          </Link>
          <Link href="/#features" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5" title="Explore all AI-powered features">
            ✨ Features
          </Link>
          <Link href="/#coding-rounds" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5" title="HackerRank, LeetCode & more">
            💻 Coding Help
          </Link>
          <Link href="/pricing" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5" title="Free & paid plans starting at ₹499/mo">
            Pricing
          </Link>
          <Link href="/#reviews" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5" title="Success stories from 2,400+ candidates">
            👥 Success Stories
          </Link>
          <Link href="/#faq" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5" title="Common questions answered">
            ❓ FAQ
          </Link>
          <Link href="/blog" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5" title="Interview tips & resources">
            📝 Resources
          </Link>
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
                <>
                  <Link href="/auth/login" className="btn btn-ghost">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn btn-primary">
                    Get Started Free →
                  </Link>
                </>
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
            <Link href="/#how-it-works" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              🚀 How It Works
            </Link>
            <Link href="/#features" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              ✨ Features
            </Link>
            <Link href="/#coding-rounds" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              💻 Coding Help
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              💰 Pricing
            </Link>
            <Link href="/#reviews" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              👥 Success Stories
            </Link>
            <Link href="/#faq" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              ❓ FAQ
            </Link>
            <Link href="/blog" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              📝 Resources
            </Link>
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
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn btn-ghost">
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
