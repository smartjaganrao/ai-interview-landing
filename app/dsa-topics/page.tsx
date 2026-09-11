import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

// Every topic here is a real, confirmed entry from the FAQ answer in
// components/LandingClient.tsx ("What DSA topics can JavihAI solve?") —
// keep the two in sync if this list ever changes.
const TOPICS = [
  { name: 'Arrays', group: 'Data Structures' },
  { name: 'Strings', group: 'Data Structures' },
  { name: 'Linked Lists', group: 'Data Structures' },
  { name: 'Trees', group: 'Data Structures' },
  { name: 'Graphs', group: 'Data Structures' },
  { name: 'Stacks', group: 'Data Structures' },
  { name: 'Queues', group: 'Data Structures' },
  { name: 'Heaps', group: 'Data Structures' },
  { name: 'Tries', group: 'Data Structures' },
  { name: 'Dynamic Programming', group: 'Algorithms & Patterns' },
  { name: 'Recursion', group: 'Algorithms & Patterns' },
  { name: 'Backtracking', group: 'Algorithms & Patterns' },
  { name: 'Sorting', group: 'Algorithms & Patterns' },
  { name: 'Binary Search', group: 'Algorithms & Patterns' },
  { name: 'Hashing', group: 'Algorithms & Patterns' },
  { name: 'Bit Manipulation', group: 'Algorithms & Patterns' },
  { name: 'Greedy', group: 'Algorithms & Patterns' },
  { name: 'Sliding Window', group: 'Algorithms & Patterns' },
  { name: 'Two Pointers', group: 'Algorithms & Patterns' },
  { name: 'SQL', group: 'Beyond DSA' },
  { name: 'OOP Design', group: 'Beyond DSA' },
  { name: 'System Design', group: 'Beyond DSA' },
];

// Deepest-value FAQ entries — a full schema block for all 21 topics would
// read as keyword-stuffing rather than genuine help; these are the topics
// candidates actually search for by name.
const FAQ_TOPICS = ['Dynamic Programming', 'Trees', 'Graphs', 'System Design', 'SQL', 'OOP Design', 'Sliding Window', 'Binary Search'];

export const metadata: Metadata = {
  title: 'AI Interview Help for DSA — Arrays to System Design',
  description:
    "JavihAI's Screenshot Solve covers every major DSA topic — Arrays, Trees, Graphs, Dynamic Programming, System Design, SQL and more — with step-by-step approach and complexity analysis in under 2 seconds. Free plan available.",
  keywords: [
    'dsa interview ai assistant',
    'dynamic programming interview ai',
    'system design interview ai india',
    'data structures interview help ai',
    'leetcode ai assistant india',
    'coding interview ai topics',
  ],
  alternates: { canonical: 'https://javihai.in/dsa-topics' },
  openGraph: {
    title: 'AI Interview Help for DSA — Arrays to System Design',
    description:
      'Every major DSA topic covered — screenshot the problem, get a solution with complexity analysis in under 2 seconds.',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_TOPICS.map((name) => ({
    '@type': 'Question',
    name: `Can JavihAI solve ${name} interview questions?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `Yes. Press the Screenshot Solve hotkey while a ${name} problem is on screen — JavihAI reads it and returns a step-by-step approach with time/space complexity in under 2 seconds, in whichever of the 10 supported languages you're using.`,
    },
  })),
};

export default function DSATopicsPage() {
  const groups = Array.from(new Set(TOPICS.map((t) => t.group)));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="pt-24 pb-20">

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="badge mb-4">🧩 DSA &amp; Beyond</div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Every DSA Topic, <span className="text-gradient">From Arrays to System Design</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Screenshot the problem — JavihAI reads it, works through the approach, and returns a
            solution with time/space complexity in under 2 seconds. Covers data structures,
            algorithm patterns, SQL, and system design rounds.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/programming-languages" className="btn btn-secondary btn-lg">See Supported Languages</Link>
          </div>
        </div>

        {/* Topic grid, grouped */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          {groups.map((group) => (
            <div key={group} className="mb-10">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{group}</h2>
              <div className="flex flex-wrap gap-2.5">
                {TOPICS.filter((t) => t.group === group).map((t) => (
                  <span key={t.name} className="text-sm px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">Topic <span className="text-gradient">FAQs</span></h2>
          </div>
          <div className="space-y-3">
            {FAQ_TOPICS.map((name) => (
              <details key={name} className="card group">
                <summary className="cursor-pointer font-semibold text-white flex items-center justify-between list-none">
                  Can JavihAI solve {name} interview questions?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                  Yes. Press the Screenshot Solve hotkey while a {name} problem is on screen — JavihAI reads it
                  and returns a step-by-step approach with time/space complexity in under 2 seconds, in
                  whichever of the 10 supported languages you&apos;re using.
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <h2 className="text-3xl font-black mb-4">Ready for Any DSA Round?</h2>
            <p className="text-slate-400 mb-6">Free plan available. No credit card. Works alongside any video call.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
              <Link href="/pricing" className="btn btn-secondary btn-lg">See Pricing</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
