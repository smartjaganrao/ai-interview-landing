import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

// Criteria for "best AI interview copilot in India" — each backed by an
// already-established, sourced fact used elsewhere on the site (pricing
// page, homepage stat tiles, /compare pages), not a new unsourced claim.
const CRITERIA = [
  {
    name: 'Truly Unlimited — No Hourly Meters',
    detail:
      'Global competitors (Final Round AI, Cluely, Parakeet AI) cap you at 120–240 minutes/month and cut off mid-interview. JavihAI\'s Power plan has zero hourly limits — see the full breakdown on the compare pages.',
  },
  {
    name: 'Built for the Indian Job Market',
    detail:
      'Desi Mode frames answers around CTC in ₹ LPA, Indian notice-period and bond-clause norms, and Indian company context — not a US-built tool translated after the fact.',
  },
  {
    name: '10+ Indian Regional Languages',
    detail:
      'Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, and Punjabi are supported alongside English — most international copilots are English-only.',
  },
  {
    name: 'Free Forever Plan',
    detail:
      'Up to 15 AI answers per day (5 screenshot, 5 system-audio, 5 mic) with no credit card and no expiry — a real free tier, not a time-boxed trial.',
  },
  {
    name: '100% Invisible on Screen Share',
    detail:
      'Uses OS-level APIs to exclude itself from screen capture on Zoom, Google Meet, and Microsoft Teams — the interviewer sees only your screen.',
  },
  {
    name: 'Fast, Streamed Answers',
    detail:
      'Structured answers stream to your screen in under 2 seconds of a question being asked, so you\'re not waiting mid-interview.',
  },
  {
    name: 'India-Friendly Payments & Refunds',
    detail:
      'Pay by UPI, cards, or net banking via Razorpay — no USD-only billing — backed by a 7-day money-back guarantee.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What makes an AI interview copilot the "best" choice in India?',
    a: 'For Indian candidates specifically, the deciding factors are: no hourly meters (so it doesn\'t cut off mid-interview), Indian-context answers (CTC in LPA, notice period, bond clauses), regional language support, a real free plan, and India-friendly payments (UPI/Razorpay instead of USD-only billing). JavihAI is built around all five.',
  },
  {
    q: 'Is JavihAI really unlimited, unlike other AI interview tools?',
    a: 'Yes — the Power plan has zero hourly or minute caps, unlike Final Round AI, Cluely, and Parakeet AI, which meter usage and charge overtime fees once you hit a monthly limit. See the detailed side-by-side on the compare pages for exact figures.',
  },
  {
    q: 'Does JavihAI work on Zoom, Google Meet, and Microsoft Teams?',
    a: 'Yes. JavihAI runs as an invisible desktop overlay that excludes itself from screen capture at the OS level, so it works across Zoom, Google Meet, and Microsoft Teams without appearing on the interviewer\'s side.',
  },
  {
    q: 'Is there a free AI interview copilot in India?',
    a: 'Yes — JavihAI\'s free plan gives you up to 15 AI answers per day (5 per mode: screenshot, system-audio, mic) forever, with no credit card required. Paid passes unlock unlimited usage.',
  },
  {
    q: 'How is JavihAI different from international AI interview tools?',
    a: 'International tools like Final Round AI and Cluely are priced in USD, bill by the hour, and have no India-specific features. JavihAI is priced for India, has zero hourly caps, and includes Desi Mode for Indian interview context and 10+ regional languages.',
  },
];

export const metadata: Metadata = {
  title: { absolute: "Best AI Interview Copilot in India — JavihAI" },
  description:
    "Looking for the best AI interview copilot in India? JavihAI is 100% unlimited (no hourly meters), invisible on Zoom/Meet/Teams, built with Desi Mode for Indian interviews, and has a free plan that never expires.",
  keywords: [
    'best ai interview copilot india',
    'best ai interview assistant india',
    'best ai copilot for interviews india',
    'ai interview help india',
    'unlimited ai interview tool india',
  ],
  alternates: { canonical: 'https://javihai.in/best-ai-interview-copilot-india' },
  openGraph: {
    title: 'Best AI Interview Copilot in India — JavihAI',
    description:
      '100% unlimited, invisible on screen share, built for Indian interviews with Desi Mode and 10+ regional languages. Free plan available.',
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

export default function BestAIInterviewCopilotIndiaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <div className="pt-12 sm:pt-16 md:pt-20 pb-20">

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="badge mb-4">🇮🇳 Built for the Indian Job Market</div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            The <span className="text-gradient">Best AI Interview Copilot</span> in India
          </h1>
          <p className="text-xl text-[#57534E] max-w-2xl mx-auto mb-8">
            100% unlimited answers, invisible on screen share, and built around how interviews
            actually work in India — CTC in ₹ LPA, notice periods, and 10+ regional languages.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">See Pricing</Link>
          </div>
        </div>

        {/* Criteria */}
        <div className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">What Makes an AI Interview Copilot <span className="text-gradient">Best-in-Class</span> for India</h2>
            <p className="section-subheading mx-auto">Seven criteria, and how JavihAI stacks up on each one.</p>
          </div>
          <div className="space-y-4">
            {CRITERIA.map((c) => (
              <div key={c.name} className="card">
                <h3 className="text-lg font-bold text-[#1A1512] mb-2">{c.name}</h3>
                <p className="text-[#57534E] text-sm">{c.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[#78716C] text-sm mt-8">
            Want the numbers against a specific competitor?{' '}
            <Link href="/compare" className="text-[#0B63C7] font-semibold hover:underline">
              See detailed price &amp; feature comparisons →
            </Link>
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">Common <span className="text-gradient">Questions</span></h2>
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
            <h2 className="text-3xl font-black mb-4">Try India&apos;s Unlimited AI Interview Copilot</h2>
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
