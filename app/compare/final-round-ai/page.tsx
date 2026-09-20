import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs Final Round AI — ~4× Cheaper, Same Real-Time Overlay' },
  description: 'JavihAI vs Final Round AI: both offer a real-time invisible overlay for live interviews. JavihAI Power is ₹2,000/month vs Final Round AI ₹7,916/month (quarterly rate) — save ~75% with the same core feature.',
  keywords: ['final round ai alternative', 'final round ai vs javihai', 'cheaper ai interview assistant india', 'real-time interview ai india', 'final round ai india price'],
  alternates: { canonical: 'https://javihai.in/compare/final-round-ai' },
  openGraph: {
    title: 'JavihAI vs Final Round AI — ~4× Cheaper, Same Overlay',
    description: 'JavihAI ₹2,000/month vs Final Round AI ₹7,916/month (quarterly rate). Same real-time invisible overlay — save ~75%.',
  },
};

const ROWS = [
  { feature: 'Free plan',                  javihai: '✅ 25 answers/day forever',    fra: '⚠️ 5-min sessions only' },
  { feature: 'Entry paid price',           javihai: '✅ ₹250 (24-hour pass)',        fra: '❌ ₹7,916/month (quarterly)' },
  { feature: 'Unlimited monthly plan',    javihai: '✅ ₹2,000/month',               fra: '❌ ₹14,250/month' },
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
      <div className="pt-12 sm:pt-16 md:pt-20 pb-20 max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparison</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            JavihAI vs <span className="text-gradient">Final Round AI</span>
          </h1>
          <p className="text-xl text-[#57534E] max-w-2xl mx-auto">
            Same real-time invisible overlay. Same AI interview coaching.
            JavihAI is ~4× cheaper — and built for India.
          </p>
        </div>

        {/* Price callout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card border-indigo-500/50 bg-indigo-500/5 text-center">
            <div className="badge mb-3">🏆 JavihAI</div>
            <div className="text-5xl font-black text-[#1A1512] mb-1">₹2,000<span className="text-xl font-normal text-[#57534E]">/mo</span></div>
            <div className="text-[#57534E] mb-2">Power plan — unlimited AI answers</div>
            <div className="text-[#15803D] text-sm font-semibold">✓ UPI · Cards · Net Banking · 7-day refund</div>
          </div>
          <div className="card text-center opacity-75">
            <div className="text-sm font-semibold text-[#57534E] mb-3">Final Round AI</div>
            <div className="text-5xl font-black text-[#57534E] mb-1">₹7,916<span className="text-xl font-normal text-[#78716C]">/mo</span></div>
            <div className="text-[#78716C] mb-2">Minimum (quarterly billing)</div>
            <div className="text-red-600 text-sm">✗ No refunds · USD billing only</div>
          </div>
        </div>
        <p className="text-[#78716C] text-sm text-center -mt-8 mb-12">
          Just one interview coming up? JavihAI also has a ₹250 one-time Quick Pass — no monthly plan required.
        </p>

        {/* Savings callout */}
        <div className="card bg-green-500/5 border-green-500/30 text-center mb-12">
          <p className="text-2xl font-black text-[#15803D]">You save ₹70,992/year switching to JavihAI</p>
          <p className="text-[#57534E] mt-2 text-sm">₹7,916 × 12 = ₹94,992 (Final Round AI, quarterly rate) vs ₹2,000 × 12 = ₹24,000 (JavihAI Power)</p>
        </div>

        {/* Feature table */}
        <div className="card overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(26,21,18,0.1)]">
                <th className="text-left py-3 px-4 text-[#57534E] font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-[#0B63C7] font-semibold">JavihAI</th>
                <th className="text-center py-3 px-4 text-[#57534E] font-medium">Final Round AI</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={`border-b border-[rgba(26,21,18,0.08)] ${i % 2 === 0 ? 'bg-[rgba(26,21,18,0.03)]' : ''}`}>
                  <td className="py-3 px-4 text-[#57534E]">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-[#1A1512]">{row.javihai}</td>
                  <td className="py-3 px-4 text-center text-[#57534E]">{row.fra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why JavihAI */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '🇮🇳', title: 'Built for India', body: 'UPI payments, Desi Mode, Hindi/Tamil/Telugu answers, Indian company examples. Final Round AI charges in USD with no India-specific features.' },
            { icon: '💰', title: '~4× Cheaper', body: 'Final Round AI costs ₹7,916–₹14,250/month. JavihAI Power is ₹2,000/month. Same real-time overlay, same AI coaching quality.' },
            { icon: '🎁', title: 'More Features', body: 'JavihAI adds Resume Builder, Job Recommendations, and Mock Interview mode — features Final Round AI doesn\'t offer at any price.' },
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
          <h2 className="text-3xl font-black mb-4">Try JavihAI free — no credit card needed</h2>
          <p className="text-[#57534E] mb-6">Up to 25 AI answers every day, forever. Upgrade to Power anytime for ₹2,000/month.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Get Started Free →</Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">See Pricing</Link>
          </div>
        </div>

        <p className="text-center text-[#78716C] text-xs mt-8">
          Pricing data sourced directly from finalroundai.com as of September 2026 — Monthly $150, Quarterly $83.33/mo. USD converted at ₹95. All prices approximate and subject to change.
        </p>
      </div>
      <Footer />
    </>
  );
}
