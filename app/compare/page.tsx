import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { absolute: 'JavihAI vs Competitors — Pricing & Feature Comparison 2026' },
  description: 'How JavihAI compares to Final Round AI, Chiku AI, and Interview Coder on price and features. JavihAI is India\'s first unlimited AI interview copilot — unlimited from ₹2,000/month.',
  keywords: ['JavihAI vs competitors', 'Final Round AI alternative', 'Chiku AI alternative', 'Interview Coder alternative', 'Cluely alternative India', 'LockedIn AI alternative India', 'Parakeet AI alternative', 'best AI interview tool India', 'cheapest AI interview assistant'],
  alternates: { canonical: 'https://javihai.in/compare' },
};

const COMPETITORS = [
  { name: 'Chiku AI',        price: '₹3,499/mo',          savings: '~1.8×', slug: 'chiku-ai',         tag: '🇮🇳 Indian competitor' },
  { name: 'Final Round AI',  price: '₹7,916/mo',          savings: '~4×',   slug: 'final-round-ai',   tag: '🌐 Market leader' },
  { name: 'Interview Coder', price: '$299/mo (~₹28,400)', savings: '~14×',  slug: 'interview-coder',  tag: '💻 Coding-only tool' },
  { name: 'Cluely',          price: '$149.99/mo (~₹14,250)', savings: '~7×', slug: 'cluely',         tag: '🕵️ Undetectable add-on' },
  { name: 'LockedIn AI',     price: '$49.99/mo (~₹4,749)',savings: '~2.4×', slug: 'lockedin-ai',      tag: '🔒 Meeting copilot' },
  { name: 'Parakeet AI',     price: '$149.90/mo (~₹14,240)', savings: '~7×', slug: 'parakeet-ai',    tag: '🦜 Credit-based tool' },
];

const comparisonListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: COMPETITORS.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: `JavihAI vs ${c.name}`,
    url: `https://javihai.in/compare/${c.slug}`,
  })),
};

export default function ComparePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonListSchema).replace(/</g, '\\u003c') }}
      />
      <div className="pt-12 sm:pt-16 md:pt-20 pb-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparisons</div>
          <h1 className="text-5xl font-black mb-6">JavihAI vs <span className="text-gradient">Everyone</span></h1>
          <p className="text-xl text-[#57534E]">
            Other tools charge $150–$300/mo by the hour and shut down mid-interview. JavihAI is the world&apos;s only truly unlimited AI copilot — zero hourly caps, no ticking meters.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {COMPETITORS.map(c => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="card card-glow hover:border-indigo-500/40 transition-all group block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#78716C]">{c.tag}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-600">⏳ Metered</span>
              </div>
              <h2 className="text-2xl font-black text-[#1A1512] group-hover:text-[#0B63C7] transition-colors mb-2">
                JavihAI vs {c.name}
              </h2>
              <p className="text-[#57534E] text-sm mb-4">Their price: <span className="text-red-600 font-semibold">{c.price}</span> · JavihAI: <span className="text-[#15803D] font-semibold">Unlimited</span></p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-[#15803D] text-sm font-semibold">
                Save {c.savings} + Unlimited →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 card text-center">
          <p className="text-[#57534E] mb-4">Ready to switch?</p>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free — No Credit Card →</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
