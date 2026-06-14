import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'JavihAI vs Final Round AI — 15x Cheaper, Same Real-Time Overlay | JavihAI',
  description: 'JavihAI vs Final Round AI comparison. Both offer real-time AI interview coaching with invisible overlay. JavihAI costs ₹499/month vs Final Round AI ₹7,695/month. Save 93%.',
  keywords: 'final round ai alternative, final round ai vs javihai, cheaper ai interview assistant, real-time interview ai india',
};

const ROWS = [
  { feature: 'Free plan',                  javihai: '✅ 10 answers/day forever',    fra: '⚠️ 5-min sessions only' },
  { feature: 'Entry paid price',           javihai: '✅ ₹499/month',                fra: '❌ ₹7,695/month (semi-annual)' },
  { feature: 'Monthly price',             javihai: '✅ ₹499/month',                fra: '❌ ₹14,060/month' },
  { feature: 'Real-time overlay',         javihai: '✅ Yes — invisible',           fra: '✅ Yes — invisible' },
  { feature: 'Voice transcription',       javihai: '✅ Whisper (Groq)',            fra: '✅ Yes' },
  { feature: 'Behavioral questions',      javihai: '✅ STAR method coaching',      fra: '✅ Yes' },
  { feature: 'Technical / coding',        javihai: '✅ Screenshot analysis',       fra: '✅ Yes' },
  { feature: 'Desi Mode (Indian context)', javihai: '✅ Yes — unique to JavihAI', fra: '❌ No' },
  { feature: 'Indian regional languages', javihai: '✅ Hindi, Tamil, Telugu…',     fra: '❌ English only' },
  { feature: 'Resume builder',            javihai: '✅ 5 templates, PDF',          fra: '❌ No' },
  { feature: 'Job recommendations',       javihai: '✅ Indian tech companies',     fra: '❌ No' },
  { feature: 'Mock interview mode',       javihai: '✅ Web-based',                fra: '✅ Yes' },
  { feature: 'Refund policy',             javihai: '✅ 7-day money-back',          fra: '❌ No refunds' },
  { feature: 'Works in India (payments)', javihai: '✅ Razorpay — UPI, cards',    fra: '⚠️ USD only' },
];

export default function FinalRoundAIComparePage() {
  return (
    <>
      <Navbar />
      <div className="pt-28 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">Final Round AI</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Same real-time invisible overlay. Same AI interview coaching.
            JavihAI is 15× cheaper — and built for India.
          </p>
        </div>

        {/* Price callout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card border-indigo-500/50 bg-indigo-500/5 text-center">
            <div className="badge mb-3">🏆 JavihAI</div>
            <div className="text-5xl font-black text-white mb-1">₹499<span className="text-xl font-normal text-slate-400">/mo</span></div>
            <div className="text-slate-400 mb-2">Unlimited AI answers</div>
            <div className="text-green-400 text-sm font-semibold">✓ UPI · Cards · Net Banking · 7-day refund</div>
          </div>
          <div className="card text-center opacity-75">
            <div className="text-sm font-semibold text-slate-400 mb-3">Final Round AI</div>
            <div className="text-5xl font-black text-slate-300 mb-1">₹7,695<span className="text-xl font-normal text-slate-500">/mo</span></div>
            <div className="text-slate-500 mb-2">Minimum (semi-annual billing)</div>
            <div className="text-red-400 text-sm">✗ No refunds · USD billing only</div>
          </div>
        </div>

        {/* Savings callout */}
        <div className="card bg-green-500/5 border-green-500/30 text-center mb-12">
          <p className="text-2xl font-black text-green-400">You save ₹86,352/year switching to JavihAI</p>
          <p className="text-slate-400 mt-2 text-sm">₹7,695 × 12 = ₹92,340 (Final Round AI) vs ₹499 × 12 = ₹5,988 (JavihAI)</p>
        </div>

        {/* Feature table */}
        <div className="card overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-indigo-400 font-semibold">JavihAI</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Final Round AI</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                  <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-slate-200">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{row.fra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '🇮🇳', title: 'Built for India', body: 'UPI payments, Desi Mode, Hindi/Tamil/Telugu answers, Indian company examples. Final Round AI charges in USD with no India-specific features.' },
            { icon: '💰', title: '15× Cheaper', body: 'Final Round AI costs ₹7,695–₹28,500/month. JavihAI Pro is ₹499/month. Same real-time overlay, same AI coaching quality.' },
            { icon: '🎁', title: 'More Features', body: 'JavihAI adds Resume Builder, Job Recommendations, and Mock Interview mode — features Final Round AI doesn\'t offer at any price.' },
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
          Pricing data sourced from finalroundai.com and saasworthy.com as of June 2026. USD converted at ₹95. All prices approximate.
        </p>
      </div>
      <Footer />
    </>
  );
}
