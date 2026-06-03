'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { friendlyAuthError } from '@/lib/auth';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      await sendPasswordResetEmail(auth, email, {
        // Land users back on the login page after they reset
        url: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/login`
          : `${process.env.NEXT_PUBLIC_APP_URL || 'https://javihai.in'}/auth/login`,
      });
      setStatus('sent');
    } catch (err) {
      setError(friendlyAuthError(err));
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-bounce">
            AI
          </div>
          <div>
            <div className="font-bold text-xl text-white">Interview AI</div>
            <div className="text-xs text-slate-400">Master Every Question</div>
          </div>
        </Link>

        <div className="card card-glow">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔑</div>
            <h1 className="text-2xl font-black mb-2">Reset your password</h1>
            <p className="text-slate-400 text-sm">
              Enter your email and we&apos;ll send you a secure reset link.
            </p>
          </div>

          {status === 'sent' ? (
            <div className="text-center">
              <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-300">
                ✓ <strong>Check your inbox.</strong> A reset link has been sent to{' '}
                <span className="font-medium text-white">{email}</span>.
              </div>
              <p className="text-slate-400 text-sm mb-6">
                The link expires in 1 hour. Didn&apos;t get it? Check your spam folder, then try again.
              </p>
              <Link href="/auth/login" className="btn btn-primary w-full">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                  ⚠️ {error}
                </div>
              )}
              <form onSubmit={handleReset} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn btn-primary w-full"
                  style={{ opacity: status === 'sending' ? 0.6 : 1 }}
                >
                  {status === 'sending' ? 'Sending…' : 'Send reset link →'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-400">
                Remembered it?{' '}
                <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
