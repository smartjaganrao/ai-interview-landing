'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cachedGetDoc } from '@/lib/firestore-cache';
import type { User } from 'firebase/auth';

const EXPERIENCE_LEVELS = ['Fresher / Student', '0-1 years', '1-3 years', '3-6 years', '6+ years'];
const ACQUISITION_SOURCES = [
  'Google Search',
  'Instagram',
  'YouTube',
  'WhatsApp',
  'Friend / Referral',
  'College / Placement',
  'LinkedIn',
  'Creator / Influencer',
  'Other',
];

type ProfileDetails = {
  phone?: string;
  fullName?: string;
  whatsapp?: string;
  experienceLevel?: string;
  jobRole?: string;
  city?: string;
  referralSource?: string;
  profileCompleted?: boolean;
};

interface Props {
  user: User;
  onDone: (saved: ProfileDetails) => void;
  initial?: ProfileDetails;
}

function stripCountryCode(phone?: string): string {
  return phone?.replace(/^\+91/, '') || '';
}

export default function CompleteProfileModal({ user, onDone, initial }: Props) {
  const [fullName, setFullName] = useState(initial?.fullName || user.displayName || '');
  const [whatsapp, setWhatsApp] = useState(stripCountryCode(initial?.whatsapp || initial?.phone) || '');
  const [experienceLevel, setExperienceLevel] = useState(initial?.experienceLevel || '');
  const [jobRole, setJobRole] = useState(initial?.jobRole || '');
  const [city, setCity] = useState(initial?.city || '');
  const [acquisitionSource, setAcquisitionSource] = useState(initial?.referralSource || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const whatsappInputRef = useRef<HTMLInputElement>(null);

  // Mandatory dialog — no backdrop-click or Escape dismissal, and focus the
  // first field so keyboard/screen-reader users land here immediately
  useEffect(() => {
    setMounted(true);
    const focusTimer = setTimeout(() => whatsappInputRef.current?.focus(), 50);
    const blockEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') e.preventDefault(); };
    document.addEventListener('keydown', blockEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', blockEscape);
      document.body.style.overflow = '';
    };
  }, []);

  const isValidWhatsApp = /^[6-9]\d{9}$/.test(whatsapp.trim());
  const isValidForm = fullName.trim() && isValidWhatsApp && experienceLevel && jobRole.trim() && city.trim() && acquisitionSource;

  const save = async () => {
    setError('');
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidWhatsApp) {
      setError('Enter a valid 10-digit Indian mobile number to continue.');
      whatsappInputRef.current?.focus();
      return;
    }
    if (!experienceLevel) {
      setError('Please select your experience level.');
      return;
    }
    if (!jobRole.trim()) {
      setError('Please enter your job role.');
      return;
    }
    if (!city.trim()) {
      setError('Please enter your city.');
      return;
    }
    if (!acquisitionSource) {
      setError('Please select how you heard about us.');
      return;
    }

    setSaving(true);
    try {
      const whatsAppNumber = `+91${whatsapp.trim()}`;
      const patch: Record<string, unknown> = {
        profile: {
          fullName: fullName.trim(),
          whatsapp: whatsAppNumber,
          experienceLevel,
          jobRole: jobRole.trim(),
          city: city.trim(),
          profileCompleted: true,
          profileCompletedAt: Date.now(),
        },
        acquisition: {
          customerSelectedSource: acquisitionSource,
        },
        // Backward compatibility for existing UI paths
        phone: whatsAppNumber,
        fullName: fullName.trim(),
        experienceLevel,
        city: city.trim(),
      };

      const userRef = doc(db, 'users', user.uid);
      const snapData = await cachedGetDoc<Record<string, unknown>>(`user:${user.uid}`, 60 * 1000, () =>
        getDoc(userRef).then((snap) => snap.exists() ? (snap.data() as Record<string, unknown>) : null)
      );
      if (!snapData) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email ?? '',
          name: user.displayName || 'there',
          plan: 'free',
          createdAt: Date.now(),
          settings: { theme: 'dark', language: 'en' },
          ...patch,
        });
      } else {
        await setDoc(userRef, patch, { merge: true });
      }
      // Fire-and-forget welcome notification — never blocks profile completion.
      user.getIdToken()
        .then((idToken) =>
          fetch('/api/notifications/whatsapp-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          })
        )
        .catch(() => {});

      onDone({
        phone: whatsAppNumber,
        fullName: fullName.trim(),
        whatsapp: whatsAppNumber,
        experienceLevel,
        jobRole: jobRole.trim(),
        city: city.trim(),
        referralSource: acquisitionSource,
        profileCompleted: true,
      });
    } catch {
      setError('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 px-4"
      style={{ zIndex: 2147483647 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-profile-title"
    >
      <div className="card-glow card w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">📱</div>
          <h2 id="complete-profile-title" className="text-2xl font-black mb-1">Complete your profile</h2>
          <p className="text-slate-400 text-sm">Help us personalize your JavihAI experience and keep you updated about your account.</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <label htmlFor="cp-name" className="block text-sm text-slate-400 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              id="cp-name"
              type="text"
              required
              aria-required="true"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="cp-exp" className="block text-sm text-slate-400 mb-1.5">
              Experience Level <span className="text-red-400">*</span>
            </label>
            <select
              id="cp-exp"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select…</option>
              {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="cp-whatsapp" className="block text-sm text-slate-400 mb-1.5">
              WhatsApp Number <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 rounded-lg glass text-slate-300 text-sm">🇮🇳 +91</span>
              <input
                id="cp-whatsapp"
                ref={whatsappInputRef}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                aria-required="true"
                placeholder="98765 43210"
                value={whatsapp}
                onChange={(e) => setWhatsApp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => { if (e.key === 'Enter' && isValidForm) save(); }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cp-role" className="block text-sm text-slate-400 mb-1.5">
              Job Role <span className="text-red-400">*</span>
            </label>
            <input
              id="cp-role"
              type="text"
              required
              aria-required="true"
              placeholder="e.g. Software Engineer, Product Manager"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isValidForm) save(); }}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="cp-city" className="block text-sm text-slate-400 mb-1.5">
              City <span className="text-red-400">*</span>
            </label>
            <input
              id="cp-city"
              type="text"
              required
              aria-required="true"
              placeholder="e.g. Bangalore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isValidForm) save(); }}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="cp-source" className="block text-sm text-slate-400 mb-1.5">
              How did you hear about JavihAI? <span className="text-red-400">*</span>
            </label>
            <select
              id="cp-source"
              value={acquisitionSource}
              onChange={(e) => setAcquisitionSource(e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select…</option>
              {ACQUISITION_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button onClick={save} disabled={saving || !isValidForm} className="btn btn-primary w-full mt-7">
          {saving ? 'Saving…' : 'Continue to JavihAI'}
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function shouldShowProfilePrompt(userData: Record<string, unknown> | null | undefined): boolean {
  return !isProfileComplete(userData);
}

export function isProfileComplete(userData: Record<string, unknown> | null | undefined): boolean {
  if (!userData) return false;

  if (userData.profileCompleted === true) return true;

  const profile = userData.profile as Record<string, unknown> | undefined;
  if (profile) {
    return !!(
      (profile.fullName as string)?.trim() &&
      (profile.whatsapp as string)?.trim() &&
      (profile.experienceLevel as string)?.trim() &&
      (profile.jobRole as string)?.trim() &&
      (profile.city as string)?.trim() &&
      (userData.acquisition as Record<string, unknown>)?.customerSelectedSource
    );
  }

  return false;
}
