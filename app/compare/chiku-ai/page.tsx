import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs Chiku AI — Same Features, 7× Cheaper' },
  description: 'JavihAI vs Chiku AI: both are Indian AI interview assistants with Desi Mode, voice transcription, and real-time answers. JavihAI starts at ₹499/month vs Chiku AI ₹3,499/month — save ₹3,000/month.',
  keywords: ['chiku ai alternative', 'chiku ai vs javihai', 'affordable ai interview assistant india', 'desi mode interview ai', 'best indian interview AI app'],
  alternates: { canonical: 'https://javihai.in/compare/chiku-ai' },
  openGraph: {
    title: 'JavihAI vs Chiku AI — Same Features, 7× Cheaper',
    description: 'JavihAI ₹499/month vs Chiku AI ₹3,499/month. Same Desi Mode, voice transcription, real-time answers — save ₹3,000/month.',
  },
};

const ROWS = [
  { feature: 'Free plan',              javihai: '✅ 10 answers/day forever',      chiku: '⚠️ 10-min trial only' },
  { feature: 'Entry paid price',       javihai: '✅ ₹499/month',                  chiku: '❌ ₹1,199 (3 interviews only)' },
  { feature: 'Unlimited plan',         javihai: '✅ ₹999/month',                  chiku: '❌ ₹3,499/month' },
  { feature: 'Desi Mode',             javihai: '✅ Yes — toggle in profile',      chiku: '✅ Yes' },
  { feature: 'Regional languages',     javihai: '✅ 10 (Hindi, Tamil, Telugu…)',  chiku: '✅ 52+' },
  { feature: 'Desktop overlay app',    javihai: '✅ Mac + Windows',               chiku: '✅ Mac + Windows' },
  { feature: 'Invisible to screen-share', javihai: '✅ Yes',                      chiku: '✅ Yes' },
  { feature: 'Voice transcription',    javihai: '✅ Whisper (Groq)',              chiku: '✅ Yes' },
  { feature: 'Screenshot / coding',   javihai: '✅ Yes',                          chiku: '✅ Yes' },
  { feature: 'Resume builder',         javihai: '✅ 5 templates, PDF export',     chiku: '✅ 10 templates' },
  { feature: 'Job recommendations',    javihai: '✅ Top Indian tech companies',   chiku: '✅ Yes' },
  { feature: 'Mock interview mode',    javihai: '✅ Web-based, AI interviewer',   chiku: '⚠️ Basic' },
  { feature: 'Credits expire',         javihai: '✅ No expiry',                   chiku: '❌ Credits expire' },
  { feature: 'Refund policy',          javihai: '✅ 7-day money-back',            chiku: '⚠️ Unclear' },
];

export default function ChikuAIComparePage() {
  return (
    <>
      <Navbar />
      <div className="pt-28 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">Chiku AI</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Both are Indian AI interview assistants with Desi Mode and real-time answers.
            One is 7× cheaper.
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
            <div className="text-sm font-semibold text-slate-400 mb-3">Chiku AI</div>
            <div className="text-5xl font-black text-slate-300 mb-1">₹3,499<span className="text-xl font-normal text-slate-500">/mo</span></div>
            <div className="text-slate-500 mb-2">For unlimited plan</div>
            <div className="text-red-400 text-sm">✗ Free trial = 10 minutes only</div>
          </div>
        </div>

        {/* Feature table */}
        <div className="card overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-indigo-400 font-semibold">JavihAI</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Chiku AI</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                  <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-slate-200">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{row.chiku}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI wins */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '💰', title: '7× Cheaper', body: 'JavihAI Pro at ₹499/mo vs Chiku AI unlimited at ₹3,499/mo. Same real-time AI, fraction of the cost.' },
            { icon: '🆓', title: 'Real Free Plan', body: '10 AI answers every single day, forever. Chiku AI\'s free tier is a 10-minute one-time trial.' },
            { icon: '🎯', title: 'Mock Interview', body: 'Practice with a full AI-powered mock interview — pick role, get asked real questions, get scored instantly.' },
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
          Pricing data sourced from chiku-ai.in and saasworthy.com as of June 2026. All prices in INR.
        </p>
      </div>
      <Footer />
    </>
  );
}
