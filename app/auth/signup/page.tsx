'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getRedirectResult, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { googleSignIn, ensureUserDocs, friendlyAuthError } from '@/lib/auth';
import { PLANS, PlanId, AnyPlanId, migratePlanId, isPaidPlan } from '@/lib/pricing-config';

const REF_STORAGE_KEY = 'javihai_ref';
const VIA_STORAGE_KEY = 'javihai_via';

/** Claim a stored peer-referral code (if any) once the user is authenticated. */
async function claimReferralIfPending(user: User) {
  try {
    const code = typeof window !== 'undefined' ? localStorage.getItem(REF_STORAGE_KEY) : null;
    if (!code) return;
    const idToken = await user.getIdToken();
    await fetch('/api/referral/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, code }),
    });
  } catch {
    /* referral is a bonus — never block signup on it */
  } finally {
    if (typeof window !== 'undefined') localStorage.removeItem(REF_STORAGE_KEY);
  }
}

/** Attribute a stored creator code (if any) once the user is authenticated. */
async function attributeCreatorIfPending(user: User) {
  try {
    const code = typeof window !== 'undefined' ? localStorage.getItem(VIA_STORAGE_KEY) : null;
    if (!code) return;
    const idToken = await user.getIdToken();
    await fetch('/api/creator/attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, code }),
    });
  } catch {
    /* creator attribution is best-effort — never block signup */
  } finally {
    if (typeof window !== 'undefined') localStorage.removeItem(VIA_STORAGE_KEY);
  }
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const rawPlan = searchParams.get('plan') || 'free';
  const plan = migratePlanId(rawPlan as AnyPlanId) as PlanId;
  const ref = searchParams.get('ref');

  const planConfig = PLANS.find(p => p.id === plan) || PLANS[0];

  // Persist the referral code so it survives the Google OAuth redirect round-trip.
  useEffect(() => {
    if (ref && typeof window !== 'undefined') {
      localStorage.setItem(REF_STORAGE_KEY, ref);
    }
  }, [ref]);

  // Handle Google redirect result (when popup falls back to redirect)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (cred) => {
        if (cred) {
          await ensureUserDocs(cred);
          await claimReferralIfPending(cred.user);
          await attributeCreatorIfPending(cred.user);
          router.push(isPaidPlan(plan) ? `/checkout?plan=${plan}` : '/dashboard');
        }
      })
      .catch(async (err) => setError(await friendlyAuthError(err)));
  }, [router, plan]);

  useEffect(() => {
    if (!loading && user) {
      if (plan === 'pro' || plan === 'power') {
        router.push(`/checkout?plan=${plan}`);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, plan]);

  const handleGoogleSignup = async () => {
    setError('');
    setIsLoading(true);
    try {
      const cred = await googleSignIn();
      if (!cred) return; // redirect in progress; result handled on return
      await ensureUserDocs(cred);
      await claimReferralIfPending(cred.user);
      await attributeCreatorIfPending(cred.user);
      if (plan === 'pro' || plan === 'power') {
        router.push(`/checkout?plan=${plan}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(await friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="relative grid lg:grid-cols-2 gap-12 max-w-6xl w-full">
        {/* Left: Marketing */}
        <div className="hidden lg:flex flex-col justify-center">
          <Link href="/" className="flex items-center gap-3 mb-8 group">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-bounce">
              AI
            </div>
            <div>
              <div className="font-bold text-xl text-white">JavihAI</div>
              <div className="text-xs text-slate-400">Master Every Question</div>
            </div>
          </Link>

          <h1 className="text-5xl font-black mb-6 leading-tight">
            Start Your Journey to <span className="text-gradient">Interview Mastery</span>
          </h1>

          <p className="text-xl text-slate-300 mb-10">
            Join 2,400+ candidates getting AI-powered interview prep
          </p>

          <div className="space-y-5">
            {[
              { icon: '🎯', title: 'Free Forever Plan', desc: '10 AI answers per day, no credit card required' },
              { icon: '🚀', title: 'Setup in 30 Seconds', desc: 'Sign up with Google, download app, start practicing' },
              { icon: '🔒', title: 'Private & Secure', desc: 'Your data is encrypted end-to-end' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-2 text-sm text-slate-400">
            <div className="flex -space-x-2">
              {['👩‍💻', '👨‍💼', '👩‍🔬', '👨‍🎨'].map((emoji, i) => (
                <div key={i} className="w-8 h-8 rounded-full glass flex items-center justify-center text-sm border-2 border-slate-900">
                  {emoji}
                </div>
              ))}
            </div>
            <span>Joined by 2,400+ successful candidates</span>
          </div>
        </div>

        {/* Right: Sign Up */}
        <div className="flex items-center justify-center">
          <div className="card-glow card w-full max-w-md">
            <Link href="/" className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">AI</div>
              <span className="font-bold text-lg">JavihAI</span>
            </Link>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black mb-2">Create your account</h2>
              <p className="text-slate-400">
                {plan !== 'free' ? `Sign up to get ${planConfig.name} plan` : 'Free forever, no credit card required'}
              </p>
            </div>

            {plan !== 'free' && (
              <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
                <div className="text-sm text-indigo-300 flex items-center gap-2">
                  <span className="text-xl">{planConfig.emoji}</span>
                  After signup, you&apos;ll proceed to {plan.toUpperCase()} checkout
                </div>
              </div>
            )}

            {ref && (
              <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <div className="text-sm text-green-300 flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  You were invited! Get <strong>₹100 off</strong> your first plan after signup.
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full btn btn-secondary flex items-center justify-center gap-3 disabled:opacity-50 py-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-base font-semibold">{isLoading ? 'Creating account…' : 'Continue with Google'}</span>
            </button>

            <p className="text-center text-slate-500 text-xs mt-8">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                Sign In
              </Link>
            </p>

            <p className="text-center text-xs text-slate-500 mt-3">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-slate-400 underline hover:text-slate-300">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-slate-400 underline hover:text-slate-300">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div></div>}>
      <SignupContent />
    </Suspense>
  );
}
