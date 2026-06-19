'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does JavihAI — the AI interview assistant — work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JavihAI is a lightweight desktop overlay for Windows and Mac. You run it alongside your video call (Zoom, Google Meet, Teams). It listens via your microphone or captures system audio, auto-detects interview questions using AI, and streams a structured answer in under 2 seconds. It works for technical rounds, system design, HR interviews, and coding questions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is JavihAI visible during screen share or video call?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The JavihAI window is excluded from all screen captures using OS-level APIs — it is completely invisible on Zoom, Google Meet, Microsoft Teams, and any other screen-sharing tool. The interviewer sees only your screen, not the overlay.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my interview data private and secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Audio is sent to Groq Whisper for real-time transcription and immediately discarded — we never store your interview audio. AI answers are generated on-demand and not saved to any server. Your interview content stays private.',
      },
    },
    {
      '@type': 'Question',
      name: 'What platforms does JavihAI support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JavihAI supports Windows 10, Windows 11, and macOS (both Apple Silicon M1/M2/M3 and Intel). A Linux version is on the roadmap. The desktop app is required for real-time interview mode.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does JavihAI cost? Is there a free plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JavihAI has a permanent free plan with 10 AI answers per day — no time limit, no credit card. Pro is ₹499/month for unlimited answers. Power is ₹999/month with priority AI models. All paid plans include a 7-day money-back guarantee. JavihAI is 15× cheaper than Final Round AI (₹7,695/month) and 7× cheaper than Chiku AI (₹3,499/month).',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Desi Mode in JavihAI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Desi Mode is a unique JavihAI feature that tailors every AI answer to the Indian job market. It uses CTC in LPA, understands notice period norms, bond clauses, ESOP expectations, and frames answers for Indian company types — FAANG India, product startups, MNCs, and IT services companies. It also supports Hindi, Tamil, Telugu, Kannada, and other Indian languages.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is JavihAI cheaper than Final Round AI and Chiku AI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. JavihAI Pro is ₹499/month vs Final Round AI at ₹7,695/month (15× cheaper) and Chiku AI at ₹3,499/month (7× cheaper). JavihAI offers the same real-time invisible overlay at a fraction of the price, with a free plan that has no time limit.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel my JavihAI subscription anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Cancel anytime with one click from your JavihAI dashboard. No long-term contracts, no cancellation fees, no questions asked. You keep access until the end of your billing period.',
      },
    },
  ],
};

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-slate-300">🎉 Trusted by 2,400+ candidates across India</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              India&apos;s AI Interview Copilot —
              <br />
              <span className="text-gradient animate-gradient">Answers in Under 2 Seconds</span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              JavihAI is a stealth desktop overlay for Windows &amp; Mac that listens to your interview,
              auto-detects questions, and generates structured AI answers in under 2 seconds —
              completely invisible to screen recording and Zoom.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/auth/signup" className="btn btn-primary btn-lg animate-pulse-glow">
                Get Started Free →
              </Link>
              <a href="#features" className="btn btn-secondary btn-lg">
                See How It Works ↓
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2"><span className="text-green-400">✓</span> No credit card required</div>
              <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Free plan, no time limit</div>
              <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Windows &amp; Mac</div>
            </div>
          </div>

          {/* Hero Mockup */}
          <div className="mt-20 relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 gradient-primary opacity-30 blur-3xl rounded-3xl"></div>
              <div className="relative glass-heavy rounded-3xl p-2 border border-white/10">
                <div className="bg-slate-900 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-slate-500 ml-2">JavihAI • Live Session</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                    <div className="space-y-3">
                      <div className="badge">🎧 System Audio · Auto-detected</div>
                      <div className="text-lg font-semibold text-white">
                        &ldquo;Design a URL shortener like bit.ly at scale.&rdquo;
                      </div>
                      <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
                        Listening · hidden from screen capture
                      </div>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                        <span className="animate-pulse text-indigo-400">●</span> JavihAI · answering…
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed space-y-1.5">
                        <div><span className="text-indigo-400 font-semibold">1.</span> Use a hash function (MD5 / base62) to generate a 7-char short code.</div>
                        <div><span className="text-indigo-400 font-semibold">2.</span> Store mappings in Redis (hot) + Cassandra (cold) for scale.</div>
                        <div><span className="text-indigo-400 font-semibold">3.</span> Add a CDN layer — 301 redirect, ~1ms latency globally.</div>
                        <div className="text-slate-500 text-xs mt-2">↑ Full answer with trade-offs generated in 1.4s</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2,400+', label: 'Candidates Helped' },
              { value: '< 2s', label: 'Avg. AI Response Time' },
              { value: '15×', label: 'Cheaper than Competitors' },
              { value: '10+', label: 'Indian Languages' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-gradient mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">✨ Features</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Real-Time AI Interview Tools <span className="text-gradient">That Actually Work</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Six AI-powered features built for technical, HR, and system-design rounds — FAANG, startups, and MNCs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '💬', title: 'Live Captions', desc: 'Your words appear on screen within about a second as you speak, then snap to a clean, accurate transcript when you pause — so you always know it heard you right.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: '🧠', title: 'Instant AI Answers', desc: 'Speak a question and get a structured, model answer in seconds, powered by the latest LLMs — never blank out on a question again.', gradient: 'from-indigo-500 to-purple-500' },
              { icon: '🎧', title: 'Smart Question Detection', desc: 'Listening to the interviewer? JavihAI auto-detects the actual questions and answers them, while ignoring greetings and small talk.', gradient: 'from-teal-500 to-emerald-500' },
              { icon: '📸', title: 'Screen Capture & Analysis', desc: 'Share a coding problem or diagram and AI reads what is on your screen, then explains the solution step by step.', gradient: 'from-purple-500 to-pink-500' },
              { icon: '🥷', title: 'Stealth Overlay', desc: 'A frameless, always-on-top window that stays hidden from screen captures — keep it open beside your notes without it showing in recordings.', gradient: 'from-orange-500 to-red-500' },
              { icon: '🔒', title: 'Private & Secure', desc: 'Excluded from all screen captures. Audio is processed in real-time and never recorded. No interview content is stored on our servers.', gradient: 'from-green-500 to-emerald-500' },
            ].map((feature, i) => (
              <div key={i} className="card card-glow group">
                <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-bounce`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">🚀 Getting Started</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              How JavihAI Works — <span className="text-gradient">Ready in 3 Minutes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 gradient-primary opacity-30"></div>

            {[
              { num: '01', title: 'Create a Free Account', desc: 'Sign up in 30 seconds. No credit card required. 10 AI answers/day free, forever.' },
              { num: '02', title: 'Download JavihAI Desktop App', desc: 'Install the lightweight overlay app for Windows 10/11 or macOS (Apple Silicon & Intel).' },
              { num: '03', title: 'Ace Your Next Interview', desc: 'Start a live session — JavihAI detects questions and streams AI answers in real time.' },
            ].map((step, i) => (
              <div key={i} className="text-center relative z-10">
                <div className="inline-flex w-24 h-24 rounded-full gradient-primary items-center justify-center text-3xl font-black text-white mb-6 animate-pulse-glow">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF COUNTER */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="card bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '2,400+', label: 'Candidates Helped' },
                { value: '15×',    label: 'Cheaper than Final Round AI' },
                { value: '10+',    label: 'Indian Languages' },
                { value: '7-day',  label: 'Money-Back Guarantee' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY JAVIHAI — built for Indian interviews */}
      <section id="why" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">✨ Why JavihAI</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Built for <span className="text-gradient">Indian Interviews</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From FAANG loops to product startups and MNC interviews — AI interview prep designed for India, priced for India.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🇮🇳', title: 'Desi Mode', text: 'Answers in natural Indian English — plus Hindi, Tamil, Telugu and more — with Indian company context, not textbook phrasing.' },
              { icon: '💸', title: '15× more affordable', text: 'Real-time interview help for ₹499/month, versus ₹7,000+ for Final Round AI. Same capability, India pricing.' },
              { icon: '🎯', title: 'Mock interviews', text: 'An AI interviewer asks role-specific questions, then scores your answers so you know exactly what to fix.' },
              { icon: '🖥️', title: 'Screenshot analysis', text: 'Point it at a coding or system-design problem on screen and get a structured, worked-through solution.' },
              { icon: '📄', title: 'Resume builder', text: 'Five ATS-ready templates with India-specific tips. Build and export to PDF in minutes.' },
              { icon: '🔒', title: 'Private by design', text: 'Runs on your own device. We never record or store your live interview audio.' },
            ].map((f, i) => (
              <div key={i} className="card">
                <div className="text-4xl mb-3">{f.icon}</div>
                <div className="font-bold text-white mb-2">{f.title}</div>
                <p className="text-slate-300 leading-relaxed text-sm">{f.text}</p>
              </div>
            ))}
          </div>

          {/* Compare links */}
          <div className="text-center mt-10">
            <p className="text-slate-500 text-sm mb-3">Switching from another tool?</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="/compare/chiku-ai" className="text-indigo-400 hover:text-indigo-300 text-sm underline">JavihAI vs Chiku AI →</a>
              <a href="/compare/final-round-ai" className="text-indigo-400 hover:text-indigo-300 text-sm underline">JavihAI vs Final Round AI →</a>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">💬 Real Users</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              JavihAI Reviews — What Candidates <span className="text-gradient">Are Saying</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I had a system design round at a product startup. Switched to System Audio mode — JavihAI caught the question and gave me a clean architecture answer before I could even panic. Got the offer.",
                name: 'Arjun S.',
                role: 'SDE-2 · Bengaluru',
                emoji: '🚀',
              },
              {
                quote: "The Desi Mode is underrated. It knows Indian salary ranges, notice period norms, bond clauses — things that global tools just blank out on. Feels like prep made for us.",
                name: 'Priya M.',
                role: 'Product Manager · Hyderabad',
                emoji: '🇮🇳',
              },
              {
                quote: "I was skeptical about using an AI tool during a real interview but the stealth overlay is genuinely invisible. Walked into my FAANG loop with way more confidence than before.",
                name: 'Karthik R.',
                role: 'Senior Engineer · Chennai',
                emoji: '🎯',
              },
            ].map((t, i) => (
              <div key={i} className="card flex flex-col gap-4">
                <div className="text-3xl">{t.emoji}</div>
                <p className="text-slate-300 leading-relaxed text-sm flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: 'JavihAI',
              url: 'https://javihai.in',
              review: [
                {
                  '@type': 'Review',
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  author: { '@type': 'Person', name: 'Arjun S.' },
                  reviewBody: 'I had a system design round at a product startup. Switched to System Audio mode — JavihAI caught the question and gave me a clean architecture answer before I could even panic. Got the offer.',
                },
                {
                  '@type': 'Review',
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  author: { '@type': 'Person', name: 'Priya M.' },
                  reviewBody: 'The Desi Mode is underrated. It knows Indian salary ranges, notice period norms, bond clauses — things that global tools just blank out on. Feels like prep made for us.',
                },
                {
                  '@type': 'Review',
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  author: { '@type': 'Person', name: 'Karthik R.' },
                  reviewBody: 'I was skeptical about using an AI tool during a real interview but the stealth overlay is genuinely invisible. Walked into my FAANG loop with way more confidence than before.',
                },
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '2400',
                bestRating: '5',
              },
            }),
          }}
        />
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 gradient-primary opacity-90"></div>
            <div className="absolute inset-0 bg-grid opacity-30"></div>
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Ready to Land Your Dream Job?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join 2,400+ candidates who&apos;ve used JavihAI to prepare and perform in real interviews
              </p>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:scale-105 transition-bounce shadow-2xl">
                Get Started Free →
              </Link>
              <p className="text-white/80 text-sm mt-4">No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">❓ FAQ</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              JavihAI FAQ — <span className="text-gradient">Everything You Need to Know</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does JavihAI — the AI interview assistant — work?',
                a: 'JavihAI is a lightweight desktop overlay for Windows and Mac. You run it alongside your video call (Zoom, Google Meet, Teams). It listens via your microphone or captures system audio, auto-detects interview questions using AI, and streams a structured answer in under 2 seconds. It works for technical rounds, system design, HR interviews, and coding questions.',
              },
              {
                q: 'Is JavihAI visible during screen share or video call?',
                a: 'No. The JavihAI window is excluded from all screen captures using OS-level APIs — it is completely invisible on Zoom, Google Meet, Microsoft Teams, and any other screen-sharing tool. The interviewer sees only your screen, not the overlay.',
              },
              {
                q: 'Is my interview data private and secure?',
                a: 'Yes. Audio is sent to Groq Whisper for real-time transcription and immediately discarded — we never store your interview audio. AI answers are generated on-demand and not saved to any server. Your interview content stays private.',
              },
              {
                q: 'What platforms does JavihAI support?',
                a: 'JavihAI supports Windows 10, Windows 11, and macOS (both Apple Silicon M1/M2/M3 and Intel). A Linux version is on the roadmap. The desktop app is required for real-time interview mode.',
              },
              {
                q: 'How do I install JavihAI? My computer shows a security warning.',
                a: 'Installation takes about 2 minutes. On Windows: run the .exe — if you see "Windows protected your PC", click More info → Run anyway. On Mac: drag to Applications, then right-click → Open → Open (or go to System Settings → Privacy & Security → Open Anyway). The warning appears because the app is not yet code-signed, but it is completely safe. Full instructions appear on your dashboard after signing in.',
              },
              {
                q: 'How much does JavihAI cost? Is there a free plan?',
                a: 'JavihAI has a permanent free plan with 10 AI answers per day — no time limit, no credit card. Pro is ₹499/month for unlimited answers. Power is ₹999/month with priority AI models. All paid plans include a 7-day money-back guarantee. JavihAI is 15× cheaper than Final Round AI (₹7,695/month) and 7× cheaper than Chiku AI (₹3,499/month).',
              },
              {
                q: 'What is Desi Mode in JavihAI?',
                a: 'Desi Mode is a unique JavihAI feature that tailors every AI answer to the Indian job market. It uses CTC in LPA (not USD), understands notice period norms, bond clauses, ESOP expectations, and frames answers for Indian company types — FAANG India, product startups, MNCs, and IT services companies. It also supports answering in Hindi, Tamil, Telugu, Kannada, and other Indian languages. Enable it in My Profile inside the app.',
              },
              {
                q: 'Can I cancel my JavihAI subscription anytime?',
                a: 'Yes. Cancel anytime with one click from your JavihAI dashboard. There are no long-term contracts, no cancellation fees, and no questions asked. You keep access until the end of your billing period.',
              },
            ].map((item, i) => (
              <div key={i} className="card cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="w-full text-left flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white pr-4">{item.q}</h3>
                  <div className={`w-8 h-8 rounded-full glass flex items-center justify-center transition-bounce flex-shrink-0 ${
                    openFaq === i ? 'rotate-180 gradient-primary' : ''
                  }`}>
                    <span className="text-white text-xs">▼</span>
                  </div>
                </div>
                {openFaq === i && (
                  <p className="text-slate-300 leading-relaxed mt-4 animate-fade-in-up">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
