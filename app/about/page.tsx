import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JavihAI',
  url: 'https://javihai.in',
  logo: 'https://javihai.in/logo.svg',
  description:
    'Real-time AI interview copilot for India — stealth desktop overlay with instant AI answers, Desi Mode, and mock interviews.',
  foundingDate: '2024',
  areaServed: 'IN',
  sameAs: [
    'https://twitter.com/javihai',
    'https://www.linkedin.com/company/javihai',
    'https://github.com/smartjaganrao/ai-interview-helper',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@javihai.in',
    contactType: 'customer support',
    availableLanguage: ['English', 'Hindi', 'Tamil', 'Telugu'],
  },
};

export const metadata = {
  title: 'About JavihAI — India\'s First Unlimited AI Interview Copilot',
  description:
    'JavihAI is built by Indian engineers for Indian candidates. Learn why 2,400+ candidates trust JavihAI for Zoom, Meet & Teams interviews. Free forever plan available.',
  alternates: { canonical: 'https://javihai.in/about' },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">🏢 About Us</div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Built in India, <span className="text-gradient">for Indian Interviews</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              JavihAI is the first unlimited AI interview copilot designed specifically for the Indian job market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-black mb-6">Our Mission</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                Interview preparation in India is broken. Global tools give generic answers in USD, don&apos;t understand Indian interview culture, and charge ₹1,200–₹7,700/month.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                JavihAI was founded in 2024 to fix this. We built an AI copilot that understands CTC in LPA, notice periods, bond clauses, Desi Mode, and 10+ Indian languages — at a price Indian students and professionals can actually afford.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                Our team of engineers from IITs and top tech companies in Bangalore, Hyderabad, and Delhi NCR is obsessed with making interview success accessible to everyone — not just those who can afford expensive coaching.
              </p>
            </div>
            <div className="glass-heavy rounded-3xl p-8 border border-white/10">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎯</div>
                <div className="text-2xl font-black text-white mb-2">2,400+</div>
                <div className="text-slate-400">Candidates helped across India</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-black text-indigo-400">15×</div>
                  <div className="text-xs text-slate-400 mt-1">Cheaper than FR AI</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-black text-green-400">&lt;2s</div>
                  <div className="text-xs text-slate-400 mt-1">Answer speed</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-black text-purple-400">10+</div>
                  <div className="text-xs text-slate-400 mt-1">Indian languages</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-black text-pink-400">Free</div>
                  <div className="text-xs text-slate-400 mt-1">Forever plan</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-black mb-12 text-center">Why Candidates Trust JavihAI</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-white mb-3">Privacy First</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Audio is processed in real-time and immediately discarded. We never store interview content. Your answers are generated on-demand and not saved to any server.
                </p>
              </div>
              <div className="card text-center">
                <div className="text-4xl mb-4">🇮🇳</div>
                <h3 className="text-xl font-bold text-white mb-3">Made for India</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Answers in ₹ LPA, understands Indian company culture, supports Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, and more.
                </p>
              </div>
              <div className="card text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Powered by Groq&apos;s LLaMA — the fastest AI inference engine. Answers stream in under 2 seconds, so you never miss a beat.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-heavy rounded-3xl p-8 md:p-12 border border-white/10 mb-20">
            <h2 className="text-3xl font-black mb-8 text-center">Meet the Team</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl mx-auto mb-4">👨‍💻</div>
                <div className="font-bold text-white text-lg">Jagan Rao</div>
                <div className="text-indigo-400 text-sm mb-2">Founder & CEO</div>
                <p className="text-slate-400 text-xs leading-relaxed">Ex-IITian. Built interview tools used by 2,400+ candidates. Passionate about making interview success accessible.</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl mx-auto mb-4">👩‍💻</div>
                <div className="font-bold text-white text-lg">Priya Sharma</div>
                <div className="text-blue-400 text-sm mb-2">Head of AI</div>
                <p className="text-slate-400 text-xs leading-relaxed">ML engineer from IISc Bangalore. Specializes in real-time speech processing and low-latency inference.</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-3xl mx-auto mb-4">👨‍💻</div>
                <div className="font-bold text-white text-lg">Rahul Verma</div>
                <div className="text-orange-400 text-sm mb-2">Head of Product</div>
                <p className="text-slate-400 text-xs leading-relaxed">Former product manager at Flipkart. Deep understanding of Indian job market and candidate pain points.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-black mb-6">Ready to Ace Your Next Interview?</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Join 2,400+ candidates who&apos;ve already transformed their interview game with JavihAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="btn btn-primary btn-lg">
                Get Started Free →
              </Link>
              <Link href="/pricing" className="btn btn-secondary btn-lg">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
