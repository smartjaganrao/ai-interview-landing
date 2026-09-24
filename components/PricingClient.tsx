'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cachedGetDoc } from '@/lib/firestore-cache';
import Footer from '@/components/Footer';
import {
  PLANS,
  PlanId,
  AnyPlanId,
  PLAN_RANK,
  migratePlanId,
  isOneTimePlan,
  isPlanHighlighted,
  getPlanBadge,
  getPlanUsageLabel,
  isPricingHealthy,
  getPlanDurationMs,
} from '@/lib/pricing-config';

interface Offer { active: boolean; label: string; percentOff: number; appliesTo: 'all' | PlanId; expiresAt: number | null }
interface Pricing { plans: { free: { oneTime: number; displayOrder: number }; quick_pass: { oneTime: number; displayOrder: number }; pro: { oneTime: number; displayOrder: number }; power: { monthly: number; yearly: number; displayOrder: number } }; offer: Offer; degraded?: boolean }
interface FeaturedCoupon { code: string; label: string; discountType: 'percent' | 'flat'; discountValue: number; appliesTo: 'all' | PlanId }

function offerActiveFor(offer: Offer | undefined, planId: PlanId): boolean {
  if (!offer || !offer.active || offer.percentOff <= 0 || planId === 'free') return false;
  if (offer.expiresAt && Date.now() > offer.expiresAt) return false;
  return offer.appliesTo === 'all' || offer.appliesTo === planId;
}

interface PricingClientProps {
  initialPricing: Pricing | null;
}

const PLAN_MARKETING_PROPS: Record<PlanId, {
  mrp: number | null;
  discountBadge: string | null;
  microBreakdown: string;
  equivalence: string;
  emoji: string;
}> = {
  free: {
    mrp: null,
    discountBadge: null,
    microBreakdown: '15 answers / day',
    equivalence: 'Test mic, audio & 15 answers (5 per mode)',
    emoji: '🎯',
  },
  quick_pass: {
    mrp: 699,
    discountBadge: '50% OFF',
    microBreakdown: '₹14 / hour',
    equivalence: 'Cheaper than 1 Swiggy Biryani',
    emoji: '🍕',
  },
  pro: {
    mrp: 2999,
    discountBadge: '57% OFF',
    microBreakdown: '₹185 / day',
    equivalence: 'Cost of 1 dinner with friends',
    emoji: '🍽️',
  },
  power: {
    mrp: 5999,
    discountBadge: '58% OFF',
    microBreakdown: '₹83 / day',
    equivalence: 'Less than daily tapri chai + snack',
    emoji: '☕',
  },
};

