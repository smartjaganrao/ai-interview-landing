import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs Cluely — ~3.6× Cheaper for Invisible AI Interview Help' },
  description: 'JavihAI vs Cluely: Cluely charges $75/month (~₹7,125) for its undetectable overlay tier. JavihAI gives you the same invisible, real-time AI help from ₹250, unlimited from ₹2,000/month — built for Indian interviews.',
  keywords: ['cluely alternative india', 'cluely vs javihai', 'cluely pricing india', 'undetectable ai interview tool india', 'cheaper than cluely'],
  alternates: { canonical: 'https://javihai.in/compare/cluely' },
  openGraph: {
    title: 'JavihAI vs Cluely — ~3.6× Cheaper, Same Invisible Overlay',
    description: 'JavihAI ₹2,000/month vs Cluely $75/month (~₹7,125) for undetectability. Same invisible real-time AI help — built for India.',
  },
};

const ROWS = [
  { feature: 'Free plan',                    javihai: '✅ 10 answers/day forever',        cluely: '⚠️ 5 responses/day, 100-char limit' },
  { feature: 'Entry paid price',             javihai: '✅ ₹250 (1-hour pass)',             cluely: '⚠️ $20/month (no undetectability)' },
  { feature: 'Invisible / undetectable tier',javihai: '✅ Included at every paid tier',    cluely: '❌ $75/month add-on' },
  { feature: 'Built for Indian interviews',   javihai: '✅ Yes — ₹ CTC, Indian companies',  cluely: '❌ No India-specific focus' },
  { feature: 'Regional languages',           javihai: '✅ 10 (Hindi, Tamil, Telugu…)',     cluely: '❌ English-only' },
  { feature: 'Coding / technical rounds',     javihai: '✅ HackerRank, LeetCode, screenshots', cluely: '✅ Meetings, sales calls, interviews' },
  { feature: 'Mock interview mode',           javihai: '✅ Web-based, AI interviewer',      cluely: '❌ Not offered' },
  { feature: 'Resume builder',                javihai: '✅ 5 templates, PDF export',        cluely: '❌ Not offered' },
  { feature: 'Refund policy',                 javihai: '✅ 7-day money-back',               cluely: '⚠️ Not published' },
];

export default function CluelyComparePage() {
  return (
    <>
      <div className="pt-28 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">Cluely</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Both offer an invisible, real-time AI overlay. JavihAI includes undetectability
            in its base price and is built for Indian interviews — Cluely charges extra for it.
          </p>
        </div>

        {/* Price callout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card border-indigo-500/50 bg-indigo-500/5 text-center">
            <div className="badge mb-3">🏆 JavihAI</div>
            <div className="text-5xl font-black text-white mb-1">₹2,000<span className="text-xl font-normal text-slate-400">/mo</span></div>
            <div className="text-slate-400 mb-2">Power plan — unlimited answers, invisible overlay included</div>
            <div className="text-green-400 text-sm font-semibold">✓ Free plan available forever</div>
          </div>
          <div className="card text-center opacity-75">
            <div className="text-sm font-semibold text-slate-400 mb-3">Cluely (Pro + Undetectability)</div>
            <div className="text-5xl font-black text-slate-300 mb-1">$75<span className="text-xl font-normal text-slate-500">/mo</span></div>
            <div className="text-slate-500 mb-2">≈ ₹7,125/month for the undetectable tier</div>
            <div className="text-red-400 text-sm">✗ Base $20/mo plan is visible on screen-share</div>
          </div>
        </div>

        {/* Feature table */}
        <div className="card overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-indigo-400 font-semibold">JavihAI</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Cluely</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                  <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-slate-200">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{row.cluely}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI wins */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '💰', title: '~3.6× Cheaper', body: 'JavihAI Power at ₹2,000/mo vs Cluely\'s $75/mo (~₹7,125) undetectability tier — the invisible overlay comes standard, not as an add-on.' },
            { icon: '🇮🇳', title: 'Built for India', body: 'Answers in ₹ LPA, understands Indian company culture, and supports Hindi, Tamil, Telugu and more. Cluely is English-only.' },
            { icon: '🎯', title: 'Interview-Specific', body: 'Cluely is a general meeting copilot. JavihAI is purpose-built for coding rounds, system design, and behavioral interviews.' },
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
          Cluely pricing sourced from cluely.com/pricing as of June 2026. USD converted at ≈₹95/$1. All prices approximate and subject to change.
        </p>
      </div>
      <Footer />
    </>
  );
}
