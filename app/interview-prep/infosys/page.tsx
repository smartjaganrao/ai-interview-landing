import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

// Rounds and focus areas reflect Infosys's widely-documented hiring process
// (InfyTQ / on-campus test, then technical + HR rounds) — public knowledge
// repeated across Infosys's own careers site and placement-prep resources,
// not a JavihAI-specific claim. Nothing about JavihAI usage/results at
// Infosys specifically is claimed — only that JavihAI's existing,
// already-verified feature set applies to these round types.
const ROUNDS = [
  {
    name: 'Online Test / InfyTQ',
    focus: 'Quantitative aptitude, logical reasoning, verbal ability, and a pseudo-code or basic coding section.',
    how: 'This round is proctored and solo — JavihAI is for live interview rounds, not this stage.',
  },
  {
    name: 'Technical Interview',
    focus: 'OOP concepts, DBMS/SQL, basic data structures, and puzzles. Infosys technical rounds are known for logic-based puzzles alongside standard CS fundamentals.',
    how: 'Run JavihAI in System Audio mode. When the interviewer poses a puzzle or coding question, JavihAI streams a structured, step-by-step answer in under 2 seconds — fully invisible on screen share.',
  },
  {
    name: 'HR Round',
    focus: 'Background, career goals, relocation and shift flexibility, and general communication.',
    how: "Desi Mode frames answers with Indian-context awareness — notice period, CTC in ₹ LPA, and company-specific framing — so responses sound natural for an Indian HR round.",
  },
];

const FAQ_ITEMS = [
  {
    q: 'What is the Infosys interview process for freshers?',
    a: 'Infosys typically hires through an online test (often via InfyTQ certification or an on-campus assessment) covering aptitude, reasoning, and basic coding, followed by a technical interview and an HR round.',
  },
  {
    q: 'Does Infosys ask puzzles in the technical round?',
    a: "Yes — Infosys technical interviews are known for including logic puzzles alongside standard CS fundamentals like OOPs, DBMS, and basic data structures, rather than heavy competitive-programming DSA.",
  },
  {
    q: 'Can JavihAI help during an Infosys video interview?',
    a: 'Yes — JavihAI runs invisibly alongside Zoom, Google Meet, or Microsoft Teams, listens via System Audio or Mic mode, and streams a structured answer in under 2 seconds without appearing on screen share.',
  },
  {
    q: 'Is JavihAI free to use for Infosys interview prep?',
    a: 'Yes. JavihAI has a permanent free plan with up to 25 AI answers per day — no credit card required. Paid plans unlock unlimited answers and Desi Mode.',
  },
];

export const metadata: Metadata = {
  title: 'AI Interview Help for Infosys — Technical & HR Rounds',
  description:
    "Prepping for an Infosys interview? JavihAI listens during your live video interview and streams structured answers for Infosys's technical and HR rounds in under 2 seconds — fully invisible on screen share. Free plan available.",
  keywords: [
    'Infosys interview questions AI',
    'Infosys technical interview AI assistant',
    'InfyTQ interview help',
    'AI interview help India Infosys',
    'Infosys HR interview preparation',
  ],
  alternates: { canonical: 'https://javihai.in/interview-prep/infosys' },
  openGraph: {
    title: 'AI Interview Help for Infosys — Technical & HR Rounds',
    description:
      "JavihAI streams structured answers during Infosys's technical and HR interview rounds — invisible on screen share, free to start.",
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

export default function InfosysInterviewPrepPage() {
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
            Ace Your <span className="text-gradient">Infosys Interview</span> with Live AI Help
          </h1>
          <p className="text-xl text-[#57534E] max-w-2xl mx-auto mb-8">
            Infosys interviews combine an online screening test with a technical round known for
            logic puzzles, plus an HR round. JavihAI runs invisibly during your live video
            interview and streams structured answers in under 2 seconds.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/dsa-topics" className="btn btn-secondary btn-lg">See Covered Topics</Link>
          </div>
        </div>

        {/* Rounds breakdown */}
        <div className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">The Infosys Interview <span className="text-gradient">Process</span></h2>
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
            <h2 className="section-heading mb-4">Infosys Interview <span className="text-gradient">FAQs</span></h2>
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
            <h2 className="text-3xl font-black mb-4">Ready for Your Infosys Interview?</h2>
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