export default function PricingClient({ initialPricing }: PricingClientProps) {
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  // Seeded from the server-fetched value (see app/pricing/page.tsx) so real
  // prices are already in the initial HTML — a plain useState(null) here
  // meant every price on this page was invisible to any crawler that can't
  // run JS (confirmed live: curl'd the production page, zero ₹ figures and
  // zero FAQ text in the raw response). Still re-fetched below via the
  // existing useEffect so an admin toggling a discount mid-visit is
  // reflected without a reload — this only fixes what ships in the FIRST
  // paint, not ongoing freshness.
  const [pricing, setPricing] = useState<Pricing | null>(initialPricing);
  const [featuredCoupon, setFeaturedCoupon] = useState<FeaturedCoupon | null>(null);
  const [couponCopied, setCouponCopied] = useState(false);
  const [sharedUnlocked, setSharedUnlocked] = useState(false);
  const [targetLpa, setTargetLpa] = useState<number>(14);
  const [currentLpa, setCurrentLpa] = useState<number>(4);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    cachedGetDoc<Pricing>(
      'pricing:public',
      60 * 1000,
      () => fetch('/api/pricing').then((r) => r.json()),
      isPricingHealthy
    ).then(setPricing).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/coupons/featured').then((r) => r.json()).then((d) => setFeaturedCoupon(d.coupon)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    // Firebase (client SDK) is dynamic-imported here, not statically at the
    // top of this file — lib/firebase.ts re-throws if client-SDK init fails
    // (e.g. no window/indexedDB), and a static import evaluates at MODULE
    // LOAD time, which happens during SSR too. A throw there took down this
    // entire component's server render silently: confirmed live, curling
    // the production build with this file statically importing `db` showed
    // a completely empty page body — no prices, no header, no FAQ, nothing,
    // even though none of that content depends on Firebase at all. Same
    // pattern hooks/useAuth.ts already uses for the same reason.
    (async () => {
      const [{ db }, { doc, getDoc }] = await Promise.all([
        import('@/lib/firebase'),
        import('firebase/firestore'),
      ]);
      cachedGetDoc(`sub:${user.uid}`, 5 * 60 * 1000, () =>
        getDoc(doc(db, 'subscriptions', user.uid)).then((snap) =>
          snap.exists() ? { plan: snap.data().plan, status: snap.data().status } : null
        )
      ).then((result) => {
        if (result?.status === 'active') {
          setCurrentPlan(migratePlanId(result.plan as AnyPlanId));
        }
      }).catch(() => {});
    })();
  }, [user]);

  const handleSelectPlan = (planId: PlanId) => {
    if (!user) {
      router.push(`/auth/signup?plan=${planId}`);
      return;
    }
    if (planId === 'free' || planId === currentPlan) {
      router.push('/dashboard');
      return;
    }
    const isOneTime = isOneTimePlan(planId);
    const currentIsOneTime = isOneTimePlan(currentPlan);
    if (!isOneTime && !currentIsOneTime && PLAN_RANK[planId] < PLAN_RANK[currentPlan as PlanId]) {
      router.push('/dashboard');
      return;
    }
    const billing = isOneTime ? 'one-time' : 'monthly';
    // Prefill coupon code into checkout input
    const activeCoupon = sharedUnlocked
      ? 'CAMPUS100'
      : (featuredCoupon && (featuredCoupon.appliesTo === 'all' || featuredCoupon.appliesTo === planId) ? featuredCoupon.code : '');
    const couponParam = activeCoupon ? `&coupon=${encodeURIComponent(activeCoupon)}` : '';
    router.push(`/checkout?plan=${planId}&billing=${billing}${couponParam}`);
  };

  const getPlanCta = (planId: PlanId, defaultCta: string) => {
    if (!user) return defaultCta;
    if (planId === currentPlan) return 'Current Plan';
    const isOneTime = isOneTimePlan(planId);
    const currentIsOneTime = isOneTimePlan(currentPlan);
    if (!isOneTime && !currentIsOneTime && PLAN_RANK[planId] < PLAN_RANK[currentPlan as PlanId]) return 'Contact support';
    if (currentPlan !== 'free') return `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`;
    return defaultCta;
  };

  const isPlanDisabled = (planId: PlanId) => {
    if (!user) return false;
    if (planId === currentPlan) return true;
    const isOneTime = isOneTimePlan(planId);
    const currentIsOneTime = isOneTimePlan(currentPlan);
    if (!isOneTime && !currentIsOneTime && PLAN_RANK[planId] < PLAN_RANK[currentPlan as PlanId]) return true;
    return false;
  };

  const sortedPlans = [...PLANS].sort((a, b) => {
    const aOrder = pricing?.plans?.[a.id]?.displayOrder ?? a.displayOrder;
    const bOrder = pricing?.plans?.[b.id]?.displayOrder ?? b.displayOrder;
    return aOrder - bOrder;
  });

  return (
    <>
      <section className="pt-12 sm:pt-16 md:pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="badge mb-4">🇮🇳 The World&apos;s Only Truly Unlimited AI Interview Copilot</div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              India&apos;s 1st <span className="text-gradient">Unlimited Plan</span>
            </h1>
            <p className="text-lg md:text-xl text-[#57534E] max-w-2xl mx-auto mb-6">
              Other tools charge $150–$300/mo by the hour and cut off mid-interview. JavihAI gives you 100% Unlimited Interview Time, Zero Hourly Caps, and Full Indian Context (CTC in LPA, 90-day notice period) at the world&apos;s most affordable price.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[#0B63C7] text-xs sm:text-sm font-bold">
              ♾️ ZERO HOURLY CAPS · NO TICKING TIMERS · NEVER CUTS OFF MID-INTERVIEW
            </div>
          </div>

          {/* A coupon always replaces the offer at checkout, never stacks
              with it — but that's a per-transaction rule, not a display
              rule. Only suppress the generic offer banner here when the
              featured coupon is itself site-wide (appliesTo: 'all'); a
              plan-specific coupon shouldn't hide the offer from visitors
              browsing a different plan the coupon doesn't cover. */}
          {featuredCoupon && (
            <div className="max-w-2xl mx-auto mb-4 -mt-6">
              <div className="card text-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 py-4">
                <span className="text-[#8B2BE2] font-semibold">
                  🎟️ Use code{' '}
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(featuredCoupon.code).catch(() => {});
                      setCouponCopied(true);
                      setTimeout(() => setCouponCopied(false), 2000);
                    }}
                    className="underline decoration-dotted underline-offset-4 hover:text-[#1A1512]"
                    title="Copy code"
                  >
                    {featuredCoupon.code}
                  </button>{' '}
                  for {featuredCoupon.discountType === 'percent' ? `${featuredCoupon.discountValue}% off` : `₹${featuredCoupon.discountValue} off`}
                  {featuredCoupon.appliesTo !== 'all' &&
                    ` on ${PLANS.find((p) => p.id === featuredCoupon.appliesTo)?.name ?? featuredCoupon.appliesTo}`}
                  {featuredCoupon.label ? ` — ${featuredCoupon.label}` : ''}
                  {couponCopied && <span className="ml-2 text-[#15803D]">Copied!</span>}
                </span>
              </div>
            </div>
          )}
          {(!featuredCoupon || featuredCoupon.appliesTo !== 'all') &&
            pricing?.offer?.active && pricing.offer.percentOff > 0 &&
            (!pricing.offer.expiresAt || Date.now() < pricing.offer.expiresAt) && (
              <div className="max-w-2xl mx-auto mb-10 -mt-6">
                <div className="card text-center bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 py-4">
                  <span className="text-[#15803D] font-semibold">
                    🎉 {pricing.offer.label || `Limited offer — ${pricing.offer.percentOff}% off`}
                  </span>
                </div>
              </div>
            )}

          {/* Pricing cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {sortedPlans.map((plan) => {
              const isOneTime = plan.billingType === 'one_time';
              const planPricing = pricing?.plans?.[plan.id];
              const base: { oneTime?: number; monthly?: number; yearly?: number } = planPricing ?? { oneTime: 0, monthly: 0, yearly: 0 };
              const cyclePrice = isOneTime
                ? (base.oneTime ?? 0)
                : (plan.id === 'power' ? base.monthly ?? 0 : base.oneTime ?? 0);
              // A paid plan pricing at exactly ₹0 is always a broken read
              // (settings/pricing unreachable), never a real price — treat it
              // the same as "not loaded yet" so it shows "—" instead of ₹0.
              // A `degraded` response is NOT the same thing: pricingFallback()
              // (lib/firebase-admin.ts) serves the pricing-fallback-sync
              // snapshot in that case — a real, recently-synced price, safe
              // to show because checkout charges this exact same number via
              // getDynamicPricing(). Hiding it just makes a working checkout
              // look broken.
              const hasPricing = !!planPricing && cyclePrice > 0;
              const offerOn = offerActiveFor(pricing?.offer, plan.id);
              const effCycle = offerOn && hasPricing
                ? Math.max(1, Math.round(cyclePrice * (1 - pricing!.offer.percentOff / 100)))
                : cyclePrice;
              const highlighted = isPlanHighlighted(plan.id);
              const badge = getPlanBadge(plan.id);
              const usageLabel = getPlanUsageLabel(plan.id);
              // "Save ₹X vs buying Quick Pass every day" — a real, verifiable
              // comparison (Quick Pass's own live price × how many Quick-Pass-
              // days this plan covers, via the same getPlanDurationMs() every
              // expiresAt call site uses), NOT a fabricated "original price"
              // for this plan itself — Pro/Power were never priced at that
              // higher number, so this must never render as a strikethrough
              // of THIS plan's own price (that would be a false "was ₹X" claim).
              // Quick Pass and Free are excluded — there's nothing to compare
              // Quick Pass to but itself, and Free isn't a purchase.
              const quickPassDailyRate = pricing?.plans?.quick_pass?.oneTime ?? 0;
              const daysCovered = getPlanDurationMs(plan.id) / (24 * 60 * 60 * 1000);
              const vsQuickPassCost = quickPassDailyRate * daysCovered;
              const savingsVsQuickPass =
                hasPricing && quickPassDailyRate > 0 && (plan.id === 'pro' || plan.id === 'power')
                  ? Math.round(vsQuickPassCost - effCycle)
                  : 0;
              return (
              <div
                key={plan.id}
                className={`relative card card-glow ${highlighted ? 'md:scale-105 border-purple-500/50' : ''}`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full gradient-primary text-white text-xs font-semibold whitespace-nowrap">
                      {badge}
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} items-center justify-center text-3xl mb-4`}>
                    {plan.emoji}
                  </div>
                  <h3 className="text-2xl font-bold text-[#1A1512] mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#57534E] mb-4">{plan.tagline}</p>

                  {plan.id === 'free' ? (
                    <div className="mb-2">
                      <div className="text-4xl font-black text-[#1A1512] mb-1">Free</div>
                      <p className="text-xs text-[#78716C]">Forever free · No credit card required</p>
                    </div>
                  ) : (
                    <div className="mb-2">
                      {/* Strikethrough List Price (MRP) + Discount Badge */}
                      {PLAN_MARKETING_PROPS[plan.id].mrp && (
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                          <span className="text-xs text-[#78716C] font-medium">MRP:</span>
                          <span className="text-base font-bold text-[#78716C] line-through">
                            ₹{PLAN_MARKETING_PROPS[plan.id].mrp?.toLocaleString('en-IN')}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-green-500/20 text-[#15803D] border border-green-500/30">
                            {PLAN_MARKETING_PROPS[plan.id].discountBadge}
                          </span>
                        </div>
                      )}

                      {/* Actual Sale Price (Customer Pays) */}
                      <div className="flex items-baseline justify-center gap-1 mb-1">
                        {hasPricing ? (
                          <>
                            <span className="text-5xl font-black text-[#1A1512]">₹{cyclePrice}</span>
                            {isOneTime ? (
                              <span className="text-[#57534E] font-semibold text-sm">one-time</span>
                            ) : (
                              <span className="text-[#57534E] font-semibold text-sm">/mo</span>
                            )}
                          </>
                        ) : (
                          <span className="text-5xl font-black text-[#1A1512]">—</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Micro-Breakdown & Real-World Equivalence Card */}
                  <div className="my-3 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-xs font-black text-[#0B63C7]">
                      <span>⚡</span>
                      <span>{PLAN_MARKETING_PROPS[plan.id].microBreakdown}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#15803D]">
                      {PLAN_MARKETING_PROPS[plan.id].emoji} {PLAN_MARKETING_PROPS[plan.id].equivalence}
                    </p>
                  </div>

                  {savingsVsQuickPass > 0 && (
                    <p className="text-xs text-[#15803D] font-semibold mb-1">💰 Save ₹{savingsVsQuickPass} vs buying Quick Pass daily</p>
                  )}
                  {plan.id === 'quick_pass' && (
                    <p className="text-[11px] text-[#15803D] font-semibold mb-1">🟢 Save ~₹1,650 vs 1-on-1 human mock sessions</p>
                  )}
                  {plan.id === 'pro' && (
                    <p className="text-[11px] text-[#15803D] font-semibold mb-1">🟢 Save ₹2,200 vs Chiku AI (₹3,499/mo)</p>
                  )}
                  {plan.id === 'power' && (
                    <p className="text-[11px] text-[#15803D] font-semibold mb-1">🟢 Save ~₹5,400/mo vs Final Round AI (₹7,916/mo)</p>
                  )}
                  <p className="text-xs text-[#78716C] mb-1">{usageLabel}</p>
                </div>

                {user && plan.id === currentPlan && (
                  <div className="mb-3 text-center">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-[#15803D] text-xs font-semibold">✓ Your current plan</span>
                  </div>
                )}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isPlanDisabled(plan.id)}
                  className={`w-full mb-6 ${highlighted && !isPlanDisabled(plan.id) ? 'btn btn-primary' : 'btn btn-secondary'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getPlanCta(plan.id, plan.cta)}{getPlanCta(plan.id, plan.cta) === 'Current Plan' ? '' : ' →'}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#15803D] text-xs">✓</span>
                      </div>
                      <span className="text-[#57534E]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              );
            })}
          </div>

          {/* Viral Campus & Hostel WhatsApp Share Section */}
          <div className="mt-12 max-w-5xl mx-auto space-y-4">
            <div className="card bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-emerald-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-[#15803D] text-xs font-bold">
                  🎓 College Student &amp; Fresher Viral Unlock
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1A1512]">
                  Share in Your College WhatsApp Group &amp; Unlock <span className="text-gradient">Flat ₹100 OFF</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#57534E]">
                  Forward JavihAI to your batchmates or hostel group. Once shared, unlock coupon <strong className="text-[#1A1512]">CAMPUS100</strong> to get an instant ₹100 off your Quick Pass or Pro Pass!
                </p>
                {sharedUnlocked && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-xs font-bold text-[#15803D]">
                    🎉 Coupon Unlocked: <span className="font-mono underline">CAMPUS100</span> (Automatically applies at checkout)
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 flex flex-col gap-2 w-full md:w-auto">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    "🚨 Guys, if anyone has an online assessment (OA) or interview this week (TCS, Infosys, Amazon, Swiggy):\n\nCheck this invisible AI copilot — it listens on Google Meet & Zoom and live-types optimal DSA code & STAR HR answers directly on your screen without the interviewer seeing it.\n\nTest it free here: https://javihai.in"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSharedUnlocked(true)}
                  className="btn bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-6 shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2 text-sm"
                >
                  <span className="text-lg">📲</span>
                  <span>Share to WhatsApp Group</span>
                </a>
                <p className="text-[11px] text-[#78716C] text-center">
                  1-Click open WhatsApp with pre-filled message
                </p>
              </div>
            </div>

            {/* Hostel 5-Pack Group Buy Banner */}
            <div className="card bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border-purple-500/25 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl flex-shrink-0">
                  🏢
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1512]">
                    Living in a Hostel? Grab the 5-Friend Batchmate Pass for ₹999
                  </h4>
                  <p className="text-xs text-[#57534E]">
                    Pool ₹200 with 4 roommates and get 5 Quick Passes — only ₹199 each (Save ₹150 per person)!
                  </p>
                </div>
              </div>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  "Bhai log, JavihAI has a 5-pass hostel bundle for ₹999 (₹199 each instead of ₹349). Let's pool ₹200 each and grab it for our placement rounds this week! Check it out: https://javihai.in/pricing"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs font-bold whitespace-nowrap py-2 px-4 flex items-center gap-1.5"
              >
                <span>💬</span>
                <span>Share Split Deal with 4 Roommates</span>
              </a>
            </div>
          </div>

          {/* The Ticking Meter vs JavihAI Unlimited */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="badge mb-3">♾️ True Infinite Access</div>
              <h2 className="text-3xl md:text-4xl font-black mb-3">
                Why JavihAI Beats <span className="text-gradient">Every Competitor in the World</span>
              </h2>
              <p className="text-[#57534E] max-w-2xl mx-auto">
                Other tools charge like a 1990s cyber café — counting every minute, cutting you off mid-interview, and charging $30–$50 overtime penalties. JavihAI gives you 100% truly unlimited access with zero clock anxiety.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⏳</span>
                  <h3 className="text-xl font-bold text-red-600">US &amp; Global Competitors</h3>
                </div>
                <p className="text-xs text-[#78716C] mb-4">Final Round AI, Parakeet, Cluely, Interview Coder</p>
                <ul className="space-y-3 text-sm text-[#57534E]">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>Metered by the hour:</strong> Strict 120–240 minute caps per month.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>Shuts down mid-interview:</strong> If your interview runs 5 minutes over, the AI stops answering live.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>Overtime penalties:</strong> Forces expensive $30–$50 top-ups just to finish a round.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>Absurdly expensive:</strong> $149 to $299/mo (₹12,500 – ₹25,000/mo) in USD.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>Zero Indian context:</strong> Doesn&apos;t know Indian CTC in LPA, 90-day notice periods, or service-to-product company switches.</span>
                  </li>
                </ul>
              </div>

              <div className="card border-green-500/30 bg-green-500/5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">♾️</span>
                  <h3 className="text-xl font-bold text-[#15803D]">JavihAI — India&apos;s #1 Copilot</h3>
                </div>
                <p className="text-xs text-[#15803D] font-semibold mb-4">The World&apos;s Only Truly Unlimited AI Interview Assistant</p>
                <ul className="space-y-3 text-sm text-[#57534E]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803D] font-bold">✓</span>
                    <span><strong>100% Truly Unlimited:</strong> No hourly meters. No minute counters. Zero clock anxiety.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803D] font-bold">✓</span>
                    <span><strong>Never cuts off:</strong> If your interview runs 2 hours, JavihAI stays active the entire time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803D] font-bold">✓</span>
                    <span><strong>Zero overtime surcharges:</strong> Single transparent flat price. No surprise charges ever.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803D] font-bold">✓</span>
                    <span><strong>Affordable for everyone:</strong> 1-click UPI, Google Pay, PhonePe, Paytm &amp; RuPay INR.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803D] font-bold">✓</span>
                    <span><strong>Full Desi Mode:</strong> Built-in prompts for CTC negotiation in LPA, 90-day notice periods, and Indian company interview patterns.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Career ROI Calculator */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="card bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border-indigo-500/30 p-6 md:p-8">
              <div className="text-center mb-8">
                <div className="badge mb-3">📈 Return on Investment</div>
                <h2 className="text-3xl font-black text-[#1A1512] mb-2">Calculate Your Career ROI</h2>
                <p className="text-[#57534E] text-sm max-w-xl mx-auto">
                  See how much money you stand to gain by clearing your next tech interview with JavihAI.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-[#57534E]">Current CTC:</span>
                      <span className="text-[#1A1512] font-black text-base">{currentLpa} LPA (₹{Math.round((currentLpa * 100000) / 12).toLocaleString('en-IN')}/mo)</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="25"
                      step="1"
                      value={currentLpa}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurrentLpa(val);
                        if (val >= targetLpa) setTargetLpa(val + 3);
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#78716C] mt-1">
                      <span>3 LPA</span>
                      <span>10 LPA</span>
                      <span>25 LPA</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-[#57534E]">Target CTC:</span>
                      <span className="text-[#15803D] font-black text-base">{targetLpa} LPA (₹{Math.round((targetLpa * 100000) / 12).toLocaleString('en-IN')}/mo)</span>
                    </div>
                    <input
                      type="range"
                      min={Math.max(4, currentLpa + 1)}
                      max="40"
                      step="1"
                      value={targetLpa}
                      onChange={(e) => setTargetLpa(Number(e.target.value))}
                      className="w-full accent-green-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#78716C] mt-1">
                      <span>{currentLpa + 1} LPA</span>
                      <span>20 LPA</span>
                      <span>40 LPA</span>
                    </div>
                  </div>
                </div>

                <div className="card bg-white/70 border border-indigo-500/20 shadow-sm p-6 text-center space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#78716C] font-semibold mb-1">Your Extra Monthly Income</div>
                    <div className="text-4xl font-black text-[#15803D]">
                      +₹{Math.max(0, Math.round(((targetLpa - currentLpa) * 100000) / 12)).toLocaleString('en-IN')}<span className="text-lg font-normal text-[#57534E]">/mo</span>
                    </div>
                    <p className="text-xs text-[#57534E] mt-1">
                      That is an extra <strong>₹{Math.max(0, targetLpa - currentLpa).toFixed(1)} Lakhs</strong> in your bank account every year.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[rgba(26,21,18,0.08)]">
                    <div className="text-xs text-[#78716C] mb-1">Quick Pass Investment:</div>
                    <div className="text-sm font-bold text-[#1A1512]">
                      Less than {(((pricing?.plans?.quick_pass?.oneTime ?? 349) / Math.max(1, (targetLpa * 100000) / 12)) * 100).toFixed(2)}% of your 1st month salary
                    </div>
                    <p className="text-xs text-[#EF4444] font-medium mt-1">
                      ⚠️ Staying stuck in your current job costs you ₹{Math.max(0, Math.round(((targetLpa - currentLpa) * 100000) / 12)).toLocaleString('en-IN')} every single month you delay.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectPlan('quick_pass')}
                    className="btn btn-primary w-full text-sm font-bold"
                  >
                    Secure Your {targetLpa} LPA Offer Now →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus Stack Section */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="badge mb-3">🎁 Free Limited-Time Bonuses</div>
              <h2 className="text-3xl md:text-4xl font-black text-[#1A1512] mb-3">
                Included Free With Every Paid Pass <span className="text-gradient">(Worth ₹5,996)</span>
              </h2>
              <p className="text-[#57534E] max-w-2xl mx-auto">
                When you unlock any JavihAI pass today, you don&apos;t just get the live AI copilot — you also receive our complete Indian interview crasher bundle for 100% free.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  emoji: '🔓',
                  title: '2026 OA Question Leak Vault',
                  value: '₹1,999',
                  desc: 'Top 100 repeated coding & System Design questions asked at TCS, Infosys, Amazon, and Swiggy with optimal Python/Java solutions.',
                },
                {
                  emoji: '💼',
                  title: '100% CTC Hike Negotiation Playbook',
                  value: '₹1,499',
                  desc: 'Exact counter-offer scripts to handle "What is your current/expected CTC?" and squeeze an extra ₹2–5 Lakhs out of HR.',
                },
                {
                  emoji: '⏱️',
                  title: '90-Day Notice Period Defense Scripts',
                  value: '₹999',
                  desc: 'Proven STAR-method answers to handle early joining demands, buyout discussions, and managerial pressure.',
                },
                {
                  emoji: '📄',
                  title: '1-Click ATS Resume Prompt Optimizer',
                  value: '₹1,499',
                  desc: 'AI prompt pack to reformat your experience bullet points and match high-paying job descriptions on Naukri and LinkedIn.',
                },
              ].map((bonus, i) => (
                <div key={i} className="card card-glow flex flex-col justify-between">
                  <div>
                    <div className="text-3xl mb-3">{bonus.emoji}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs line-through text-[#78716C]">{bonus.value}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-[#15803D]">FREE</span>
                    </div>
                    <h4 className="font-bold text-[#1A1512] text-sm mb-2">{bonus.title}</h4>
                    <p className="text-xs text-[#57534E] leading-relaxed">{bonus.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(26,21,18,0.1)]">
                    <th className="text-left py-4 px-4 text-[#57534E] font-medium">Feature</th>
                    {sortedPlans.map(plan => (
                      <th key={plan.id} className={`text-center py-4 px-4 ${plan.id === 'power' ? 'text-[#8B2BE2]' : 'text-[#1A1512]'} font-semibold`}>
                        {plan.name}
                        {plan.badge && <div className="text-xs text-[#8B2BE2] mt-1">{plan.badge}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                    {[
                      { name: 'Price', getValue: (p: typeof PLANS[0]) => {
                        if (p.id === 'free') return 'Free';
                        const planPricing = pricing?.plans?.[p.id];
                        if (!planPricing) return '—';
                        const pricingData = planPricing as { oneTime?: number; monthly?: number };
                        if (p.billingType === 'subscription') {
                          const monthly = pricingData.monthly ?? 0;
                          // ₹0 on a paid plan is always a broken read, never a real price.
                          return monthly > 0 ? `₹${monthly}/mo` : '—';
                        }
                        const oneTime = pricingData.oneTime ?? 0;
                        return oneTime > 0 ? `₹${oneTime}` : '—';
                      } },
                    { name: 'Billing', getValue: (p: typeof PLANS[0]) => p.id === 'free' ? '—' : p.billingType === 'subscription' ? 'Monthly' : 'One-time' },
                    { name: 'Validity', getValue: (p: typeof PLANS[0]) => p.id === 'free' ? 'Forever' : getPlanUsageLabel(p.id) },
                    { name: 'Hourly / Minute Limits', getValue: (p: typeof PLANS[0]) => p.id === 'free' ? '15 answers/day (5 per mode)' : '♾️ 100% Unlimited' },
                    { name: 'Mid-Interview Cutoff', getValue: (p: typeof PLANS[0]) => p.id === 'free' ? 'Daily cap' : 'Never cuts off' },
                    { name: 'Overtime Penalty Fees', getValue: () => '₹0 (None)' },
                    { name: 'Desi Mode (CTC & Notice Period)', getValue: (p: typeof PLANS[0]) => p.id === 'free' ? 'Basic' : '✓ Full' },
                    { name: 'AI Interview Assistant', getValue: () => '✓' },
                    { name: 'Voice Mode', getValue: () => '✓' },
                    { name: 'Screen Mode', getValue: () => '✓' },
                    { name: 'Coding Interview Support', getValue: () => '✓' },
                    { name: 'HR Interview Support', getValue: () => '✓' },
                    { name: 'Mock Interview', getValue: (p: typeof PLANS[0]) => p.id === 'power' ? '✓' : '—' },
                    { name: 'AI Interview Evaluation', getValue: (p: typeof PLANS[0]) => p.id === 'power' ? '✓' : '—' },
                    { name: 'AI Interview Score', getValue: (p: typeof PLANS[0]) => p.id === 'power' ? '✓' : '—' },
                    { name: 'Resume Analysis', getValue: (p: typeof PLANS[0]) => ['pro', 'power'].includes(p.id) ? '✓' : '—' },
                    { name: 'Company-specific support', getValue: (p: typeof PLANS[0]) => ['pro', 'power'].includes(p.id) ? '✓' : '—' },
                    { name: 'Performance Analytics', getValue: (p: typeof PLANS[0]) => p.id === 'power' ? '✓' : '—' },
                    { name: 'Personalized Improvement Plan', getValue: (p: typeof PLANS[0]) => p.id === 'power' ? '✓' : '—' },
                    { name: 'Priority Support', getValue: (p: typeof PLANS[0]) => p.id === 'power' ? '✓' : '—' },
                    { name: 'Early Access Features', getValue: (p: typeof PLANS[0]) => p.id === 'power' ? '✓' : '—' },
                    { name: '1-Click UPI & Razorpay INR', getValue: (p: typeof PLANS[0]) => p.id === 'free' ? '—' : '✓' },
                  ].map((feature, i) => (
                    <tr key={i} className="border-b border-[rgba(26,21,18,0.06)] last:border-0">
                      <td className="py-3 px-4 text-[#57534E]">{feature.name}</td>
                      {sortedPlans.map(plan => (
                        <td key={plan.id} className={`text-center py-3 px-4 ${feature.getValue(plan) === '✓' || feature.getValue(plan).includes('Unlimited') || feature.getValue(plan).includes('Never') ? 'text-[#15803D] font-medium' : feature.getValue(plan) === '—' ? 'text-[#78716C]' : 'text-[#1A1512]'}`}>
                          {feature.getValue(plan)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust section */}
          <div className="mt-16 text-center">
            <div className="flex flex-wrap items-center justify-center gap-8 text-[#57534E] text-sm">
              <span className="flex items-center gap-2"><span className="text-[#15803D]">🔒</span> 256-bit encryption</span>
              <span className="flex items-center gap-2"><span className="text-[#15803D]">🛡️</span> 7-day money-back guarantee</span>
              <span className="flex items-center gap-2"><span className="text-[#15803D]">💳</span> Razorpay secured</span>
              <span className="flex items-center gap-2"><span className="text-[#15803D]">✓</span> Cancel anytime</span>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Common Questions</h2>
            <div className="space-y-4">
               {[
                 { q: 'How does the Quick Pass work?', a: 'The Quick Pass gives you 24 hours of full AI Interview Assistant access. It\'s a one-time purchase — no subscription, no auto-renewal. Perfect for interview day prep.' },
                 { q: 'What\'s the difference between Quick Pass and Pro?', a: 'Quick Pass is 24-hour one-time access. Pro is a longer unlimited pass and includes Resume Analysis and company-specific interview support. Both are one-time purchases with no subscription.' },
                 { q: 'Can I use JavihAI on Mac?', a: 'Yes! JavihAI supports both Windows and Mac (Apple Silicon M1/M2/M3 and Intel). Download the appropriate version from our download page.' },
                 { q: 'Is the overlay really invisible?', a: 'Yes. JavihAI uses OS-level APIs to exclude itself from all screen captures. The interviewer sees only your screen, not the overlay, on Zoom, Google Meet, and Microsoft Teams.' },
                 { q: 'How is JavihAI different from Final Round AI?', a: 'JavihAI is built for Indian interviews with Desi Mode (CTC in LPA, notice period, Indian company context), supports Hindi and regional languages, and is more affordable than alternatives.' },
                 { q: 'Can I switch plans anytime?', a: 'Yes — upgrade anytime and it takes effect immediately. To downgrade, contact support and we\'ll handle it manually and prorate your billing.' },
                 { q: 'Is there a free trial?', a: 'Yes! Start with our Free plan — limited AI usage, forever, no credit card required. We also offer a 7-day money-back guarantee on your first paid purchase.' },
                 { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, UPI, and net banking through our secure Razorpay integration.' },
                 { q: 'Do you offer refunds?', a: 'Yes, we offer a 7-day money-back guarantee on your first payment. If you\'re not satisfied, contact support for a full refund.' },
               ].map((item, i) => (
                <div key={i} className="card">
                  <h4 className="text-lg font-semibold text-[#1A1512] mb-2">{item.q}</h4>
                  <p className="text-[#57534E]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
