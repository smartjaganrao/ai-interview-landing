import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

// Real, confirmed-supported platforms — matches the FAQ answer in
// components/LandingClient.tsx ("Does JavihAI work for coding rounds on
// HackerRank, LeetCode, and CodeSignal?") word for word.
const PLATFORMS = [
  { name: 'HackerRank', context: 'Campus placements and most Indian service-company coding rounds' },
  { name: 'LeetCode', context: 'Product-company and FAANG-style interview prep and live rounds' },
  { name: 'CodeSignal', context: 'General Coding Assessments and product-company screens' },
  { name: 'HackerEarth', context: 'Campus drives and hackathon-style coding challenges' },
  { name: 'CoderPad', context: 'Live pair-programming interviews at product companies and startups' },
  { name: 'Coderbyte', context: 'Take-home and live coding assessments' },
  { name: 'AmcatCode', context: 'AMCAT-based campus placement coding rounds' },
];

export const metadata: Metadata = {
  title: 'AI Interview Help for HackerRank, LeetCode & More',
  description:
    "JavihAI's Screenshot Solve works on HackerRank, LeetCode, CodeSignal, HackerEarth, CoderPad, Coderbyte, AmcatCode, and any other browser-based coding platform — solution with complexity analysis in under 2 seconds. Free plan available.",
  keywords: [
    'hackerrank ai assistant',
    'leetcode ai interview help india',
    'codesignal ai assistant',
    'coderpad ai help',
    'ai interview assistant coding platforms',
  ],
  alternates: { canonical: 'https://javihai.in/coding-platforms' },
  openGraph: {
    title: 'AI Interview Help for HackerRank, LeetCode & More',
    description:
      'Works on every major coding-round platform — screenshot the problem, get a solution with complexity analysis in under 2 seconds.',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PLATFORMS.map((p) => ({
    '@type': 'Question',
    name: `Does JavihAI work on ${p.name}?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `Yes. Press the Screenshot Solve hotkey while a problem is open on ${p.name} — JavihAI reads it and returns a solution with a step-by-step approach and time/space complexity in under 2 seconds. Commonly used for ${p.context.toLowerCase()}.`,
    },
  })),
};

export default function CodingPlatformsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="pt-24 pb-20">

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="badge mb-4">🖥️ Coding Platforms</div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Works on <span className="text-gradient">Every Coding Round Platform</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            HackerRank, LeetCode, CodeSignal, or any other browser-based coding platform — Screenshot
            Solve reads whatever&apos;s on screen and returns a working solution in under 2 seconds.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/dsa-topics" className="btn btn-secondary btn-lg">See DSA Topics Covered</Link>
          </div>
        </div>

        {/* Platform grid */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <div className="section-label">🎯 7 Platforms, Plus Any Other</div>
            <h2 className="section-heading mb-4">
              Wherever Your <span className="text-gradient">Coding Round Runs</span>
            </h2>
            <p className="text-slate-400">Screenshot Solve doesn&apos;t care which platform — it reads whatever&apos;s on your screen.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="card">
                <div className="text-xl font-bold text-white mb-2">{p.name}</div>
                <p className="text-slate-400 text-sm leading-relaxed">{p.context}</p>
              </div>
            ))}
            <div className="card border-dashed border-white/20 flex flex-col justify-center">
              <div className="text-sm font-semibold text-slate-300 mb-1">+ Any other browser-based platform</div>
              <p className="text-slate-500 text-xs leading-relaxed">Screenshot Solve works on the problem as displayed — it isn&apos;t tied to a specific platform&apos;s layout.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">Platform <span className="text-gradient">FAQs</span></h2>
          </div>
          <div className="space-y-3">
            {PLATFORMS.map((p) => (
              <details key={p.name} className="card group">
                <summary className="cursor-pointer font-semibold text-white flex items-center justify-between list-none">
                  Does JavihAI work on {p.name}?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                  Yes. Press the Screenshot Solve hotkey while a problem is open on {p.name} — JavihAI reads it
                  and returns a solution with a step-by-step approach and time/space complexity in under 2
                  seconds. Commonly used for {p.context.toLowerCase()}.
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <h2 className="text-3xl font-black mb-4">Your Coding Round, Covered</h2>
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
