'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cachedGetDoc } from '@/lib/firestore-cache';
import { isOneTimePlan, PlanId } from '@/lib/pricing-config';

interface PopupCoupon {
  code: string;
  label: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  appliesTo: 'all' | PlanId;
  expiresAt: number;
}

const SHOW_DELAY_MS = 1500;

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * New-customer welcome offer — a daily deal, live only during the last hour
 * of each IST calendar day. expiresAt comes from getPopupCoupon() already
 * overridden to tonight's real midnight IST — a genuine, shared deadline
 * (same instant for every visitor), not a per-tab timer, so closing and
 * reopening this tab doesn't reset anything; the countdown always reflects
 * the real time left until this IST day actually ends. Only shown to
 * anonymous visitors and signed-in users with no active paid plan (see
 * [[dynamic-pricing]] skill for the coupon model this reads from). Closing
 * it only hides it for the current page view — dismissal isn't persisted,
 * so it reappears next time the daily window is open.
 */
export default function NewCustomerOfferPopup() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [popup, setPopup] = useState<PopupCoupon | null>(null);
  const [visible, setVisible] = useState(false);
  const [msRemaining, setMsRemaining] = useState(0);

  // Fetch the popup coupon and decide eligibility once auth state settles.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/coupons/featured');
        const data = await res.json();
        const p: PopupCoupon | null = data?.popup ?? null;
        // Belt-and-suspenders: the API already filters on expiresAt, but a
        // page that's been open a while before this fetch resolves could
        // still have a since-expired coupon in hand.
        if (!p || p.expiresAt <= Date.now() || cancelled) return;

        // "New customer" = anonymous, or signed in with no active paid plan.
        if (user) {
          const sub = await cachedGetDoc(`sub:${user.uid}`, 5 * 60 * 1000, () =>
            getDoc(doc(db, 'subscriptions', user.uid)).then((snap) =>
              snap.exists() ? { plan: snap.data().plan, status: snap.data().status } : null
            )
          );
          const hasActivePaidPlan = sub?.status === 'active' && sub.plan !== 'free';
          if (hasActivePaidPlan) return;
        }

        if (cancelled) return;
        setPopup(p);
        // Suppress the generic free-trial modal for this session so a new
        // visitor isn't shown two competing popups back to back — it
        // already checks for this exact key before firing its own timer.
        try { localStorage.setItem('trialModalDismissed', new Date().toDateString()); } catch { /* ignore */ }

        setTimeout(() => { if (!cancelled) setVisible(true); }, SHOW_DELAY_MS);
      } catch { /* non-fatal — no popup on fetch failure */ }
    })();

    return () => { cancelled = true; };
  }, [loading, user]);

  // Live countdown to the real, shared midnight-IST deadline; auto-close
  // once it actually passes (rather than lingering with a 00:00:00 display).
  useEffect(() => {
    if (!popup) return;
    const tick = () => {
      const remaining = popup.expiresAt - Date.now();
      setMsRemaining(remaining);
      if (remaining <= 0) setVisible(false);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [popup]);

  const handleClose = () => {
    setVisible(false);
  };

  const handleClaim = () => {
    if (!popup) return;
    const billing = isOneTimePlan(popup.appliesTo as PlanId) ? 'one-time' : 'monthly';
    handleClose();
    router.push(`/checkout?plan=${popup.appliesTo}&billing=${billing}&coupon=${encodeURIComponent(popup.code)}&autoApply=1`);
  };

  if (!visible || !popup || msRemaining <= 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-purple-500/30 shadow-2xl animate-fade-in-up overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <span className="text-white font-black text-lg">🔥 New Customer Offer</span>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <span className="text-white text-xl">✕</span>
          </button>
        </div>

        <div className="p-6 text-center">
          <p className="text-slate-300 mb-4">
            Welcome! As a new customer, claim{' '}
            <span className="text-white font-bold">
              {popup.discountType === 'percent' ? `${popup.discountValue}% off` : `₹${popup.discountValue} off`}
            </span>{' '}
            with code{' '}
            <span className="font-mono font-bold text-purple-300">{popup.code}</span>
            {popup.label ? ` — ${popup.label}` : ''}.
          </p>

          <div className="mb-6">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Today&apos;s offer ends in</div>
            <div className="text-3xl font-black text-white font-mono tabular-nums">
              {formatCountdown(msRemaining)}
            </div>
          </div>

          <button
            onClick={handleClaim}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
          >
            Claim Offer & Buy Now →
          </button>
          <p className="text-xs text-slate-500 mt-3">This is a limited-time offer for new customers only.</p>
        </div>
      </div>
    </div>
  );
}
