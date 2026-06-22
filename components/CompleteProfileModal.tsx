'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from 'firebase/auth';

const EXPERIENCE_LEVELS = ['Fresher / Student', '0-1 years', '1-3 years', '3-6 years', '6+ years'];
const SOURCES = ['WhatsApp / Telegram group', 'LinkedIn', 'Reddit', 'Twitter / X', 'Instagram', 'YouTube', 'Google Search', 'Friend / Referral', 'Other'];
const SKIP_KEY = 'javihai_profile_prompt_skipped';

type ProfileDetails = { phone?: string; experienceLevel?: string; city?: string; referralSource?: string };

interface Props {
  user: User;
  onDone: (saved?: ProfileDetails) => void;
  initial?: ProfileDetails;
}

export default function CompleteProfileModal({ user, onDone, initial }: Props) {
  const [phone, setPhone] = useState(initial?.phone?.replace(/^\+91/, '') || '');
  const [experienceLevel, setExperienceLevel] = useState(initial?.experienceLevel || '');
  const [city, setCity] = useState(initial?.city || '');
  const [referralSource, setReferralSource] = useState(initial?.referralSource || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const skip = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem(SKIP_KEY, '1');
    onDone();
  };

  const save = async () => {
    setError('');
    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setSaving(true);
    try {
      const patch: Record<string, string> = { profileDetailsAddedAt: String(Date.now()) };
      if (phone.trim()) patch.phone = `+91${phone.trim()}`;
      if (experienceLevel) patch.experienceLevel = experienceLevel;
      if (city.trim()) patch.city = city.trim();
      if (referralSource) patch.referralSource = referralSource;
      await setDoc(doc(db, 'users', user.uid), patch, { merge: true });
      onDone({ phone: patch.phone, experienceLevel: patch.experienceLevel, city: patch.city, referralSource: patch.referralSource });
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4">
      <div className="card-glow card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">👋</div>
          <h2 className="text-2xl font-black mb-1">Just a couple more details</h2>
          <p className="text-slate-400 text-sm">Helps us personalize your AI answers. Totally optional — skip if you&apos;d rather not.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Mobile number</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 rounded-lg glass text-slate-300 text-sm">🇮🇳 +91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Experience level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select…</option>
              {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">City</label>
            <input
              type="text"
              placeholder="Bangalore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">How did you hear about us?</label>
            <select
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select…</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button onClick={skip} disabled={saving} className="btn btn-ghost flex-1">
            Skip for now
          </button>
          <button onClick={save} disabled={saving} className="btn btn-primary flex-1">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Whether this modal should be shown — missing phone AND not skipped this session. */
export function shouldShowProfilePrompt(userData: { phone?: string } | null): boolean {
  if (!userData) return false;
  if (userData.phone) return false;
  if (typeof window !== 'undefined' && sessionStorage.getItem(SKIP_KEY)) return false;
  return true;
}
