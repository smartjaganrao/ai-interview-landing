'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { googleSignIn, ensureUserDocs, friendlyAuthError, persistAttribution, isProfileComplete } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CompleteProfileModal from '@/components/CompleteProfileModal';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fetchedUserData, setFetchedUserData] = useState<any>(null);
  const [pendingAuth, setPendingAuth] = useState(false);

  // Handle Google redirect result (when popup falls back to redirect)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (cred) => {
        if (cred) {
          setPendingAuth(true);
          await ensureUserDocs(cred);
          await persistAttribution(cred.user.uid);

          const userRef = doc(db, 'users', cred.user.uid);
          const snap = await getDoc(userRef);
          const userData = snap.exists() ? snap.data() as Record<string, unknown> : null;

          if (!isProfileComplete(userData)) {
            setFetchedUserData(userData);
            setShowProfileModal(true);
            setPendingAuth(false);
            return;
          }
          setPendingAuth(false);
          router.push('/dashboard');
        } else {
          setPendingAuth(false);
        }
      })
      .catch(async (err) => {
        setPendingAuth(false);
        setError(await friendlyAuthError(err));
      });
  }, [router]);

  useEffect(() => {
    if (!loading && user && !pendingAuth) {
      router.push('/dashboard');
    }
  }, [user, loading, router, pendingAuth]);

  const handleGoogleLogin = async () => {
    setPendingAuth(true);
    setError('');
    setIsLoading(true);
    try {
      const cred = await googleSignIn();
      if (!cred) {
        setPendingAuth(false);
        return; // redirect in progress; result handled on return
      }
      await ensureUserDocs(cred);
      await persistAttribution(cred.user.uid);

      const userRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userRef);
      const userData = snap.exists() ? snap.data() as Record<string, unknown> : null;

      if (!isProfileComplete(userData)) {
        setFetchedUserData(userData);
        setShowProfileModal(true);
        setPendingAuth(false);
        return;
      }
      setPendingAuth(false);
      router.push('/dashboard');
    } catch (err) {
      setPendingAuth(false);
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
            Welcome Back to <span className="text-gradient">Your AI Coach</span>
          </h1>

          <p className="text-xl text-slate-300 mb-10">
            Continue your journey to interview mastery
          </p>

          <div className="card glass-heavy">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">💡</div>
              <h3 className="text-xl font-bold">Pro Tip</h3>
            </div>
            <p className="text-slate-300 leading-relaxed italic">
              &ldquo;Use the AI feedback to identify your weakest answers. Practice those first, and watch your confidence grow exponentially.&rdquo;
            </p>
            <p className="text-sm text-slate-400 mt-3">— Sarah Chen, hired at Google</p>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
            <span className="text-yellow-400 text-lg">★★★★★</span>
            <span>4.9/5 from 2,400+ candidates</span>
          </div>
        </div>

        {/* Right: Sign In */}
        <div className="flex items-center justify-center">
          <div className="card-glow card w-full max-w-md">
            <Link href="/" className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">AI</div>
              <span className="font-bold text-lg">JavihAI</span>
            </Link>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black mb-2">Welcome back 👋</h2>
              <p className="text-slate-400">Sign in to continue practicing</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full btn btn-secondary flex items-center justify-center gap-3 disabled:opacity-50 py-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-base font-semibold">{isLoading ? 'Signing in…' : 'Continue with Google'}</span>
            </button>

            <p className="text-center text-slate-500 text-xs mt-8">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                Sign Up Free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {showProfileModal && user && (
        <CompleteProfileModal
          user={user}
          onDone={() => {
            setShowProfileModal(false);
            router.push('/dashboard');
          }}
          initial={{
            phone: (fetchedUserData?.phone as string) || undefined,
            fullName: (fetchedUserData?.fullName as string) || (fetchedUserData?.profile?.fullName as string) || user.displayName || '',
            whatsapp: (fetchedUserData?.whatsapp as string) || (fetchedUserData?.profile?.whatsapp as string) || (fetchedUserData?.phone as string) || '',
            experienceLevel: (fetchedUserData?.experienceLevel as string) || (fetchedUserData?.profile?.experienceLevel as string) || undefined,
            city: (fetchedUserData?.city as string) || (fetchedUserData?.profile?.city as string) || undefined,
            jobRole: (fetchedUserData?.jobRole as string) || (fetchedUserData?.profile?.jobRole as string) || undefined,
            referralSource: (fetchedUserData?.referralSource as string) || (fetchedUserData?.acquisition?.customerSelectedSource as string) || undefined,
          }}
        />
      )}
    </div>
  );
}
