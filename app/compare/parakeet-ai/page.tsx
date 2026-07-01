import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs Parakeet AI — 28× Cheaper, Unlimited Answers' },
  description: 'JavihAI vs Parakeet AI: Parakeet AI\'s unlimited plan costs about $149.90/month (~₹14,240), and its base tier runs on credits that expire per session. JavihAI is unlimited from ₹499/month, no credits.',
  keywords: ['parakeet ai alternative india', 'parakeet ai vs javihai', 'parakeet ai pricing india', 'cheaper than parakeet ai', 'ai interview copilot without credits'],
  alternates: { canonical: 'https://javihai.in/compare/parakeet-ai' },
  openGraph: {
    title: 'JavihAI vs Parakeet AI — 28× Cheaper, Unlimited Answers',
    description: 'JavihAI ₹499/month vs Parakeet AI\'s unlimited plan at ~$149.90/month (~₹14,240). No credits, no session limits.',
  },
};

const ROWS = [
  { feature: 'Free plan',                    javihai: '✅ 10 answers/day forever',        parakeet: '⚠️ Free trial only, no card' },
  { feature: 'Pricing model',                javihai: '✅ Simple flat plans',              parakeet: '❌ Credit-based (0.5 credit/30 min)' },
  { feature: 'Unlimited plan (monthly)',     javihai: '✅ ₹499–₹999/month',                parakeet: '❌ ~$149.90/month (~₹14,240)' },
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
      <Navbar />
      <div className="pt-28 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">Parakeet AI</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Parakeet AI bills by the credit — every 30 minutes eats into your balance.
            JavihAI is a flat monthly plan with no session math.
          </p>
        </div>

        {/* Price callout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card border-indigo-500/50 bg-indigo-500/5 text-center">
            <div className="badge mb-3">🏆 JavihAI</div>
            <div className="text-5xl font-black text-white mb-1">₹499<span className="text-xl font-normal text-slate-400">/mo</span></div>
            <div className="text-slate-400 mb-2">Unlimited AI answers, no credits</div>
            <div className="text-green-400 text-sm font-semibold">✓ Free plan available forever</div>
          </div>
          <div className="card text-center opacity-75">
            <div className="text-sm font-semibold text-slate-400 mb-3">Parakeet AI (Unlimited)</div>
            <div className="text-5xl font-black text-slate-300 mb-1">$149.90<span className="text-xl font-normal text-slate-500">/mo</span></div>
            <div className="text-slate-500 mb-2">≈ ₹14,240/month for unlimited calls</div>
            <div className="text-red-400 text-sm">✗ Pay-as-you-go tier runs on expiring 30-min credits</div>
          </div>
        </div>

        {/* Feature table */}
        <div className="card overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-indigo-400 font-semibold">JavihAI</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Parakeet AI</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                  <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-slate-200">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{row.parakeet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI wins */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '💰', title: '28× Cheaper', body: 'JavihAI Unlimited at ₹499–₹999/mo vs Parakeet AI\'s unlimited plan at ~$149.90/mo (~₹14,240).' },
            { icon: '🧾', title: 'No Credit Math', body: 'No 30-minute session blocks eating into a balance — just answer as many questions as you need.' },
            { icon: '🇮🇳', title: 'Built for India', body: 'Answers in ₹ LPA, understands Indian company culture, and supports Hindi, Tamil, Telugu and more.' },
          ].map((c, i) => (
            <div key={i} className="card text-center">
              <div className="text-4xl mb-3">{c.icon}</div>
              <h3 className="font-bold text-white mb-2">{c.title}</h3>
              <p className="text-slate-400 text-sm">{c.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center card bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
          <h2 className="text-3xl font-black mb-4">Switch to JavihAI — 7-day money-back</h2>
          <p className="text-slate-400 mb-6">No credit card for free plan. Upgrade anytime. Cancel anytime.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">See Pricing</Link>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Parakeet AI pricing sourced from parakeet-ai.com and third-party reviews as of June 2026. USD converted at ≈₹95/$1. All prices approximate and subject to change.
        </p>
      </div>
      <Footer />
    </>
  );
}
