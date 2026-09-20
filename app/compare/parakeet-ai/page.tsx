import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs Parakeet AI — ~7× Cheaper, Unlimited Answers' },
  description: 'JavihAI vs Parakeet AI: Parakeet AI\'s unlimited plan costs about $149.90/month (~₹14,240), and its base tier runs on credits that expire per session. JavihAI is unlimited from ₹2,000/month, no credits.',
  keywords: ['parakeet ai alternative india', 'parakeet ai vs javihai', 'parakeet ai pricing india', 'cheaper than parakeet ai', 'ai interview copilot without credits'],
  alternates: { canonical: 'https://javihai.in/compare/parakeet-ai' },
  openGraph: {
    title: 'JavihAI vs Parakeet AI — ~7× Cheaper, Unlimited Answers',
    description: 'JavihAI ₹2,000/month vs Parakeet AI\'s unlimited plan at ~$149.90/month (~₹14,240). No credits, no session limits.',
  },
};

const ROWS = [
  { feature: 'Free plan',                    javihai: '✅ 25 answers/day forever',        parakeet: '⚠️ Free trial only, no card' },
  { feature: 'Pricing model',                javihai: '✅ Simple flat plans',              parakeet: '❌ Credit-based (0.5 credit/30 min)' },
  { feature: 'Unlimited plan (monthly)',     javihai: '✅ ₹2,000/month',                   parakeet: '❌ ~$149.90/month (~₹14,240)' },
  { feature: 'Session limits',                javihai: '✅ None while subscribed',          parakeet: '⚠️ Credits deducted per 30-min block' },
  { feature: 'Built for Indian interviews',   javihai: '✅ Yes — ₹ CTC, Indian companies',   parakeet: '❌ No India-specific focus' },
  { feature: 'Regional languages',            javihai: '✅ 10 (Hindi, Tamil, Telugu…)',      parakeet: '❌ English-focused' },
  { feature: 'Invisible to screen-share',      javihai: '✅ Yes',                            parakeet: '✅ Yes' },
  { feature: 'Coding / technical rounds',      javihai: '✅ HackerRank, LeetCode, screenshots', parakeet: '✅ Yes' },
  { feature: 'Resume builder',                 javihai: '✅ 5 templates, PDF export',         parakeet: '❌ Not offered' },
  { feature: 'Refund policy',                  javihai: '✅ 7-day money-back',                parakeet: '⚠️ 7-day refund on unused credits' },
];

export default function ParakeetAIComparePage() {
  return (
    <>
      <div className="pt-12 sm:pt-16 md:pt-20 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">Parakeet AI</span>
          </h1>
          <p className="text-xl text-[#57534E] max-w-2xl mx-auto">
            Parakeet AI bills by the credit — every 30 minutes eats into your balance.
            JavihAI is a flat monthly plan with no session math.
          </p>
        </div>

        {/* Price callout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card border-indigo-500/50 bg-indigo-500/5 text-center">
            <div className="badge mb-3">🏆 JavihAI</div>
            <div className="text-5xl font-black text-[#1A1512] mb-1">₹2,000<span className="text-xl font-normal text-[#57534E]">/mo</span></div>
            <div className="text-[#57534E] mb-2">Power plan — unlimited answers, no credits</div>
            <div className="text-[#15803D] text-sm font-semibold">✓ Free plan available forever</div>
          </div>
          <div className="card text-center opacity-75">
            <div className="text-sm font-semibold text-[#57534E] mb-3">Parakeet AI (Unlimited)</div>
            <div className="text-5xl font-black text-[#57534E] mb-1">$149.90<span className="text-xl font-normal text-[#78716C]">/mo</span></div>
            <div className="text-[#78716C] mb-2">≈ ₹14,240/month for unlimited calls</div>
            <div className="text-red-600 text-sm">✗ Pay-as-you-go tier runs on expiring 30-min credits</div>
          </div>
        </div>
        <p className="text-[#78716C] text-sm text-center -mt-8 mb-12">
          Just one interview coming up? JavihAI also has a ₹250 one-time Quick Pass — no monthly plan required.
        </p>

        {/* Feature table */}
        <div className="card overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(26,21,18,0.1)]">
                <th className="text-left py-3 px-4 text-[#57534E] font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-[#0B63C7] font-semibold">JavihAI</th>
                <th className="text-center py-3 px-4 text-[#57534E] font-medium">Parakeet AI</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-[rgba(26,21,18,0.08)] ${i % 2 === 0 ? 'bg-[rgba(26,21,18,0.03)]' : ''}`}>
                  <td className="py-3 px-4 text-[#57534E]">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-[#1A1512]">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-[#57534E]">{row.parakeet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI wins */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '💰', title: '~7× Cheaper', body: 'JavihAI Power at ₹2,000/mo vs Parakeet AI\'s unlimited plan at ~$149.90/mo (~₹14,240).' },
            { icon: '🧾', title: 'No Credit Math', body: 'No 30-minute session blocks eating into a balance — just answer as many questions as you need.' },
            { icon: '🇮🇳', title: 'Built for India', body: 'Answers in ₹ LPA, understands Indian company culture, and supports Hindi, Tamil, Telugu and more.' },
          ].map((c, i) => (
            <div key={i} className="card text-center">
              <div className="text-4xl mb-3">{c.icon}</div>
              <h3 className="font-bold text-[#1A1512] mb-2">{c.title}</h3>
              <p className="text-[#57534E] text-sm">{c.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center card bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
          <h2 className="text-3xl font-black mb-4">Switch to JavihAI — 7-day money-back</h2>
          <p className="text-[#57534E] mb-6">No credit card for free plan. Upgrade anytime. Cancel anytime.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">See Pricing</Link>
          </div>
        </div>

        <p className="text-center text-[#78716C] text-xs mt-8">
          Parakeet AI pricing sourced from parakeet-ai.com (not parakeet.io, an unrelated company) and third-party reviews, verified September 2026. USD converted at ≈₹95/$1. All prices approximate and subject to change.
        </p>
      </div>
      <Footer />
    </>
  );
}
