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
  { name: 'Final Round AI',  price: '₹7,695/mo',          savings: '~4×',   slug: 'final-round-ai',   tag: '🌐 Market leader' },
  { name: 'Interview Coder', price: '$299/mo (~₹28,400)', savings: '~14×',  slug: 'interview-coder',  tag: '💻 Coding-only tool' },
  { name: 'Cluely',          price: '$75/mo (~₹7,125)',   savings: '~3.6×', slug: 'cluely',           tag: '🕵️ Undetectable add-on' },
  { name: 'LockedIn AI',     price: '$49.99/mo (~₹4,749)',savings: '~2.4×', slug: 'lockedin-ai',      tag: '🔒 Meeting copilot' },
  { name: 'Parakeet AI',     price: '$149.90/mo (~₹14,240)', savings: '~7×', slug: 'parakeet-ai',    tag: '🦜 Credit-based tool' },
];

export default function ComparePage() {
  return (
    <>
      <div className="pt-28 pb-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="badge mb-4">⚔️ Comparisons</div>
          <h1 className="text-5xl font-black mb-6">JavihAI vs <span className="text-gradient">Everyone</span></h1>
          <p className="text-xl text-slate-400">See exactly how JavihAI stacks up — feature by feature, rupee by rupee.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {COMPETITORS.map(c => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="card card-glow hover:border-indigo-500/40 transition-all group block">
              <div className="text-xs text-slate-500 mb-2">{c.tag}</div>
              <h2 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors mb-2">
                JavihAI vs {c.name}
              </h2>
              <p className="text-slate-400 text-sm mb-4">Their price: <span className="text-red-400 font-semibold">{c.price}</span> · JavihAI: <span className="text-green-400 font-semibold">₹2,000/mo</span></p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold">
                Save {c.savings} with JavihAI →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 card text-center">
          <p className="text-slate-400 mb-4">Ready to switch?</p>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free — No Credit Card →</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
