import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs Cluely — ~7× Cheaper for Invisible AI Interview Help' },
  description: 'JavihAI vs Cluely: Cluely charges $149.99/month (~₹14,250) for its undetectable overlay tier. JavihAI gives you the same invisible, real-time AI help from ₹250, unlimited from ₹2,000/month — built for Indian interviews.',
  keywords: ['cluely alternative india', 'cluely vs javihai', 'cluely pricing india', 'undetectable ai interview tool india', 'cheaper than cluely'],
  alternates: { canonical: 'https://javihai.in/compare/cluely' },
  openGraph: {
    title: 'JavihAI vs Cluely — ~7× Cheaper, Same Invisible Overlay',
    description: 'JavihAI ₹2,000/month vs Cluely $149.99/month (~₹14,250) for undetectability. Same invisible real-time AI help — built for India.',
  },
};

const ROWS = [
  { feature: 'Free plan',                    javihai: '✅ 15 answers/day forever (5/mode)', cluely: '⚠️ 5 responses/day, 100-char limit' },
  { feature: 'Entry paid price',             javihai: '✅ ₹250 (24-hour pass)',             cluely: '⚠️ $20/month (no undetectability)' },
  { feature: 'Invisible / undetectable tier',javihai: '✅ Included at every paid tier',    cluely: '❌ $149.99/month add-on' },
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
      <div className="pt-12 sm:pt-16 md:pt-20 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">Cluely</span>
          </h1>
          <p className="text-xl text-[#57534E] max-w-2xl mx-auto">
            Both offer an invisible, real-time AI overlay. JavihAI includes undetectability
            in its base price and is built for Indian interviews — Cluely charges extra for it.
          </p>
        </div>

        {/* Price callout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card border-indigo-500/50 bg-indigo-500/5 text-center">
            <div className="badge mb-3">🏆 JavihAI</div>
            <div className="text-5xl font-black text-[#1A1512] mb-1">₹2,000<span className="text-xl font-normal text-[#57534E]">/mo</span></div>
            <div className="text-[#57534E] mb-2">Power plan — unlimited answers, invisible overlay included</div>
            <div className="text-[#15803D] text-sm font-semibold">✓ Free plan available forever</div>
          </div>
          <div className="card text-center opacity-75">
            <div className="text-sm font-semibold text-[#57534E] mb-3">Cluely (Pro + Undetectability)</div>
            <div className="text-5xl font-black text-[#57534E] mb-1">$149.99<span className="text-xl font-normal text-[#78716C]">/mo</span></div>
            <div className="text-[#78716C] mb-2">≈ ₹14,250/month for the undetectable tier</div>
            <div className="text-red-600 text-sm">✗ Base $20/mo plan is visible on screen-share</div>
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
                <th className="text-center py-3 px-4 text-[#57534E] font-medium">Cluely</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-[rgba(26,21,18,0.08)] ${i % 2 === 0 ? 'bg-[rgba(26,21,18,0.03)]' : ''}`}>
                  <td className="py-3 px-4 text-[#57534E]">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-[#1A1512]">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-[#57534E]">{row.cluely}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI wins */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '💰', title: '~7× Cheaper', body: 'JavihAI Power at ₹2,000/mo vs Cluely\'s $149.99/mo (~₹14,250) undetectability tier — the invisible overlay comes standard, not as an add-on.' },
            { icon: '🇮🇳', title: 'Built for India', body: 'Answers in ₹ LPA, understands Indian company culture, and supports Hindi, Tamil, Telugu and more. Cluely is English-only.' },
            { icon: '🎯', title: 'Interview-Specific', body: 'Cluely is a general meeting copilot. JavihAI is purpose-built for coding rounds, system design, and behavioral interviews.' },
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
          Cluely pricing sourced from cluely.com/pricing as of September 2026. USD converted at ≈₹95/$1. All prices approximate and subject to change.
        </p>
      </div>
      <Footer />
    </>
  );
}
