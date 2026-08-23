import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs LockedIn AI — 9× Cheaper, Built for India' },
  description: 'JavihAI vs LockedIn AI: LockedIn AI\'s Unlimited Pro plan runs about $49.99/month (~₹4,749). JavihAI gives unlimited real-time AI interview help from ₹499/month, with Indian languages and pricing.',
  keywords: ['lockedin ai alternative india', 'lockedin ai vs javihai', 'lockedin ai pricing india', 'cheaper than lockedin ai', 'ai interview assistant india'],
  alternates: { canonical: 'https://www.javihai.in/compare/lockedin-ai' },
  openGraph: {
    title: 'JavihAI vs LockedIn AI — 9× Cheaper, Built for India',
    description: 'JavihAI ₹499/month vs LockedIn AI\'s Unlimited Pro at ~$49.99/month (~₹4,749). Same real-time interview help, built for India.',
  },
};

const ROWS = [
  { feature: 'Free plan',                   javihai: '✅ 10 answers/day forever',        lockedin: '⚠️ Free trial — 10 credits' },
  { feature: 'Unlimited Pro (monthly)',     javihai: '✅ ₹499–₹999/month',                lockedin: '❌ ~$49.99/month (~₹4,749)' },
  { feature: 'Pricing model',                javihai: '✅ Simple flat plans',              lockedin: '⚠️ Credits or unlimited — can get confusing' },
  { feature: 'Built for Indian interviews',  javihai: '✅ Yes — ₹ CTC, Indian companies',   lockedin: '❌ No India-specific focus' },
  { feature: 'Regional languages',          javihai: '✅ 10 (Hindi, Tamil, Telugu…)',      lockedin: '❌ English-focused' },
  { feature: 'Invisible to screen-share',    javihai: '✅ Yes',                            lockedin: '✅ Yes' },
  { feature: 'Coding / technical rounds',    javihai: '✅ HackerRank, LeetCode, screenshots', lockedin: '✅ Yes' },
  { feature: 'Mock interview mode',          javihai: '✅ Web-based, AI interviewer',       lockedin: '✅ Yes' },
  { feature: 'Resume builder',               javihai: '✅ 5 templates, PDF export',         lockedin: '⚠️ Limited' },
  { feature: 'Refund policy',                javihai: '✅ 7-day money-back',                lockedin: '⚠️ Varies by plan' },
];

export default function LockedInAIComparePage() {
  return (
    <>
      <div className="pt-28 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">LockedIn AI</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Both offer a real-time invisible interview assistant. JavihAI is priced in rupees
            for the Indian market — no credit-based guesswork, no dollar billing.
          </p>
        </div>

        {/* Price callout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card border-indigo-500/50 bg-indigo-500/5 text-center">
            <div className="badge mb-3">🏆 JavihAI</div>
            <div className="text-5xl font-black text-white mb-1">₹499<span className="text-xl font-normal text-slate-400">/mo</span></div>
            <div className="text-slate-400 mb-2">Unlimited AI answers</div>
            <div className="text-green-400 text-sm font-semibold">✓ Free plan available forever</div>
          </div>
          <div className="card text-center opacity-75">
            <div className="text-sm font-semibold text-slate-400 mb-3">LockedIn AI (Unlimited Pro)</div>
            <div className="text-5xl font-black text-slate-300 mb-1">$49.99<span className="text-xl font-normal text-slate-500">/mo</span></div>
            <div className="text-slate-500 mb-2">≈ ₹4,749/month, billed in USD</div>
            <div className="text-red-400 text-sm">✗ Credit plans add pricing complexity</div>
          </div>
        </div>

        {/* Feature table */}
        <div className="card overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-indigo-400 font-semibold">JavihAI</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">LockedIn AI</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                  <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-slate-200">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{row.lockedin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI wins */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '💰', title: '9× Cheaper', body: 'JavihAI Unlimited at ₹499–₹999/mo vs LockedIn AI\'s Unlimited Pro at ~$49.99/mo (~₹4,749).' },
            { icon: '🇮🇳', title: 'Built for India', body: 'Answers in ₹ LPA, understands Indian company culture, and supports Hindi, Tamil, Telugu and more.' },
            { icon: '🧾', title: 'No Credit Confusion', body: 'Flat monthly plans instead of a credit system where usage costs can be hard to predict.' },
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
          LockedIn AI pricing sourced from lockedinai.com/pricing and third-party reviews as of June 2026. USD converted at ≈₹95/$1. All prices approximate and subject to change.
        </p>
      </div>
      <Footer />
    </>
  );
}
