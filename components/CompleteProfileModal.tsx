'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from 'firebase/auth';

const EXPERIENCE_LEVELS = ['Fresher / Student', '0-1 years', '1-3 years', '3-6 years', '6+ years'];
const SOURCES = ['WhatsApp / Telegram group', 'LinkedIn', 'Reddit', 'Twitter / X', 'Instagram', 'YouTube', 'Google Search', 'Friend / Referral', 'Other'];

type ProfileDetails = { phone?: string; experienceLevel?: string; city?: string; referralSource?: string };

interface Props {
  user: User;
  onDone: (saved: ProfileDetails) => void;
  initial?: ProfileDetails;
}

export default function CompleteProfileModal({ user, onDone, initial }: Props) {
  const [phone, setPhone] = useState(initial?.phone?.replace(/^\+91/, '') || '');
  const [experienceLevel, setExperienceLevel] = useState(initial?.experienceLevel || '');
  const [city, setCity] = useState(initial?.city || '');
  const [referralSource, setReferralSource] = useState(initial?.referralSource || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Mandatory dialog — no backdrop-click or Escape dismissal, and focus the
  // first field so keyboard/screen-reader users land here immediately
  // instead of being stuck on whatever was focused on the page underneath.
  useEffect(() => {
    setMounted(true);
    const focusTimer = setTimeout(() => phoneInputRef.current?.focus(), 50);
    const blockEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') e.preventDefault(); };
    document.addEventListener('keydown', blockEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', blockEscape);
      document.body.style.overflow = '';
    };
  }, []);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone.trim());

  const save = async () => {
    setError('');
    if (!isValidPhone) {
      setError('Enter a valid 10-digit Indian mobile number to continue.');
      phoneInputRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const patch: Record<string, string> = {
        phone: `+91${phone.trim()}`,
        profileDetailsAddedAt: String(Date.now()),
      };
      if (experienceLevel) patch.experienceLevel = experienceLevel;
      if (city.trim()) patch.city = city.trim();
      if (referralSource) patch.referralSource = referralSource;
      await setDoc(doc(db, 'users', user.uid), patch, { merge: true });
      onDone({ phone: patch.phone, experienceLevel: patch.experienceLevel, city: patch.city, referralSource: patch.referralSource });
    } catch {
      setError('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Render into <body> via a portal so the overlay escapes any ancestor
  // stacking context the dashboard creates (its animate-float / blur-3xl /
  // transform layers). Without this, a position:fixed overlay nested inside
  // a transformed parent is trapped in that parent's stacking context — it
  // renders, but other page chrome (chat widget, navbar) can sit on top and
  // swallow clicks/typing. That was the "can't click or type" bug.
  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 px-4"
      style={{ zIndex: 2147483647 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-profile-title"
    >
      <div className="card-glow card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">📱</div>
          <h2 id="complete-profile-title" className="text-2xl font-black mb-1">Add your mobile number to continue</h2>
          <p className="text-slate-400 text-sm">Required once to access your dashboard. The other details below are optional.</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="cp-phone" className="block text-sm text-slate-400 mb-1.5">
              Mobile number <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 rounded-lg glass text-slate-300 text-sm">🇮🇳 +91</span>
              <input
                id="cp-phone"
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                aria-required="true"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => { if (e.key === 'Enter' && isValidPhone) save(); }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cp-exp" className="block text-sm text-slate-400 mb-1.5">Experience level <span className="text-slate-600">(optional)</span></label>
            <select
              id="cp-exp"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select…</option>
              {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="cp-city" className="block text-sm text-slate-400 mb-1.5">City <span className="text-slate-600">(optional)</span></label>
            <input
              id="cp-city"
              type="text"
              placeholder="Bangalore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="cp-source" className="block text-sm text-slate-400 mb-1.5">How did you hear about us? <span className="text-slate-600">(optional)</span></label>
            <select
              id="cp-source"
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select…</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button onClick={save} disabled={saving || !isValidPhone} className="btn btn-primary w-full mt-7">
          {saving ? 'Saving…' : 'Continue to Dashboard'}
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/** Always required — shown whenever the user has no phone on file. No skip/dismiss path. */
export function shouldShowProfilePrompt(userData: { phone?: string } | null): boolean {
  if (!userData) return false;
  return !userData.phone;
}
