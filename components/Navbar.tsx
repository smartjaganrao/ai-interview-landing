'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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
          <Link href="/#features" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
            Features
          </Link>
          <Link href="/pricing" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
            Pricing
          </Link>
          <Link href="/#reviews" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
            Reviews
          </Link>
          <Link href="/#faq" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
            FAQ
          </Link>
          <Link href="/mock-interview" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
            Mock Interview
          </Link>
          <Link href="/jobs" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
            Jobs
          </Link>
          <Link href="/resume" className="px-4 py-2 text-slate-300 hover:text-white transition-smooth rounded-lg hover:bg-white/5">
            Resume
          </Link>
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
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

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-smooth"
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass-heavy mt-3 mx-6 rounded-2xl p-6 animate-fade-in-up">
          <div className="flex flex-col gap-2">
            <Link href="/#features" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              Features
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              Pricing
            </Link>
            <Link href="/#reviews" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              Reviews
            </Link>
            <Link href="/#faq" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              FAQ
            </Link>
            <Link href="/mock-interview" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              🎯 Mock Interview
            </Link>
            <Link href="/jobs" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              💼 Jobs
            </Link>
            <Link href="/resume" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-smooth">
              📄 Resume Builder
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
