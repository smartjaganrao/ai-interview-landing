import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

// Real, confirmed-supported languages — matches the FAQ answer in
// components/LandingClient.tsx ("Which programming languages does JavihAI
// support for coding rounds?") word for word. Don't add a language here
// without updating that FAQ answer too, or the two will drift and the
// FAQPage schema below will assert something the visible FAQ doesn't.
const LANGUAGES = [
  { slug: 'python', name: 'Python', context: 'Data roles, scripting, ML/AI interviews, LeetCode-style rounds' },
  { slug: 'java', name: 'Java', context: 'Enterprise backend, Android, and most Indian service-company interviews' },
  { slug: 'cpp', name: 'C++', context: 'Competitive programming rounds and systems-heavy interviews' },
  { slug: 'javascript', name: 'JavaScript', context: 'Frontend and full-stack rounds at product companies and startups' },
  { slug: 'typescript', name: 'TypeScript', context: 'Frontend/full-stack rounds where the JD calls out TypeScript specifically' },
  { slug: 'csharp', name: 'C#', context: '.NET backend roles and enterprise/MNC interviews' },
  { slug: 'go', name: 'Go', context: 'Backend and infrastructure roles at newer product companies' },
  { slug: 'kotlin', name: 'Kotlin', context: 'Android engineering interviews' },
  { slug: 'sql', name: 'SQL', context: 'Data analyst, data engineering, and backend query-heavy rounds' },
  { slug: 'bash', name: 'Bash', context: 'DevOps, SRE, and systems interviews' },
];

export const metadata: Metadata = {
  title: 'AI Interview Help for Python, Java, C++ & 7 More Languages',
  description:
    "JavihAI's Screenshot Solve generates coding-round solutions in Python, Java, C++, JavaScript, TypeScript, C#, Go, Kotlin, SQL, and Bash — with step-by-step approach and time/space complexity in under 2 seconds. Free plan available.",
  keywords: [
    'python interview ai assistant',
    'java interview questions india ai',
    'ai interview help javascript',
    'c++ coding interview ai',
    'ai interview assistant programming languages',
    'coding interview ai india',
  ],
  alternates: { canonical: 'https://javihai.in/programming-languages' },
  openGraph: {
    title: 'AI Interview Help for Python, Java, C++ & 7 More Languages',
    description:
      'Screenshot a coding problem, get a solution with complexity analysis — in the language you actually use. 10 languages supported.',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: LANGUAGES.map((l) => ({
    '@type': 'Question',
    name: `Can JavihAI solve ${l.name} coding interview questions?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `Yes. Press the Screenshot Solve hotkey while a ${l.name} problem is on screen — JavihAI reads the problem and returns a working solution in ${l.name} with a step-by-step approach and time/space complexity, in under 2 seconds. Commonly used for ${l.context.toLowerCase()}.`,
    },
  })),
};

export default function ProgrammingLanguagesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <div className="pt-12 sm:pt-16 md:pt-20 pb-20">

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="badge mb-4">💻 Coding Rounds</div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Coding Interview Help in <span className="text-gradient">Your Language</span>
          </h1>
          <p className="text-xl text-[#57534E] max-w-2xl mx-auto mb-8">
            Screenshot the problem on HackerRank, LeetCode, or CodeSignal — JavihAI returns a working
            solution with a step-by-step approach and time/space complexity, in the language you're
            actually being interviewed in.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/install" className="btn btn-secondary btn-lg">Download the App</Link>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto px-6 mb-16">
          <div className="glass-card p-8 border border-blue-500/15">
            <h2 className="text-2xl font-bold text-[#1A1512] mb-4">One hotkey, any language</h2>
            <p className="text-[#57534E] leading-relaxed mb-4">
              Most coding-round tools assume everyone codes in the same language. JavihAI generates
              the solution in whichever of the 10 supported languages you actually use — set it once in
              your profile, or mention it in the problem context and JavihAI picks it up automatically.
            </p>
            <p className="text-[#57534E] leading-relaxed">
              Works on{' '}
              <span className="text-[#0B63C7]">HackerRank, LeetCode, CodeSignal, HackerEarth, CoderPad, Coderbyte, AmcatCode</span>{' '}
              and any other browser-based coding platform — see the full{' '}
              <Link href="/#faq" className="text-[#0B63C7] hover:text-[#1E90FF] underline">FAQ</Link> for DSA topic coverage.
            </p>
          </div>
        </div>

        {/* Language grid */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <div className="section-label">🧑‍💻 10 Languages</div>
            <h2 className="section-heading mb-4">
              Pick the Language <span className="text-gradient">Your Interview Actually Uses</span>
            </h2>
            <p className="text-[#57534E]">Set it in your profile — every Screenshot Solve answer comes back in that language.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LANGUAGES.map((l) => (
              <div key={l.slug} className="card">
                <div className="text-xl font-bold text-[#1A1512] mb-2">{l.name}</div>
                <p className="text-[#57534E] text-sm leading-relaxed">{l.context}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-4">Language <span className="text-gradient">FAQs</span></h2>
          </div>
          <div className="space-y-3">
            {LANGUAGES.map((l) => (
              <details key={l.slug} className="card group">
                <summary className="cursor-pointer font-semibold text-[#1A1512] flex items-center justify-between list-none">
                  Can JavihAI solve {l.name} coding interview questions?
                  <span className="text-[#78716C] group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-[#57534E] text-sm mt-3 leading-relaxed">
                  Yes. Press the Screenshot Solve hotkey while a {l.name} problem is on screen — JavihAI reads
                  the problem and returns a working solution in {l.name} with a step-by-step approach and
                  time/space complexity, in under 2 seconds. Commonly used for {l.context.toLowerCase()}.
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <h2 className="text-3xl font-black mb-4">Never Blank on a Coding Round Again</h2>
            <p className="text-[#57534E] mb-6">Free plan available. No credit card. Works alongside any video call.</p>
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
