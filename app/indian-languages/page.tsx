import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी',   tagline: 'साक्षात्कार में हिंदी में जवाब पाएं',                    hub: 'Delhi-NCR, Lucknow, Jaipur' },
  { code: 'ta', name: 'Tamil',      native: 'தமிழ்',     tagline: 'நேர்காணலில் தமிழில் பதில் பெறுங்கள்',                    hub: 'Chennai, Coimbatore' },
  { code: 'te', name: 'Telugu',     native: 'తెలుగు',    tagline: 'ఇంటర్వ్యూలో తెలుగులో సమాధానాలు పొందండి',                 hub: 'Hyderabad, Vijayawada' },
  { code: 'bn', name: 'Bengali',    native: 'বাংলা',     tagline: 'সাক্ষাৎকারে বাংলায় উত্তর পান',                          hub: 'Kolkata, Howrah' },
  { code: 'mr', name: 'Marathi',    native: 'मराठी',     tagline: 'मुलाखतीत मराठीत उत्तरे मिळवा',                          hub: 'Mumbai, Pune, Nagpur' },
  { code: 'kn', name: 'Kannada',    native: 'ಕನ್ನಡ',     tagline: 'ಸಂದರ್ಶನದಲ್ಲಿ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಗಳನ್ನು ಪಡೆಯಿರಿ',            hub: 'Bengaluru, Mysuru' },
  { code: 'ml', name: 'Malayalam',  native: 'മലയാളം',   tagline: 'അഭിമുഖത്തിൽ മലയാളത്തിൽ ഉത്തരങ്ങൾ നേടൂ',                  hub: 'Kochi, Thiruvananthapuram' },
  { code: 'gu', name: 'Gujarati',   native: 'ગુજરાતી',   tagline: 'ઇન્ટરવ્યુમાં ગુજરાતીમાં જવાબો મેળવો',                    hub: 'Ahmedabad, Surat' },
  { code: 'pa', name: 'Punjabi',    native: 'ਪੰਜਾਬੀ',    tagline: 'ਇੰਟਰਵਿਊ ਵਿੱਚ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਪ੍ਰਾਪਤ ਕਰੋ',                hub: 'Chandigarh, Ludhiana' },
];

