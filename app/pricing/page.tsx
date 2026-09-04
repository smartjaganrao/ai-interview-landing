'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { cachedGetDoc } from '@/lib/firestore-cache';
import { doc, getDoc } from 'firebase/firestore';
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
} from '@/lib/pricing-config';

interface Offer { active: boolean; label: string; percentOff: number; appliesTo: 'all' | PlanId; expiresAt: number | null }
interface Pricing { plans: { free: { oneTime: number; displayOrder: number }; quick_pass: { oneTime: number; displayOrder: number }; pro: { oneTime: number; displayOrder: number }; power: { monthly: number; yearly: number; displayOrder: number } }; offer: Offer; degraded?: boolean }
interface FeaturedCoupon { code: string; label: string; discountType: 'percent' | 'flat'; discountValue: number; appliesTo: 'all' | PlanId }

function offerActiveFor(offer: Offer | undefined, planId: PlanId): boolean {
  if (!offer || !offer.active || offer.percentOff <= 0 || planId === 'free') return false;
  if (offer.expiresAt && Date.now() > offer.expiresAt) return false;
  return offer.appliesTo === 'all' || offer.appliesTo === planId;
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Quick Pass work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Quick Pass gives you 1 hour of full AI Interview Assistant access. It\'s a one-time purchase — no subscription, no auto-renewal. Perfect for interview day prep.',
      },
    },
    {
      '@type': 'Question',
      name: 'What\'s the difference between Quick Pass and Pro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Quick Pass is 1 hour one-time access. Pro is a longer unlimited pass and includes Resume Analysis and company-specific interview support. Both are one-time purchases with no subscription.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use JavihAI on Mac?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! JavihAI supports both Windows and Mac (Apple Silicon M1/M2/M3 and Intel). Download the appropriate version from our download page.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the overlay really invisible?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. JavihAI uses OS-level APIs to exclude itself from all screen captures. The interviewer sees only your screen, not the overlay, on Zoom, Google Meet, and Microsoft Teams.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is JavihAI different from Final Round AI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JavihAI is built for Indian interviews with Desi Mode (CTC in LPA, notice period, Indian company context), supports Hindi and regional languages, and is more affordable than alternatives.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I switch plans anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a free trial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Start with our Free plan — limited AI usage, forever, no credit card required. We also offer a 7-day money-back guarantee on your first paid purchase.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods do you accept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept all major credit cards, debit cards, UPI, and net banking through our secure Razorpay integration.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer refunds?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we offer a 7-day money-back guarantee on your first payment. If you\'re not satisfied, contact support for a full refund.',
      },
    },
  ],
};

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [featuredCoupon, setFeaturedCoupon] = useState<FeaturedCoupon | null>(null);
  const [couponCopied, setCouponCopied] = useState(false);
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
    cachedGetDoc(`sub:${user.uid}`, 5 * 60 * 1000, () =>
      getDoc(doc(db, 'subscriptions', user.uid)).then((snap) =>
        snap.exists() ? { plan: snap.data().plan, status: snap.data().status } : null
      )
    ).then((result) => {
      if (result?.status === 'active') {
        setCurrentPlan(migratePlanId(result.plan as AnyPlanId));
      }
    }).catch(() => {});
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
    // Prefill (never auto-apply) the featured coupon's code into the
    // checkout input when it's relevant to this plan — the user still has
    // to click Apply there, keeping redemption manual.
    const couponForPlan = featuredCoupon && (featuredCoupon.appliesTo === 'all' || featuredCoupon.appliesTo === planId)
      ? `&coupon=${encodeURIComponent(featuredCoupon.code)}`
      : '';
    router.push(`/checkout?plan=${planId}&billing=${billing}${couponForPlan}`);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="badge mb-4">💎 Pricing</div>
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              Choose Your <span className="text-gradient">Path to Success</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              Start free, upgrade when you&apos;re ready. Cancel anytime.
            </p>
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
                <span className="text-purple-200 font-semibold">
                  🎟️ Use code{' '}
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(featuredCoupon.code).catch(() => {});
                      setCouponCopied(true);
                      setTimeout(() => setCouponCopied(false), 2000);
                    }}
                    className="underline decoration-dotted underline-offset-4 hover:text-white"
                    title="Copy code"
                  >
                    {featuredCoupon.code}
                  </button>{' '}
                  for {featuredCoupon.discountType === 'percent' ? `${featuredCoupon.discountValue}% off` : `₹${featuredCoupon.discountValue} off`}
                  {featuredCoupon.appliesTo !== 'all' &&
                    ` on ${PLANS.find((p) => p.id === featuredCoupon.appliesTo)?.name ?? featuredCoupon.appliesTo}`}
                  {featuredCoupon.label ? ` — ${featuredCoupon.label}` : ''}
                  {couponCopied && <span className="ml-2 text-green-400">Copied!</span>}
                </span>
              </div>
            </div>
          )}
          {(!featuredCoupon || featuredCoupon.appliesTo !== 'all') &&
            pricing?.offer?.active && pricing.offer.percentOff > 0 &&
            (!pricing.offer.expiresAt || Date.now() < pricing.offer.expiresAt) && (
              <div className="max-w-2xl mx-auto mb-10 -mt-6">
                <div className="card text-center bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 py-4">
                  <span className="text-green-300 font-semibold">
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
                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{plan.tagline}</p>

                  {plan.id === 'free' ? (
                    <div className="text-4xl font-black text-white mb-1">Free</div>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      {offerOn && hasPricing && (
                        <span className="text-2xl font-bold text-slate-500 line-through mr-1">₹{cyclePrice}</span>
                      )}
                      {hasPricing ? (
                        <>
                          <span className="text-5xl font-black text-white">₹{effCycle}</span>
                          {isOneTime ? (
                            <span className="text-slate-400">one-time</span>
                          ) : (
                            <span className="text-slate-400">/mo</span>
                          )}
                        </>
                      ) : (
                        <span className="text-5xl font-black text-white">—</span>
                      )}
                    </div>
                  )}
                  {offerOn && plan.id !== 'free' && hasPricing && (
                    <p className="text-xs text-green-400 font-semibold mb-1">{pricing!.offer.percentOff}% off applied</p>
                  )}
                  <p className="text-xs text-slate-500 mb-1">{usageLabel}</p>
                  {plan.billingType === 'one_time' && plan.durationType === 'hours' && (
                    <p className="text-xs text-slate-600">Unused hours carry over · expires after {plan.durationValue * 24}h</p>
                  )}
                </div>

                {user && plan.id === currentPlan && (
                  <div className="mb-3 text-center">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold">✓ Your current plan</span>
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
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Feature</th>
                    {sortedPlans.map(plan => (
                      <th key={plan.id} className={`text-center py-4 px-4 ${plan.id === 'power' ? 'text-purple-300' : 'text-white'} font-semibold`}>
                        {plan.name}
                        {plan.badge && <div className="text-xs text-purple-300 mt-1">{plan.badge}</div>}
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
                  ].map((feature, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="py-3 px-4 text-slate-300">{feature.name}</td>
                      {sortedPlans.map(plan => (
                        <td key={plan.id} className={`text-center py-3 px-4 ${feature.getValue(plan) === '✓' ? 'text-green-400' : feature.getValue(plan) === '—' ? 'text-slate-600' : 'text-white'}`}>
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
            <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm">
              <span className="flex items-center gap-2"><span className="text-green-400">🔒</span> 256-bit encryption</span>
              <span className="flex items-center gap-2"><span className="text-green-400">🛡️</span> 7-day money-back guarantee</span>
              <span className="flex items-center gap-2"><span className="text-green-400">💳</span> Razorpay secured</span>
              <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Cancel anytime</span>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Common Questions</h2>
            <div className="space-y-4">
               {[
                 { q: 'How does the Quick Pass work?', a: 'The Quick Pass gives you 1 hour of full AI Interview Assistant access. It\'s a one-time purchase — no subscription, no auto-renewal. Perfect for interview day prep.' },
                 { q: 'What\'s the difference between Quick Pass and Pro?', a: 'Quick Pass is 1 hour one-time access. Pro is a longer unlimited pass and includes Resume Analysis and company-specific interview support. Both are one-time purchases with no subscription.' },
                 { q: 'Can I use JavihAI on Mac?', a: 'Yes! JavihAI supports both Windows and Mac (Apple Silicon M1/M2/M3 and Intel). Download the appropriate version from our download page.' },
                 { q: 'Is the overlay really invisible?', a: 'Yes. JavihAI uses OS-level APIs to exclude itself from all screen captures. The interviewer sees only your screen, not the overlay, on Zoom, Google Meet, and Microsoft Teams.' },
                 { q: 'How is JavihAI different from Final Round AI?', a: 'JavihAI is built for Indian interviews with Desi Mode (CTC in LPA, notice period, Indian company context), supports Hindi and regional languages, and is more affordable than alternatives.' },
                 { q: 'Can I switch plans anytime?', a: 'Yes, upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.' },
                 { q: 'Is there a free trial?', a: 'Yes! Start with our Free plan — limited AI usage, forever, no credit card required. We also offer a 7-day money-back guarantee on your first paid purchase.' },
                 { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, UPI, and net banking through our secure Razorpay integration.' },
                 { q: 'Do you offer refunds?', a: 'Yes, we offer a 7-day money-back guarantee on your first payment. If you\'re not satisfied, contact support for a full refund.' },
               ].map((item, i) => (
                <div key={i} className="card">
                  <h4 className="text-lg font-semibold text-white mb-2">{item.q}</h4>
                  <p className="text-slate-400">{item.a}</p>
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
