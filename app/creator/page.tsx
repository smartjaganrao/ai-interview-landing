'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface CreatorData {
  isCreator: boolean;
  code?: string;
  link?: string;
  status?: string;
  commissionBps?: number;
  totalEarned?: number;
  totalPaid?: number;
  pending?: number;
  referredCount?: number;
  payoutUpi?: string | null;
}

export default function CreatorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [upi, setUpi] = useState('');
  const [upiStatus, setUpiStatus] = useState<'' | 'saving' | 'saved' | 'error'>('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/creator/me', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }),
      });
      const d = await res.json();
      setData(d);
      if (d?.payoutUpi) setUpi(d.payoutUpi);
    } catch {
      setData({ isCreator: false });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/auth/login'); return; }
    if (user) load();
  }, [user, authLoading, router, load]);

  const join = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/creator/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }),
      });
      const d = await res.json();
      if (!d.error) setData(d);
    } finally {
      setJoining(false);
    }
  };

  const saveUpi = async () => {
    if (!user || !upi.includes('@')) { setUpiStatus('error'); return; }
    setUpiStatus('saving');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/creator/payout-method', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, upi }),
      });
      setUpiStatus(res.ok ? 'saved' : 'error');
    } catch {
      setUpiStatus('error');
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const pct = ((data?.commissionBps ?? 2000) / 100).toFixed(0);

  return (
    <>
      <section className="pt-32 pb-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          <div className="badge mb-4">🎬 Creator Program</div>

          {!data?.isCreator ? (
            /* ── Join CTA ───────────────────────────────────────────── */
            <div className="card card-glow">
              <h1 className="text-4xl font-black mb-3">Earn {pct}% recurring commission</h1>
              <p className="text-slate-400 text-lg mb-8 max-w-2xl">
                Promote JavihAI to your audience. Earn <strong className="text-white">{pct}% of every payment</strong> your
                referred users make — including renewals — for as long as they stay subscribed. Paid out to your UPI every month.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: '🔗', title: 'Your own link', desc: 'A vanity link to share in videos, bios, posts' },
                  { icon: '💸', title: `${pct}% recurring`, desc: 'On every payment, every renewal — not just the first' },
                  { icon: '📅', title: 'Monthly UPI payout', desc: 'Track earnings live, get paid to your UPI' },
                ].map((b, i) => (
                  <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-3xl mb-2">{b.icon}</div>
                    <div className="font-bold text-white mb-1">{b.title}</div>
                    <div className="text-sm text-slate-400">{b.desc}</div>
                  </div>
                ))}
              </div>

              <button onClick={join} disabled={joining} className="btn btn-primary btn-lg disabled:opacity-50">
                {joining ? 'Setting up…' : 'Become a Creator →'}
              </button>
              <p className="text-xs text-slate-500 mt-4">
                By joining you agree to our <Link href="/terms" className="text-indigo-400">Terms</Link>. Commission is paid on
                successful, non-refunded payments. Self-referrals don&apos;t qualify.
              </p>
            </div>
          ) : (
            /* ── Creator dashboard ──────────────────────────────────── */
            <>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
                <h1 className="text-4xl font-black">Creator Dashboard</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${data.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                  {data.status === 'active' ? '● Active' : data.status}
                </span>
              </div>

              {/* Earnings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { value: `₹${data.pending ?? 0}`, label: 'Pending payout', accent: 'text-green-400' },
                  { value: `₹${data.totalEarned ?? 0}`, label: 'Total earned', accent: 'text-white' },
                  { value: `₹${data.totalPaid ?? 0}`, label: 'Paid out', accent: 'text-white' },
                  { value: data.referredCount ?? 0, label: 'Users referred', accent: 'text-white' },
                ].map((s, i) => (
                  <div key={i} className="card py-5">
                    <div className={`text-3xl font-black ${s.accent}`}>{s.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Share link */}
              <div className="card mb-6">
                <h3 className="text-lg font-bold mb-2">Your creator link</h3>
                <p className="text-slate-400 text-sm mb-4">Share this anywhere. You earn {pct}% of every payment from anyone who signs up through it.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    readOnly value={data.link ?? ''} onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(data.link ?? '').then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
                    className="btn btn-primary whitespace-nowrap"
                  >
                    {copied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`I'm sharing JavihAI — India's cheapest AI interview copilot. Sign up with my link: ${data.link ?? ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    💬 Share on WhatsApp
                  </a>
                </div>
                <div className="mt-3 text-sm text-slate-500">Code: <span className="font-mono text-slate-300">{data.code}</span></div>
              </div>

              {/* Payout method */}
              <div className="card">
                <h3 className="text-lg font-bold mb-2">Payout details</h3>
                <p className="text-slate-400 text-sm mb-4">We pay your pending balance to this UPI ID each month.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text" placeholder="yourname@bank" value={upi}
                    onChange={(e) => { setUpi(e.target.value); setUpiStatus(''); }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button onClick={saveUpi} disabled={upiStatus === 'saving'} className="btn btn-secondary whitespace-nowrap disabled:opacity-50">
                    {upiStatus === 'saving' ? 'Saving…' : upiStatus === 'saved' ? '✓ Saved' : 'Save UPI'}
                  </button>
                </div>
                {upiStatus === 'error' && <p className="text-red-400 text-sm mt-2">Enter a valid UPI ID (e.g. name@bank).</p>}
                {upiStatus === 'saved' && <p className="text-green-400 text-sm mt-2">Payout UPI saved.</p>}
              </div>

              <p className="text-xs text-slate-500 mt-6">
                Commission accrues on successful payments and is reconciled against refunds. Payouts are made monthly once your
                pending balance clears the minimum threshold. Questions? <a href="mailto:sales@javihai.in" className="text-indigo-400">sales@javihai.in</a>
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