export const metadata: Metadata = {
  title: "AI Interview Answers in Hindi, Tamil, Telugu & 6 More — India's First",
  description:
    "JavihAI is India's first AI interview copilot with real-time answers in 9 Indian languages — Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati & Punjabi. Free plan available.",
  keywords: [
    'ai interview help in hindi',
    'interview answers in tamil',
    'telugu ai interview assistant',
    'regional language interview ai india',
    'multilingual ai interview copilot india',
    'desi mode indian languages',
    'hindi tamil telugu interview ai',
  ],
  alternates: { canonical: 'https://javihai.in/indian-languages' },
  openGraph: {
    title: "India's First AI Interview Copilot in 9 Indian Languages",
    description:
      'Real-time interview answers in Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati & Punjabi — not just English.',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: LANGUAGES.map((l) => ({
    '@type': 'Question',
    name: `Does JavihAI give interview answers in ${l.name}?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `Yes. Open Profile → AI Answer Style in the JavihAI desktop app, enable Desi Mode, and set ${l.name} (${l.native}) as your answer language. JavihAI responds to live interview questions in ${l.name} in real time — popular with candidates interviewing from ${l.hub}. Code and technical syntax stay in English.`,
    },
  })),
};

export default function IndianLanguagesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="pt-24 pb-20">

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="badge mb-4">🇮🇳 India&apos;s First</div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Interview Answers in <span className="text-gradient">Your Language</span> — Not Just English
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            JavihAI is the first AI interview copilot built for India to answer live interview
            questions in Hindi, Tamil, Telugu, and 6 more Indian languages — not just English.
            Speak the language you think in, even under interview pressure.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Free →</Link>
            <Link href="/install" className="btn btn-secondary btn-lg">Download the App</Link>
          </div>
        </div>

        {/* Why it matters */}
        <div className="max-w-4xl mx-auto px-6 mb-16">
          <div className="glass-card p-8 border border-orange-500/15">
            <h2 className="text-2xl font-bold text-white mb-4">Why English-only AI tools fall short in India</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Millions of Indian engineers and professionals think in Hindi, Tamil, Telugu, or
              Bengali — but are expected to answer interview questions in English, live, on a
              video call. Every other AI interview tool —{' '}
              <Link href="/compare/cluely" className="text-blue-400 hover:text-blue-300 underline">Cluely</Link>,{' '}
              <Link href="/compare/final-round-ai" className="text-blue-400 hover:text-blue-300 underline">Final Round AI</Link>,{' '}
              <Link href="/compare/interview-coder" className="text-blue-400 hover:text-blue-300 underline">Interview Coder</Link>,{' '}
              <Link href="/compare/lockedin-ai" className="text-blue-400 hover:text-blue-300 underline">LockedIn AI</Link>, and{' '}
              <Link href="/compare/parakeet-ai" className="text-blue-400 hover:text-blue-300 underline">Parakeet AI</Link>{' '}
              — answers in English only.
            </p>
            <p className="text-slate-400 leading-relaxed">
              JavihAI&apos;s Desi Mode changes that: hear the question in English, get the answer
              streamed back in your own language in under 2 seconds, while any code stays in
              English syntax.
            </p>
          </div>
        </div>

        {/* Hero example in Hindi */}
        <div className="max-w-3xl mx-auto px-6 mb-20">
          <div className="glass-card p-8 border border-orange-500/15">
            <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Interviewer asks (English)</div>
            <p className="text-slate-300 italic mb-6 leading-relaxed">
              &ldquo;Tell me about a time you solved a difficult technical problem.&rdquo;
            </p>
            <div className="border-t border-white/5 pt-6">
              <div className="text-xs text-orange-400 uppercase tracking-wide font-medium mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block animate-pulse" />
                JavihAI answers in Hindi (हिन्दी)
              </div>
              <p lang="hi" className="text-slate-200 text-lg leading-relaxed mb-3">
                एक बार प्रोडक्शन में हमारा पेमेंट गेटवे बार-बार टाइमआउट हो रहा था। मैंने लॉग्स
                एनालाइज़ किए, समस्या को कनेक्शन पूल एग्जॉशन तक ट्रेस किया, और पूल साइज़ बढ़ाकर तथा
                रिट्राई लॉजिक जोड़कर उसे ठीक किया।
              </p>
              <p className="text-slate-500 text-sm">
                English: &ldquo;Once in production, our payment gateway kept timing out. I
                analyzed the logs, traced it to connection pool exhaustion, and fixed it by
                increasing the pool size and adding retry logic.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Language grid */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <div className="section-label">🗣️ 9 Indian Languages</div>
            <h2 className="section-heading mb-4">
              Answer In the Language <span className="text-gradient">You&apos;re Most Fluent In</span>
            </h2>
            <p className="text-slate-400">Toggle Desi Mode, pick a language, and every AI answer switches — instantly.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LANGUAGES.map((l) => (
              <div key={l.code} className="card">
                <div className="flex items-baseline gap-2 mb-2">
                  <span lang={l.code} className="text-2xl font-bold text-white">{l.native}</span>
                  <span className="text-sm text-slate-500">{l.name}</span>
                </div>
                <p lang={l.code} className="text-slate-300 mb-2 leading-relaxed">{l.tagline}</p>
                <p className="text-xs text-slate-500">Popular with candidates in {l.hub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <div className="section-label">⚙️ Setup</div>
            <h2 className="section-heading mb-4">
              How to Turn On <span className="text-gradient">Your Language</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: '1', title: 'Open Profile', desc: 'In the JavihAI desktop app, click your profile icon and go to AI Answer Style.' },
              { n: '2', title: 'Enable Desi Mode', desc: 'Toggle Desi Mode on — this unlocks Indian context and regional language answers.' },
              { n: '3', title: 'Pick your language', desc: 'Choose Hindi, Tamil, Telugu, or any of the 9 supported languages. Answers switch instantly.' },
            ].map((s) => (
              <div key={s.n} className="card text-center">
                <div className="w-8 h-8 rounded-full bg-orange-500/15 text-orange-300 font-bold flex items-center justify-center mx-auto mb-3">{s.n}</div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
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
              <details key={l.code} className="card group">
                <summary className="cursor-pointer font-semibold text-white flex items-center justify-between list-none">
                  Does JavihAI answer interview questions in {l.name}?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                  Yes. Open Profile → AI Answer Style, enable Desi Mode, and set {l.name} ({l.native}) as
                  your answer language. JavihAI responds to live interview questions in {l.name} in real
                  time — popular with candidates interviewing from {l.hub}. Code and technical syntax
                  stay in English.
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center card bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
            <h2 className="text-3xl font-black mb-4">Interview In the Language You Think In</h2>
            <p className="text-slate-400 mb-6">Free plan available. No credit card. Desi Mode included on Pro &amp; Power.</p>
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
