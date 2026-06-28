import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs Interview Coder — 57× Cheaper, Built for India' },
  description: 'JavihAI vs Interview Coder: Interview Coder costs $299/month (~₹28,400) for coding-only interview help. JavihAI is ₹499/month for unlimited AI answers across coding, system design, and behavioral rounds.',
  keywords: ['interview coder alternative', 'interview coder vs javihai', 'interview coder india price', 'cheaper than interview coder', 'AI coding interview assistant india'],
  alternates: { canonical: 'https://javihai.in/compare/interview-coder' },
  openGraph: {
    title: 'JavihAI vs Interview Coder — 57× Cheaper, Built for India',
    description: 'JavihAI ₹499/month vs Interview Coder ~₹28,400/month. Unlimited answers across coding, system design, and behavioral — not just coding.',
  },
};

const ROWS = [
  { feature: 'Free plan',                  javihai: '✅ 10 answers/day forever',     ic: '❌ No meaningful free trial' },
  { feature: 'Entry price',                javihai: '✅ ₹499/month',                  ic: '❌ $299/month (~₹28,400)' },
  { feature: 'Lifetime option',            javihai: '✅ ₹999/month covers everything', ic: '⚠️ $799 one-time (~₹76,000)' },
  { feature: 'Coding round help',          javihai: '✅ Screenshot analysis',         ic: '✅ Yes — its core focus' },
  { feature: 'System design rounds',       javihai: '✅ Yes',                         ic: '❌ Coding-only tool' },
  { feature: 'Behavioral / HR rounds',     javihai: '✅ STAR method coaching',        ic: '❌ Not supported' },
  { feature: 'Voice transcription',        javihai: '✅ Whisper (Groq)',              ic: '❌ Screenshot-only, no voice' },
  { feature: 'Desi Mode (Indian context)', javihai: '✅ Yes — unique to JavihAI',     ic: '❌ No' },
  { feature: 'Indian regional languages',  javihai: '✅ Hindi, Tamil, Telugu…',       ic: '❌ English only' },
  { feature: 'Resume builder',             javihai: '✅ 5 templates, PDF',            ic: '❌ No' },
  { feature: 'Mock interview mode',        javihai: '✅ Web-based, AI interviewer',   ic: '❌ No' },
  { feature: 'Refund policy',              javihai: '✅ 7-day money-back',            ic: '⚠️ Not disclosed' },
  { feature: 'Works in India (payments)',  javihai: '✅ Razorpay — UPI, cards',       ic: '⚠️ USD only' },
];

export default function InterviewCoderComparePage() {
  return (
    <>
      <Navbar />
      <div className="pt-28 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">Interview Coder</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Interview Coder is built for coding rounds only. JavihAI covers coding, system design,
            and behavioral rounds — at a fraction of the price.
          </p>
        </div>

        {/* Price callout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card border-indigo-500/50 bg-indigo-500/5 text-center">
            <div className="badge mb-3">🏆 JavihAI</div>
            <div className="text-5xl font-black text-white mb-1">₹499<span className="text-xl font-normal text-slate-400">/mo</span></div>
            <div className="text-slate-400 mb-2">Unlimited AI answers, all round types</div>
            <div className="text-green-400 text-sm font-semibold">✓ Free plan available forever</div>
          </div>
          <div className="card text-center opacity-75">
            <div className="text-sm font-semibold text-slate-400 mb-3">Interview Coder</div>
            <div className="text-5xl font-black text-slate-300 mb-1">$299<span className="text-xl font-normal text-slate-500">/mo</span></div>
            <div className="text-slate-500 mb-2">~₹28,400/month · coding rounds only</div>
            <div className="text-red-400 text-sm">✗ No meaningful free trial</div>
          </div>
        </div>

        {/* Savings callout */}
        <div className="card bg-green-500/5 border-green-500/30 text-center mb-12">
          <p className="text-2xl font-black text-green-400">You save ~₹3,34,000/year switching to JavihAI</p>
          <p className="text-slate-400 mt-2 text-sm">$299 × 12 ≈ ₹3,40,800/year (Interview Coder) vs ₹499 × 12 = ₹5,988/year (JavihAI), at ₹95/$1</p>
        </div>

        {/* Feature table */}
        <div className="card overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-indigo-400 font-semibold">JavihAI</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Interview Coder</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                  <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-slate-200">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{row.ic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI wins */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '🎯', title: 'Every Round, Not Just Coding', body: 'Interview Coder only handles coding screens. JavihAI also covers system design and behavioral rounds with the same real-time overlay.' },
            { icon: '💰', title: '57× Cheaper', body: "Interview Coder is $299/month (~₹28,400). JavihAI Pro is ₹499/month — unlimited, all round types included." },
            { icon: '🇮🇳', title: 'Built for India', body: 'UPI payments, Desi Mode, Hindi/Tamil/Telugu answers. Interview Coder is USD-only with no India-specific features.' },
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
          <h2 className="text-3xl font-black mb-4">Try JavihAI free — no credit card needed</h2>
          <p className="text-slate-400 mb-6">10 AI answers every day, forever. Upgrade to Pro anytime for ₹499/month.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Get Started Free →</Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">See Pricing</Link>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Pricing data on Interview Coder sourced from public reviews (linkjob.ai, getdx.com) as of June 2026, converted at ₹95/$1. Interview Coder does not publicly disclose a refund policy. All prices approximate.
        </p>
      </div>
      <Footer />
    </>
  );
}
