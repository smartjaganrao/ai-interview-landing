'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, power: 2 };

interface Offer { active: boolean; label: string; percentOff: number; appliesTo: 'all' | 'pro' | 'power'; expiresAt: number | null }
interface Pricing { plans: { pro: { monthly: number; yearly: number }; power: { monthly: number; yearly: number } }; offer: Offer }

function offerActiveFor(offer: Offer | undefined, planId: string): boolean {
  if (!offer || !offer.active || offer.percentOff <= 0 || planId === 'free') return false;
  if (offer.expiresAt && Date.now() > offer.expiresAt) return false;
  return offer.appliesTo === 'all' || offer.appliesTo === planId;
}

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/pricing').then((r) => r.json()).then(setPricing).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'subscriptions', user.uid)).then((snap) => {
      if (snap.exists() && snap.data().status === 'active') {
        setCurrentPlan(snap.data().plan || 'free');
      }
    }).catch(() => {});
  }, [user]);

  const handleSelectPlan = (plan: string) => {
    if (!user) {
      router.push(`/auth/signup?plan=${plan}`);
      return;
    }
    if (plan === 'free' || plan === currentPlan) {
      router.push('/dashboard');
      return;
    }
    if ((PLAN_RANK[plan] ?? 0) < (PLAN_RANK[currentPlan] ?? 0)) {
      router.push('/dashboard');
      return;
    }
    router.push(`/checkout?plan=${plan}&billing=${billing}`);
  };

  const getPlanCta = (planId: string, defaultCta: string) => {
    if (!user) return defaultCta;
    if (planId === currentPlan) return 'Current Plan';
    if ((PLAN_RANK[planId] ?? 0) < (PLAN_RANK[currentPlan] ?? 0)) return 'Downgrade (contact support)';
    if (currentPlan !== 'free') return `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`;
    return defaultCta;
  };

  const isPlanDisabled = (planId: string) => {
    if (!user) return false;
    return planId === currentPlan || (PLAN_RANK[planId] ?? 0) < (PLAN_RANK[currentPlan] ?? 0);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      tagline: 'Try it out',
      price: { monthly: 0, yearly: 0 },
      features: [
        '3 AI answers/day',
        '5 voice minutes/day',
        '2 screenshots/day',
        'Basic feedback',
        'Email support',
      ],
      cta: 'Start Free',
      popular: false,
      gradient: 'from-slate-600 to-slate-700',
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'For serious candidates',
      price: { monthly: 0, yearly: 0 },
      features: [
        'Unlimited AI answers',
        'Unlimited voice minutes',
        'Unlimited screenshots',
        'Advanced feedback & insights',
        'Cloud history sync',
        'Priority support',
        'Performance analytics',
      ],
      cta: 'Get Pro',
      popular: true,
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'power',
      name: 'Power',
      tagline: 'Maximum advantage',
      price: { monthly: 0, yearly: 0 },
      features: [
        'Everything in Pro',
        'Priority AI processing (faster responses)',
        'Advanced answer coaching & scoring',
        'Custom role & company context',
        'Extended session memory',
        'Priority support (response within 4h)',
        'Early access to new features',
      ],
      cta: 'Go Power',
      popular: false,
      gradient: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <>
      <Navbar />

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

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-2 p-1 rounded-full glass-heavy">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-smooth ${
                  billing === 'monthly'
                    ? 'gradient-primary text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-smooth flex items-center gap-2 ${
                  billing === 'yearly'
                    ? 'gradient-primary text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Active offer banner */}
          {pricing?.offer?.active && pricing.offer.percentOff > 0 &&
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
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const base = plan.id === 'free'
                ? plan.price
                : (pricing?.plans?.[plan.id as 'pro' | 'power'] ?? plan.price);
              const cyclePrice = billing === 'yearly' ? base.yearly : base.monthly;
              const offerOn = offerActiveFor(pricing?.offer, plan.id);
              const effCycle = offerOn
                ? Math.max(1, Math.round(cyclePrice * (1 - pricing!.offer.percentOff / 100)))
                : cyclePrice;
              const monthlyNow = billing === 'yearly' ? Math.round(effCycle / 12) : effCycle;
              const monthlyWas = billing === 'yearly' ? Math.round(cyclePrice / 12) : cyclePrice;
              return (
              <div
                key={plan.id}
                className={`relative card card-glow ${plan.popular ? 'md:scale-105 border-indigo-500/50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full gradient-primary text-white text-xs font-semibold">
                      ⭐ MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} items-center justify-center text-3xl mb-4`}>
                    {plan.id === 'free' ? '🎯' : plan.id === 'pro' ? '🚀' : '⚡'}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{plan.tagline}</p>

                  <div className="flex items-baseline justify-center gap-1 mb-1">
                    {offerOn && (
                      <span className="text-2xl font-bold text-slate-500 line-through mr-1">₹{monthlyWas}</span>
                    )}
                    <span className="text-5xl font-black text-white">₹{monthlyNow}</span>
                    <span className="text-slate-400">/mo</span>
                  </div>
                  {offerOn && (
                    <p className="text-xs text-green-400 font-semibold mb-1">{pricing!.offer.percentOff}% off applied</p>
                  )}
                  {billing === 'yearly' && effCycle > 0 && (
                    <p className="text-xs text-slate-500">Billed ₹{effCycle} yearly</p>
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
                  className={`w-full mb-6 ${plan.popular && !isPlanDisabled(plan.id) ? 'btn btn-primary' : 'btn btn-secondary'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getPlanCta(plan.id, plan.cta)} →
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

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Common Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'Can I switch plans anytime?', a: 'Yes, upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate any charges.' },
                { q: 'Is there a free trial?', a: 'Yes! Start with our Free plan — 3 AI answers/day, forever, no credit card required. We also offer a 7-day money-back guarantee on your first paid subscription.' },
                { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, UPI, and net banking through our secure Razorpay integration.' },
                { q: 'Do you offer refunds?', a: 'Yes, we offer a 7-day money-back guarantee on your first payment. If you&apos;re not satisfied, contact support for a full refund.' },
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
