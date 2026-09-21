import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

// Rounds and focus areas here reflect TCS's widely-documented NQT (National
// Qualifier Test) hiring process — public knowledge repeated across
// TCS's own careers site and every major placement-prep resource, not a
// JavihAI-specific claim. Nothing about JavihAI usage/results at TCS
// specifically is claimed — only that JavihAI's existing, already-verified
// feature set (Screenshot Solve, Desi Mode, system-audio listening) applies
// to these round types.
const ROUNDS = [
  {
    name: 'TCS NQT — Online Assessment',
    focus: 'Verbal ability, quantitative aptitude, reasoning, and a coding section (usually 1–2 problems in C/C++/Java/Python).',
    how: 'This round is proctored and solo — JavihAI is for live interview rounds, not this stage.',
  },
  {
    name: 'Technical Interview',
    focus: 'CS fundamentals — OOPs concepts, DBMS/SQL basics, data structures, and a live coding or pseudo-code problem. TCS technical rounds lean more on fundamentals than hard LeetCode-style DSA.',
    how: 'Run JavihAI in System Audio mode. When the interviewer asks a concept question or gives a coding problem, JavihAI streams a structured answer — definition, example, and code — in under 2 seconds, fully invisible on screen share.',
  },
  {
    name: 'HR / Managerial Round',
    focus: 'Background, willingness to relocate, bond/service-agreement questions, and general communication.',
    how: 'Desi Mode frames answers with Indian-context awareness — notice period, bond clauses, and CTC discussion in ₹ LPA — so responses sound natural for an Indian HR round, not translated from a US-style template.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What is the TCS interview process for freshers?',
    a: 'TCS hires primarily through TCS NQT: an online assessment (verbal, aptitude, reasoning, coding), followed by a technical interview and an HR/managerial round. Some drives combine technical and HR into one round.',
  },
  {
    q: 'Does TCS ask hard DSA questions like Amazon or Google?',
    a: "Generally no. TCS technical rounds focus more on CS fundamentals — OOPs, DBMS, basic data structures, and simple coding problems — rather than competitive-programming-level DSA. That said, JavihAI's Screenshot Solve still covers DSA topics if a coding round does go deeper.",
  },
  {
    q: 'Can JavihAI help during a TCS video interview?',
    a: "Yes — JavihAI runs invisibly alongside Zoom, Google Meet, or Microsoft Teams (all commonly used for TCS virtual interviews), listens via System Audio or Mic mode, and streams a structured answer in under 2 seconds without appearing on screen share.",
  },
  {
    q: 'Is JavihAI free to use for TCS interview prep?',
    a: 'Yes. JavihAI has a permanent free plan with up to 3 AI answers per day — no credit card required. Paid plans unlock unlimited answers and Desi Mode.',
  },
];

export const metadata: Metadata = {
  title: 'AI Interview Help for TCS — NQT, Technical & HR Rounds',
  description:
    "Prepping for a TCS interview? JavihAI listens during your live video interview and streams structured answers for TCS's technical and HR rounds in under 2 seconds — fully invisible on screen share. Free plan available.",
  keywords: [
    'TCS interview questions AI',
    'TCS NQT interview help',
    'TCS technical interview AI assistant',
    'AI interview help India TCS',
    'TCS HR interview preparation',
  ],
  alternates: { canonical: 'https://javihai.in/interview-prep/tcs' },
  openGraph: {
    title: 'AI Interview Help for TCS — NQT, Technical & HR Rounds',
    description:
      "JavihAI streams structured answers during TCS's technical and HR interview rounds — invisible on screen share, free to start.",
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

export default function TCSInterviewPrepPage() {
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
            Ace Your <span className="text-gradient">TCS Interview</span> with Live AI Help
          </h1>
          <p className="text-xl text-[#57534E] max-w-2xl mx-auto mb-8">
            TCS interviews run through NQT screening, a technical round on CS fundamentals, and an
            HR round. JavihAI runs invisibly during your live video interview and streams
            structured answers in under 2 seconds — for the rounds that actually happen on a call.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/dsa-topics" className="btn btn-secondary btn-lg">See Covered Topics</Link>
          </div>
        </div>

        {/* Rounds breakdown */}
        <div className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">The TCS Interview <span className="text-gradient">Process</span></h2>
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
            <h2 className="section-heading mb-4">TCS Interview <span className="text-gradient">FAQs</span></h2>
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
            <h2 className="text-3xl font-black mb-4">Ready for Your TCS Interview?</h2>
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
