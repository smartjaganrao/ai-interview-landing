'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import { googleSignIn, ensureUserDocs, persistAttribution, friendlyAuthError } from '@/lib/auth';

interface GoogleSignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignedIn: (user: User) => void;
  title?: string;
  subtitle?: string;
}

export default function GoogleSignInModal({ open, onClose, onSignedIn, title, subtitle }: GoogleSignInModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const cred = await googleSignIn();
      if (!cred) return; // popup blocked → redirected to Google; resumes on reload
      await ensureUserDocs(cred.user);
      await persistAttribution(cred.user.uid);
      onSignedIn(cred.user);
    } catch (err) {
      setError(await friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sign in to download">
      <div className="bg-slate-900 rounded-2xl max-w-sm w-full border border-white/10 shadow-2xl animate-fade-in-up p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-white">{title || 'Sign in to download JavihAI'}</h2>
            <p className="text-sm text-slate-400 mt-1">{subtitle || 'One free Google sign-in, then your download starts instantly.'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close"
          >
            <span className="text-white text-xl">✕</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.92l-3.87-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11C3.25 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.27V6.62H1.28A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.28 5.38l3.99-3.11z" />
            <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.62l3.99 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
          </svg>
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p className="text-xs text-slate-500 text-center mt-4">
          Free forever for freshers · No card needed
        </p>
      </div>
    </div>
  );
}
