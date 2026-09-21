import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

// Rounds and focus areas reflect Amazon's widely-documented SDE hiring
// process (OA, DSA rounds, Leadership Principles behavioral rounds, Bar
// Raiser) — public knowledge published by Amazon itself and repeated
// across every major interview-prep resource, not a JavihAI-specific
// claim. Nothing about JavihAI usage/results at Amazon specifically is
// claimed — only that JavihAI's existing, already-verified feature set
// applies to these round types.
const ROUNDS = [
  {
    name: 'Online Assessment (OA)',
    focus: '1–2 DSA coding problems plus a work-simulation/behavioral assessment.',
    how: 'This round is proctored and solo — JavihAI is for live interview rounds, not this stage.',
  },
  {
    name: 'Technical (DSA) Rounds',
    focus: 'Data structures and algorithms — arrays, trees, graphs, dynamic programming — often with a focus on optimal time/space complexity, plus system design for SDE-2 and above.',
    how: "JavihAI's Screenshot Solve reads the problem off your screen and returns a step-by-step approach with time/space complexity in under 2 seconds — invisible on screen share, in whichever of the 10 supported languages you're using.",
  },
  {
    name: 'Leadership Principles (Behavioral)',
    focus: "Amazon's 16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, and others) via STAR-format behavioral questions — usually across multiple rounds, including a Bar Raiser.",
    how: 'Run JavihAI in System Audio or Mic mode during the call. It structures a STAR-format answer (Situation, Task, Action, Result) in under 2 seconds based on what the interviewer actually asked.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What is the Amazon SDE interview process?',
    a: 'Amazon SDE interviews typically start with an Online Assessment (DSA problems + work simulation), followed by 3–5 rounds mixing technical DSA questions with Leadership Principles behavioral questions, including a Bar Raiser round for objectivity.',
  },
  {
    q: 'What are Leadership Principles and why does Amazon ask about them?',
    a: "Amazon has 16 published Leadership Principles (e.g. Customer Obsession, Ownership, Bias for Action) that guide how the company operates. Interviewers ask behavioral questions tied to these principles, usually expecting a STAR-format answer (Situation, Task, Action, Result).",
  },
  {
    q: 'Can JavihAI help with both DSA and Leadership Principles questions?',
    a: "Yes. JavihAI's Screenshot Solve handles DSA problems with a step-by-step approach and complexity analysis, while System Audio/Mic mode structures STAR-format answers for Leadership Principles questions — both in under 2 seconds, invisible on screen share.",
  },
  {
    q: 'Is JavihAI free to use for Amazon interview prep?',
    a: 'Yes. JavihAI has a permanent free plan with up to 3 AI answers per day — no credit card required. Paid plans unlock unlimited answers.',
  },
];

export const metadata: Metadata = {
  title: 'AI Interview Help for Amazon SDE — DSA & Leadership Principles',
  description:
    "Prepping for an Amazon SDE interview? JavihAI listens during your live video interview and streams structured answers for DSA rounds and Leadership Principles behavioral questions in under 2 seconds — fully invisible on screen share. Free plan available.",
  keywords: [
    'Amazon SDE interview AI assistant',
    'Amazon interview questions AI',
    'Amazon Leadership Principles interview help',
    'Amazon OA DSA AI',
    'AI interview help India Amazon',
  ],
  alternates: { canonical: 'https://javihai.in/interview-prep/amazon' },
  openGraph: {
    title: 'AI Interview Help for Amazon SDE — DSA & Leadership Principles',
    description:
      "JavihAI streams structured answers for Amazon's DSA rounds and Leadership Principles behavioral questions — invisible on screen share, free to start.",
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function AmazonInterviewPrepPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <div className="pt-12 sm:pt-16 md:pt-20 pb-20">

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="badge mb-4">🏢 Company Interview Prep</div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Ace Your <span className="text-gradient">Amazon SDE Interview</span> with Live AI Help
          </h1>
          <p className="text-xl text-[#57534E] max-w-2xl mx-auto mb-8">
            Amazon interviews mix DSA coding rounds with Leadership Principles behavioral
            questions across a Bar Raiser process. JavihAI runs invisibly during your live video
            interview and streams structured answers for both, in under 2 seconds.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/dsa-topics" className="btn btn-secondary btn-lg">See Covered Topics</Link>
          </div>
        </div>

        {/* Rounds breakdown */}
        <div className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">The Amazon SDE Interview <span className="text-gradient">Process</span></h2>
            <p className="section-subheading mx-auto">What each round covers, and where JavihAI actually helps.</p>
          </div>
          <div className="space-y-4">
            {ROUNDS.map((r) => (
              <div key={r.name} className="card">
                <h3 className="text-lg font-bold text-[#1A1512] mb-2">{r.name}</h3>
                <p className="text-[#57534E] text-sm mb-3"><span className="font-semibold text-[#1A1512]">Focus: </span>{r.focus}</p>
                <p className="text-[#57534E] text-sm"><span className="font-semibold text-[#1A1512]">JavihAI: </span>{r.how}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">Amazon Interview <span className="text-gradient">FAQs</span></h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }) => (
              <details key={q} className="card group">
                <summary className="cursor-pointer font-semibold text-[#1A1512] flex items-center justify-between list-none">
                  {q}
                  <span className="text-[#78716C] group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-[#57534E] text-sm mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <h2 className="text-3xl font-black mb-4">Ready for Your Amazon Interview?</h2>
            <p className="text-[#57534E] mb-6">Free plan available. No credit card. Works alongside Zoom, Meet, and Teams.</p>
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
