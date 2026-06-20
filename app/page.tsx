'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
        text: 'Yes. Audio is processed in real-time and immediately discarded — we never store your interview audio. AI answers are generated on-demand and not saved to any server. Your interview content stays private.',
      },
    },
    {
      '@type': 'Question',
      name: 'What platforms does JavihAI support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JavihAI supports Windows 10, Windows 11, and macOS (both Apple Silicon M1/M2/M3 and Intel). The desktop app is required for real-time interview mode.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does JavihAI cost? Is there a free plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JavihAI has a permanent free plan — no time limit, no credit card. Pro is ₹499/month for unlimited AI answers. Power is ₹999/month with Desi Mode and priority AI. All paid plans include a 7-day money-back guarantee. JavihAI is 15× cheaper than Final Round AI.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Desi Mode in JavihAI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Desi Mode tailors every AI answer to the Indian job market — CTC in LPA, notice period norms, bond clauses, ESOP expectations, and Indian company context (FAANG India, startups, MNCs, IT services). Supports Hindi, Tamil, Telugu, Kannada, and more.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel my JavihAI subscription anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Cancel anytime with one click from your JavihAI dashboard. No long-term contracts, no cancellation fees, no questions asked.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does JavihAI work for coding rounds on HackerRank and LeetCode?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. JavihAI\'s Screenshot Solve feature reads the coding problem directly from your screen — whether it\'s on HackerRank, LeetCode, CodeSignal, HackerEarth, CoderPad, or any other platform. Press the hotkey, and JavihAI returns a step-by-step solution with time/space complexity in under 2 seconds. Supports Python, Java, C++, JavaScript, SQL, and more.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which coding topics does JavihAI cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JavihAI covers all major DSA and coding interview topics: Arrays, Strings, Linked Lists, Trees, Graphs, Dynamic Programming, Recursion, Backtracking, Sorting, Binary Search, Hashing, Stacks, Queues, Heaps, Tries, Bit Manipulation, Greedy Algorithms, Sliding Window, Two Pointers, SQL queries, OOP design, and System Design coding. It also handles time and space complexity analysis.',
      },
    },
  ],
};

const QUESTIONS = [
  '"Tell me about a time you improved system performance at scale."',
  '"Design a notification system for 10 million users."',
  '"Why do you want to leave your current company?"',
  '"What is your expected CTC? What is your notice period?"',
  '"Walk me through how you would build a URL shortener."',
];

interface PricingData {
  plans: { pro: { monthly: number; yearly: number }; power: { monthly: number; yearly: number } };
  offer: { active: boolean; label: string; percentOff: number; appliesTo: string; expiresAt: number | null };
}

function effectivePrice(base: number, offer: PricingData['offer'], plan: 'pro' | 'power'): number {
  if (!offer.active || offer.percentOff <= 0) return base;
  if (offer.expiresAt && Date.now() > offer.expiresAt) return base;
  if (offer.appliesTo !== 'all' && offer.appliesTo !== plan) return base;
  return Math.max(1, Math.round(base * (1 - offer.percentOff / 100)));
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [typedQ, setTypedQ] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [pricing, setPricing] = useState<PricingData>({
    plans: { pro: { monthly: 0, yearly: 0 }, power: { monthly: 0, yearly: 0 } },
    offer: { active: false, label: '', percentOff: 0, appliesTo: 'all', expiresAt: null },
  });

  useEffect(() => {
    fetch('/api/pricing').then(r => r.ok ? r.json() : null).then(d => d && setPricing(d)).catch(() => {});
  }, []);

  // Cycle through interview questions with typing animation
  useEffect(() => {
    const question = QUESTIONS[questionIdx];
    if (isTyping) {
      if (typedQ.length < question.length) {
        const t = setTimeout(() => setTypedQ(question.slice(0, typedQ.length + 1)), 28);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setIsTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      const t = setTimeout(() => {
        setTypedQ('');
        setQuestionIdx((i) => (i + 1) % QUESTIONS.length);
        setIsTyping(true);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [typedQ, isTyping, questionIdx]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] bg-pink-500/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '4s' }} />

        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-sm text-slate-300">🇮🇳 India&apos;s Cheapest AI Interview Copilot · ₹{effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}/mo · Trusted by 2,400+ candidates</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in-up leading-[1.05]" style={{ animationDelay: '0.1s' }}>
              Ace Every Interview —<br />
              <span className="text-gradient animate-gradient">AI Answers in 2 Seconds</span>
            </h1>

            <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              A stealth desktop overlay that listens to your interviewer, auto-detects every question,
              and streams structured AI answers — completely invisible to Zoom, Google Meet, and Teams.
            </p>
            <p className="text-base text-indigo-400 font-semibold mb-10 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              India&apos;s Cheapest — For Freshers &amp; Working Professionals. <span className="text-slate-400 font-normal">₹{effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}/mo vs ₹7,695/mo elsewhere.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/auth/signup" className="btn btn-primary btn-lg animate-pulse-glow text-base">
                Start Free — No Card Needed →
              </Link>
              <a href="#download" className="btn btn-secondary btn-lg text-base">
                ⬇ Download App
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {['100% invisible to screen share', 'Free for freshers', 'Windows & Mac', '7-day money-back'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span className="text-green-400">✓</span> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Live Demo Mockup */}
          <div className="mt-16 relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-3xl" />
              <div className="relative glass-heavy rounded-3xl p-2 border border-white/10">
                {/* Window chrome */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-950/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                      JavihAI · Live Session · Hidden from screen capture
                    </div>
                    <div className="text-xs text-slate-600">{process.env.NEXT_PUBLIC_APP_VERSION}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                    {/* Left: question panel */}
                    <div className="md:col-span-2 p-6 border-r border-white/5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-xs text-slate-400 font-medium">System Audio · Auto-detected question</span>
                      </div>
                      <div className="text-base font-semibold text-white leading-relaxed min-h-[72px]">
                        {typedQ}<span className="animate-pulse text-indigo-400">|</span>
                      </div>
                      <div className="mt-4 flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300">System Design</span>
                        <span className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-400">SDE-2 Round</span>
                      </div>
                    </div>

                    {/* Right: AI answer stream */}
                    <div className="md:col-span-3 p-6 bg-slate-950/30">
                      <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                        <span className="animate-pulse text-indigo-400 text-base">●</span>
                        <span className="font-medium text-slate-300">JavihAI answer</span>
                        <span className="ml-auto text-green-400">✓ 1.4s</span>
                      </div>
                      <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
                        <div><span className="text-indigo-400 font-bold">1. Load Balancer</span> — Route to regional clusters (Mumbai, Delhi, Hyderabad) to reduce latency for Indian users by 40%.</div>
                        <div><span className="text-indigo-400 font-bold">2. Pub/Sub Queue</span> — Kafka topics per notification type; consumers fan out to FCM (Android), APNs (iOS), SMS (Twilio).</div>
                        <div><span className="text-indigo-400 font-bold">3. Rate Limiting</span> — Token bucket per user to avoid spam. Global limit: 10M notifs/min during IPL or election surges.</div>
                        <div><span className="text-indigo-400 font-bold">4. Deduplication</span> — Redis set with 24h TTL to prevent duplicate sends on retry.</div>
                        <div className="text-slate-500 text-xs pt-1 flex items-center gap-2">
                          <span className="text-yellow-400">★</span> Tailored for Indian scale · invisible to interviewer
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-xs text-green-400 font-semibold backdrop-blur-sm">
                🥷 Invisible to Zoom
              </div>
              <div className="absolute -bottom-4 -left-4 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 font-semibold backdrop-blur-sm">
                ⚡ Answer in 1.4s
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPANIES BANNER ─────────────────────────────────────────────────── */}
      <section className="py-14 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-6 font-semibold">Our users have landed offers at</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Razorpay', 'CRED', 'Zepto', 'PhonePe', 'Meesho', 'Swiggy'].map((co) => (
              <span key={co} className="text-slate-500 font-semibold text-sm hover:text-slate-300 transition-smooth cursor-default">
                {co}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2,400+', label: 'Candidates Helped', sub: 'across India' },
              { value: '< 2s',   label: 'AI Response Time', sub: 'powered by Groq' },
              { value: '15×',    label: 'Cheaper', sub: 'vs Final Round AI' },
              { value: '10+',    label: 'Indian Languages', sub: 'incl. Hindi, Tamil, Telugu' },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-4xl md:text-5xl font-black text-gradient mb-1 group-hover:scale-105 transition-bounce inline-block">{stat.value}</div>
                <div className="text-slate-300 text-sm font-semibold">{stat.label}</div>
                <div className="text-slate-600 text-xs mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="badge mb-4">🎯 Who Is It For?</div>
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Built for Every Stage of Your Career
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Whether you&apos;re cracking your first job or switching to a senior role — JavihAI has a plan that fits your budget.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card border-green-500/20 bg-green-500/5 group hover:border-green-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🎓</div>
                <div>
                  <div className="font-bold text-white text-lg mb-1">Freshers &amp; Students</div>
                  <div className="text-slate-400 text-sm leading-relaxed mb-3">
                    Cracking your campus placement or first job? JavihAI&apos;s free plan gives you 3 AI-powered answers per day — no credit card needed. Practice mock interviews, get instant structured answers, and walk into every round confident.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Campus placements', 'First job hunt', 'Off-campus drives', 'Free forever'].map(t => (
                      <span key={t} className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="card border-indigo-500/20 bg-indigo-500/5 group hover:border-indigo-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💼</div>
                <div>
                  <div className="font-bold text-white text-lg mb-1">Working Professionals</div>
                  <div className="text-slate-400 text-sm leading-relaxed mb-3">
                    Targeting a promotion, switching companies, or aiming for FAANG? Pro at ₹{effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}/mo gives you unlimited answers. That&apos;s less than one lunch — while competitors charge ₹7,695/mo for the same.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Job switch', 'FAANG prep', 'Senior/Lead roles', `₹${effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}/mo only`].map(t => (
                      <span key={t} className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl glass border border-yellow-500/20 bg-yellow-500/5">
              <span className="text-yellow-400 text-xl">🏆</span>
              <span className="text-sm text-slate-300">
                <span className="text-white font-semibold">India&apos;s cheapest</span> AI interview tool — ₹{effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}/mo vs ₹1,199–₹7,695/mo from competitors.
                <span className="text-yellow-400 font-semibold"> You save ₹6,000–₹87,000/year.</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-950/40" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">🚀 3-Minute Setup</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Ready Before Your Next <span className="text-gradient">Interview</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">No complex setup. No coaching. Just install, sign in, and start.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-14 left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] h-px bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30" />

            {[
              {
                num: '01',
                icon: '📝',
                title: 'Create Free Account',
                desc: 'Sign up in 30 seconds — no credit card. Get 3 AI answers/day free, forever. No expiry.',
                color: 'from-blue-500 to-indigo-500',
              },
              {
                num: '02',
                icon: '⬇',
                title: 'Download Desktop App',
                desc: 'Install the 12 MB overlay for Windows 10/11 or macOS (M1/M2/M3 + Intel). Runs silently in background.',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                num: '03',
                icon: '🎯',
                title: 'Open in Your Interview',
                desc: 'Join Zoom/Meet/Teams as usual. JavihAI overlay is invisible. Questions are auto-detected. Answers stream in 2 seconds.',
                color: 'from-purple-500 to-pink-500',
              },
            ].map((step, i) => (
              <div key={i} className="text-center relative z-10">
                <div className={`inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} items-center justify-center text-4xl mb-5 shadow-lg`}>
                  {step.icon}
                </div>
                <div className="text-xs text-slate-600 font-bold tracking-widest mb-2">{step.num}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/signup" className="btn btn-primary btn-lg animate-pulse-glow">
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">✨ Features</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Every Tool You Need <span className="text-gradient">in One Overlay</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Eight AI-powered features for technical, HR, and system-design rounds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎧',
                title: 'System Audio Capture',
                desc: 'Hears the interviewer directly — no need to tap a mic. Works even when the interviewer is muted on your end or shares their screen.',
                gradient: 'from-blue-500 to-cyan-500',
                badge: 'Exclusive',
              },
              {
                icon: '⚡',
                title: 'Instant AI Answers',
                desc: 'Structured answers streamed word-by-word in under 2 seconds. Powered by Groq\'s LLaMA — the fastest AI inference on the planet.',
                gradient: 'from-indigo-500 to-purple-500',
                badge: null,
              },
              {
                icon: '🧠',
                title: 'Smart Question Detection',
                desc: 'Auto-detects when a real question is asked — ignores greetings, filler, and small talk. You only see answers that matter.',
                gradient: 'from-teal-500 to-emerald-500',
                badge: null,
              },
              {
                icon: '📸',
                title: 'Screen Capture & Solve',
                desc: 'Press a hotkey and JavihAI reads your screen — coding problems, system design diagrams, or HackerRank challenges. Explains step-by-step.',
                gradient: 'from-purple-500 to-pink-500',
                badge: null,
              },
              {
                icon: '🥷',
                title: 'Stealth Overlay',
                desc: 'OS-level exclusion from screen capture. Invisible on Zoom, Google Meet, Teams, and any other tool. The interviewer sees only your screen.',
                gradient: 'from-orange-500 to-red-500',
                badge: 'Undetectable',
              },
              {
                icon: '🎤',
                title: 'Live Caption Transcript',
                desc: 'See your own words transcribed in real-time as you speak. Review what you said, never miss a beat, and build confidence mid-answer.',
                gradient: 'from-green-500 to-emerald-500',
                badge: null,
              },
              {
                icon: '🔗',
                title: 'Job URL Auto-fill',
                desc: 'Paste a LinkedIn, Naukri, Indeed, or Glassdoor job link — JavihAI fetches the JD and fills your profile instantly. No copy-pasting walls of text.',
                gradient: 'from-sky-500 to-blue-500',
                badge: 'New',
              },
              {
                icon: '🎯',
                title: 'Detect Skills from JD',
                desc: 'After loading a job description, one click auto-selects the required tech stack — React, Python, AWS, Docker and 24 more. Answers are tailored instantly.',
                gradient: 'from-violet-500 to-purple-500',
                badge: 'New',
              },
            ].map((feature, i) => (
              <div key={i} className="card card-glow group relative overflow-hidden">
                {feature.badge && (
                  <div className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold">
                    {feature.badge}
                  </div>
                )}
                <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-bounce`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDIA SECTION ────────────────────────────────────────────────────── */}
      <section id="why" className="py-20 bg-slate-950/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              <div className="badge mb-6">🇮🇳 Made for India</div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                The Only AI Copilot That <span className="text-gradient">Understands Indian Interviews</span>
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Global tools give generic answers in USD. JavihAI knows Indian interview culture — CTC in LPA, notice period norms, ESOP vs variable pay, bond clauses, and company-specific context for FAANG India, unicorns, MNCs, and IT services.
              </p>

              <div className="space-y-4">
                {[
                  { icon: '💰', title: 'Salary in ₹ LPA', desc: 'Answers reference CTC, in-hand, variable pay in Indian terms — not USD or global ranges.' },
                  { icon: '📅', title: 'Notice period & bonds', desc: 'Handles the "3-month notice", "1-year bond", and "joining date" questions that trip up global tools.' },
                  { icon: '🏢', title: 'Company-type context', desc: 'FAANG India loop, Tier-1 startup, MNC GS/JPMorgan, or TCS/Infosys service round — each gets different answers.' },
                  { icon: '🗣️', title: '10+ Indian languages', desc: 'Answer in Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, and more. Code stays in English.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-lg flex-shrink-0">{item.icon}</div>
                    <div>
                      <div className="font-semibold text-white text-sm">{item.title}</div>
                      <div className="text-slate-400 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Desi Mode card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl blur-2xl" />
              <div className="relative glass-heavy rounded-3xl p-8 border border-orange-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xl">🇮🇳</div>
                  <div>
                    <div className="font-bold text-white">Desi Mode · Active</div>
                    <div className="text-xs text-orange-400">Power Plan Feature</div>
                  </div>
                  <div className="ml-auto w-10 h-5 rounded-full bg-orange-500 relative flex items-center px-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm ml-auto" />
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs mb-1.5 font-medium uppercase tracking-wide">Interviewer asks:</div>
                    <div className="text-slate-300 italic">&ldquo;What is your current CTC and what are your expectations?&rdquo;</div>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <div className="text-slate-500 text-xs mb-1.5 font-medium uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block animate-pulse" />
                      JavihAI · Desi Mode answer:
                    </div>
                    <div className="text-slate-300 leading-relaxed">
                      My current CTC is <span className="text-green-400 font-semibold">₹18 LPA</span> (₹14L fixed + ₹4L variable). I&apos;m targeting <span className="text-green-400 font-semibold">₹26–28 LPA</span> based on my 4 YOE in fintech and the scope here. I have a <span className="text-yellow-400">60-day notice period</span>, negotiable to 30 days with early resignation.
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded bg-orange-500/15 text-orange-300">₹ in LPA</span>
                    <span className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-400">Notice period</span>
                    <span className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-400">Indian norms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">⚖️ Compare</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              JavihAI vs <span className="text-gradient">Every Other Tool</span>
            </h2>
            <p className="text-slate-400">Same real-time AI help. 15× cheaper. Built for India.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60">
                  <th className="text-left px-5 py-4 text-slate-400 font-semibold w-44">Feature</th>
                  <th className="px-4 py-4 text-center">
                    <div className="text-white font-bold text-base">JavihAI</div>
                    <div className="text-indigo-400 text-xs font-semibold mt-0.5">₹{effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}/mo</div>
                  </th>
                  <th className="px-4 py-4 text-center">
                    <div className="text-slate-400 font-semibold">Final Round AI</div>
                    <div className="text-slate-600 text-xs mt-0.5">₹7,695/mo</div>
                  </th>
                  <th className="px-4 py-4 text-center">
                    <div className="text-slate-400 font-semibold">Cluely</div>
                    <div className="text-slate-600 text-xs mt-0.5">~₹2,400/mo</div>
                  </th>
                  <th className="px-4 py-4 text-center">
                    <div className="text-slate-400 font-semibold">OphyAI</div>
                    <div className="text-slate-600 text-xs mt-0.5">₹817/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Real-time AI answers',         '✅', '✅', '✅', '✅'],
                  ['Desktop app (true stealth)',    '✅', '⚠️ Web', '✅', '⚠️ Web'],
                  ['System audio capture',         '✅', '❌', '✅', '❌'],
                  ['Screen capture & solve',       '✅', '✅', '✅', '❌'],
                  ['Indian languages (10+)',       '✅', '❌', '❌', '⚠️ 2'],
                  ['Indian interview context',     '✅', '❌', '❌', '⚠️ Basic'],
                  ['₹ LPA salary & notice norms',  '✅', '❌', '❌', '❌'],
                  ['INR pricing (Razorpay)',        '✅', '❌', '❌', '❌'],
                  ['Free plan (no time limit)',     '✅', '❌', '❌', '⚠️ Trial'],
                  ['7-day money-back guarantee',   '✅', '❌', '❌', '❌'],
                  ['Mock interview with scoring',  '✅', '✅', '❌', '❌'],
                  ['Job URL auto-fill (JD fetch)', '✅', '❌', '❌', '❌'],
                  ['Detect skills from JD',        '✅', '❌', '❌', '❌'],
                ].map(([feature, ...vals], i) => (
                  <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-slate-900/20' : ''} hover:bg-slate-800/20 transition-smooth`}>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">{feature}</td>
                    {vals.map((v, j) => (
                      <td key={j} className={`px-4 py-3.5 text-center text-base ${j === 0 ? 'bg-indigo-500/5' : ''}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 justify-center mt-8 flex-wrap text-sm">
            <a href="/compare/final-round-ai" className="text-indigo-400 hover:text-indigo-300 underline">JavihAI vs Final Round AI →</a>
            <a href="/compare/chiku-ai" className="text-indigo-400 hover:text-indigo-300 underline">JavihAI vs Chiku AI →</a>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-950/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">💸 India&apos;s Cheapest Pricing</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Free for Freshers. <span className="text-gradient">₹{effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}/mo</span> for Pros.
            </h2>
            <p className="text-slate-400">Competitors charge ₹1,199–₹7,695/mo. We charge ₹{effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}. Start free — no card needed.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: '₹0',
                origPrice: null as string | null,
                period: 'forever',
                desc: 'Perfect for freshers & students.',
                features: ['3 AI answers / day', '5 voice minutes / day', '2 screenshot solves / day', '1 mock interview / day', 'Stealth overlay', 'Windows & Mac'],
                cta: 'Start Free',
                href: '/auth/signup',
                highlight: false,
              },
              {
                name: 'Pro',
                price: `₹${effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro')}`,
                origPrice: effectivePrice(pricing.plans.pro.monthly, pricing.offer, 'pro') !== pricing.plans.pro.monthly ? `₹${pricing.plans.pro.monthly}` : null,
                period: '/month',
                desc: 'For working professionals & job switchers.',
                features: ['Unlimited AI answers', '60 voice minutes / day', 'Unlimited screenshots', 'Unlimited mock interviews', 'Job URL auto-fill + skill detect', 'Priority support'],
                cta: 'Get Pro →',
                href: '/pricing',
                highlight: true,
              },
              {
                name: 'Power',
                price: `₹${effectivePrice(pricing.plans.power.monthly, pricing.offer, 'power')}`,
                origPrice: effectivePrice(pricing.plans.power.monthly, pricing.offer, 'power') !== pricing.plans.power.monthly ? `₹${pricing.plans.power.monthly}` : null,
                period: '/month',
                desc: 'FAANG prep & senior/lead role interviews.',
                features: ['Everything in Pro', 'Desi Mode (₹ LPA, Hinglish)', 'Unlimited voice', 'Priority Groq AI model', 'Company-type context', '7-day money-back'],
                cta: 'Get Power →',
                href: '/pricing',
                highlight: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`card relative ${plan.highlight ? 'border-indigo-500/40 bg-indigo-500/5' : ''}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-xs font-bold text-white shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-slate-400 text-sm font-semibold mb-1">{plan.name}</div>
                  <div className="flex items-end gap-1">
                    {plan.origPrice && (
                      <span className="text-slate-600 text-xl line-through mr-1">{plan.origPrice}</span>
                    )}
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                  </div>
                  {pricing.offer.active && plan.name !== 'Free' && pricing.offer.label && (
                    <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-semibold">
                      {pricing.offer.label}
                    </div>
                  )}
                  <p className="text-slate-500 text-xs mt-1">{plan.desc}</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`btn w-full justify-center text-sm ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            Prices in INR. Billed monthly or yearly. No hidden fees. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── CODING ROUNDS ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-950/40" id="coding-rounds">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">💻 Coding Rounds</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Crack Every Coding Round —<br />
              <span className="text-gradient">HackerRank, LeetCode & More</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              JavihAI&apos;s Screenshot Solve reads the coding problem on your screen and returns a clean, explained solution in under 2 seconds. Works on any platform, any language.
            </p>
          </div>

          {/* Platform grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: '🟢', name: 'HackerRank', detail: 'OA + interview rounds' },
              { icon: '🟠', name: 'LeetCode',   detail: 'Easy / Medium / Hard' },
              { icon: '🔵', name: 'CodeSignal',  detail: 'GCA & company tests' },
              { icon: '🟣', name: 'HackerEarth', detail: 'Campus drives & hackathons' },
              { icon: '⚫', name: 'Codeforces',  detail: 'Competitive programming' },
              { icon: '🟡', name: 'CoderPad',    detail: 'Live pair coding rounds' },
              { icon: '🔴', name: 'Coderbyte',   detail: 'Screening tests' },
              { icon: '🟤', name: 'AmcatCode',   detail: 'Mass campus hiring' },
            ].map((p) => (
              <div key={p.name} className="card py-4 text-center group hover:border-indigo-500/40 transition-colors">
                <div className="text-2xl mb-1">{p.icon}</div>
                <div className="font-bold text-white text-sm">{p.name}</div>
                <div className="text-slate-500 text-xs mt-0.5">{p.detail}</div>
              </div>
            ))}
          </div>

          {/* How it works for coding */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                step: '1',
                icon: '📸',
                title: 'Screenshot the Problem',
                desc: 'Press the hotkey while the coding problem is on screen. JavihAI captures it instantly — works on any browser or coding platform.',
              },
              {
                step: '2',
                icon: '🧠',
                title: 'AI Reads & Understands',
                desc: 'Groq-powered vision AI parses the problem statement, constraints, examples, and edge cases — even from images or PDFs.',
              },
              {
                step: '3',
                icon: '⚡',
                title: 'Get a Clean Solution in 2s',
                desc: 'Receive a step-by-step approach, time/space complexity analysis, and working code in Python, Java, C++, or JavaScript.',
              },
            ].map((s) => (
              <div key={s.step} className="card text-center">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-black text-white mx-auto mb-3">{s.step}</div>
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-bold text-white mb-2">{s.title}</div>
                <div className="text-slate-400 text-sm leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Language support */}
          <div className="card bg-indigo-500/5 border-indigo-500/20">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-4xl">🌐</div>
              <div className="flex-1">
                <div className="font-bold text-white text-lg mb-1">Supports All Major Programming Languages</div>
                <div className="text-slate-400 text-sm mb-3">JavihAI generates solutions in the language your round requires — no switching tools.</div>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'C#', 'Go', 'Kotlin', 'SQL', 'Bash'].map(lang => (
                    <span key={lang} className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">{lang}</span>
                  ))}
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-3xl font-black text-white">2s</div>
                <div className="text-slate-500 text-xs">avg. solution time</div>
              </div>
            </div>
          </div>

          {/* Topics covered */}
          <div className="mt-8">
            <div className="text-center text-slate-500 text-sm mb-4">Coding topics covered</div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Arrays & Strings', 'Linked Lists', 'Trees & Graphs', 'Dynamic Programming',
                'Recursion & Backtracking', 'Sorting & Searching', 'Hashing', 'Stacks & Queues',
                'Binary Search', 'Bit Manipulation', 'Greedy Algorithms', 'Sliding Window',
                'Two Pointers', 'Heaps & Priority Queues', 'Tries', 'System Design Coding',
                'SQL Queries', 'OOP Design', 'Time & Space Complexity', 'Regex Problems',
              ].map(topic => (
                <span key={topic} className="px-3 py-1 rounded-full glass text-slate-300 text-xs border border-slate-700/50">{topic}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section id="reviews" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">💬 Real Candidates</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              What Users <span className="text-gradient">Are Saying</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I had a system design round at a product startup. Switched to System Audio mode — JavihAI caught the question and gave me a clean architecture answer before I could even panic. Got the offer.",
                name: 'Arjun S.',
                role: 'SDE-2 · Bengaluru',
                company: 'Joined Razorpay',
                emoji: '🚀',
                stars: 5,
              },
              {
                quote: "The Desi Mode is underrated. It knows Indian salary ranges, notice period norms, bond clauses — things that global tools just blank out on. Feels like prep made for us.",
                name: 'Priya M.',
                role: 'Product Manager · Hyderabad',
                company: 'Joined CRED',
                emoji: '🇮🇳',
                stars: 5,
              },
              {
                quote: "I was skeptical about using an AI tool during a real interview but the stealth overlay is genuinely invisible. Walked into my FAANG loop with way more confidence than before.",
                name: 'Karthik R.',
                role: 'Senior Engineer · Chennai',
                company: 'Joined Google India',
                emoji: '🎯',
                stars: 5,
              },
              {
                quote: "Was paying ₹7,000/mo for Final Round AI. Switched to JavihAI at ₹499 and honestly the answers are better. The Indian context makes a huge difference in HR rounds.",
                name: 'Divya K.',
                role: 'ML Engineer · Pune',
                company: 'Joined Flipkart',
                emoji: '💸',
                stars: 5,
              },
              {
                quote: "Screenshot solve is insane. I had a LeetCode Hard problem in my HackerRank round, screenshotted it and got a clean solution with explanation in 2 seconds.",
                name: 'Rohit P.',
                role: 'SDE-1 · Bangalore',
                company: 'Joined Meesho',
                emoji: '💻',
                stars: 5,
              },
              {
                quote: "Setup took under 5 minutes. During my MNC interview, the system audio mode heard the interviewer perfectly and gave me structured STAR answers. No one suspected a thing.",
                name: 'Sneha G.',
                role: 'Business Analyst · Mumbai',
                company: 'Joined Accenture',
                emoji: '⭐',
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="card flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="text-2xl">{t.emoji}</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <span key={j} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed text-sm flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="border-t border-white/5 pt-3">
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                  <div className="text-xs text-green-400 mt-1 font-medium">{t.company}</div>
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
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '2400',
                bestRating: '5',
              },
            }),
          }}
        />
      </section>

      {/* ── DOWNLOAD ─────────────────────────────────────────────────────────── */}
      <section id="download" className="py-20 bg-slate-950/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="badge mb-4">⬇ Download</div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Get JavihAI <span className="text-gradient">for Your Platform</span>
          </h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto">
            Lightweight installer. No subscription required to download. Start with the free plan immediately after install.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="/api/download/win"
              className="btn btn-primary btn-lg flex items-center gap-3 text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
              Download for Windows
              <span className="text-xs opacity-70 font-normal">.exe · 64-bit</span>
            </a>
            <a
              href="/api/download/mac"
              className="btn btn-secondary btn-lg flex items-center gap-3 text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/></svg>
              Download for macOS
              <span className="text-xs opacity-70 font-normal">.dmg · Universal</span>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
            <span>✓ Windows 10/11 (64-bit)</span>
            <span>✓ macOS 12+ · Apple Silicon M1/M2/M3 + Intel</span>
            <span>✓ 12 MB download</span>
            <span>✓ No admin rights needed</span>
          </div>

          <div className="mt-8 glass rounded-2xl px-6 py-4 max-w-xl mx-auto text-sm text-slate-400">
            <strong className="text-slate-300">⚠ Security note:</strong> On Windows, click &ldquo;More info → Run anyway&rdquo;. On Mac, right-click → Open → Open. The app is safe — warnings appear because we&apos;re a new publisher.
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🔒', title: 'Audio never stored', desc: 'Processed in real-time, discarded immediately' },
              { icon: '🛡️', title: 'OS-level stealth', desc: 'Window excluded from all screen captures' },
              { icon: '💳', title: 'Razorpay payments', desc: 'Secure INR payments. No USD conversion.' },
              { icon: '↩️', title: '7-day refund', desc: 'No questions asked on paid plans' },
            ].map((t, i) => (
              <div key={i} className="text-center p-4">
                <div className="text-3xl mb-2">{t.icon}</div>
                <div className="text-white font-semibold text-sm mb-1">{t.title}</div>
                <div className="text-slate-500 text-xs">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 gradient-primary opacity-90" />
            <div className="absolute inset-0 bg-grid opacity-30" />
            <div className="relative p-12 md:p-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white/90 text-xs font-semibold mb-6">
                🇮🇳 Trusted by 2,400+ candidates across India
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Your Next Interview Is Waiting.
              </h2>
              <p className="text-xl text-white/85 mb-8 max-w-2xl mx-auto">
                Start free — no credit card, no time limit. Upgrade only when you&apos;re ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:scale-105 transition-bounce shadow-2xl">
                  Get Started Free →
                </Link>
                <a href="#download" className="inline-flex items-center gap-2 px-8 py-4 bg-white/15 border border-white/30 text-white font-semibold text-base rounded-xl hover:bg-white/25 transition-smooth">
                  ⬇ Download App
                </a>
              </div>
              <p className="text-white/60 text-sm mt-5">No card required · Cancel anytime · 7-day refund on paid plans</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">❓ FAQ</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-gradient">Common Questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does JavihAI work during a live interview?',
                a: 'Run JavihAI alongside your video call (Zoom, Google Meet, Teams). Choose System Audio to hear the interviewer, or Microphone mode. JavihAI auto-detects when a question is asked and streams a structured AI answer in under 2 seconds — while staying completely invisible to screen sharing.',
              },
              {
                q: 'Is JavihAI visible to the interviewer during screen share?',
                a: 'No. The JavihAI window uses OS-level exclusion from screen capture on both Windows and Mac. The interviewer sees only your screen — not the overlay. It has been tested on Zoom, Google Meet, Microsoft Teams, and Webex.',
              },
              {
                q: 'Is my interview audio stored or recorded anywhere?',
                a: 'Never. Audio is transcribed in real-time on your device and immediately discarded. AI answers are generated on-demand and not saved. JavihAI never stores your interview content.',
              },
              {
                q: 'What is System Audio mode? How is it different from Microphone mode?',
                a: 'System Audio mode captures what\'s playing through your speakers — so JavihAI hears the interviewer\'s voice directly, without a microphone. This means it works even if your mic is off or you\'re using headphones. Microphone mode captures your own voice for practice or when you want to dictate a question.',
              },
              {
                q: 'What is Desi Mode?',
                a: 'Desi Mode is a Power-plan feature that adapts every AI answer to Indian interview culture: CTC in ₹ LPA (not USD), notice period and bond clause context, ESOP vs variable pay, and company-specific framing for FAANG India, product startups, MNCs, and IT services. It also enables answers in Hindi, Tamil, Telugu, Kannada, and other Indian languages.',
              },
              {
                q: 'How do I install JavihAI? My computer shows a security warning.',
                a: 'On Windows: run the .exe — if you see "Windows protected your PC", click More info → Run anyway. On Mac: drag to Applications, then right-click → Open → Open (or System Settings → Privacy & Security → Open Anyway). This is normal for new publishers and the app is completely safe.',
              },
              {
                q: 'How much does JavihAI cost? Is there a free plan?',
                a: 'JavihAI has a permanent free plan with 3 AI answers per day — no credit card, no time limit. Pro is ₹499/month for unlimited answers. Power is ₹999/month with Desi Mode and unlimited everything. Both paid plans include a 7-day money-back guarantee. For comparison, Final Round AI costs ₹7,695/month — 15× more expensive.',
              },
              {
                q: 'Can I cancel my subscription anytime?',
                a: 'Yes. Cancel anytime from your dashboard — no long-term contracts, no cancellation fees, no questions asked. You keep access until the end of your billing period.',
              },
              {
                q: 'Does JavihAI work for coding rounds on HackerRank, LeetCode, and CodeSignal?',
                a: 'Yes. Use Screenshot Solve — press the hotkey while the coding problem is on screen. JavihAI reads the problem, understands constraints and examples, and returns a clean solution with step-by-step approach and time/space complexity in under 2 seconds. Works on HackerRank, LeetCode, CodeSignal, HackerEarth, CoderPad, Coderbyte, AmcatCode, and any other browser-based coding platform.',
              },
              {
                q: 'Which programming languages does JavihAI support for coding rounds?',
                a: 'JavihAI generates solutions in Python, Java, C++, JavaScript, TypeScript, C#, Go, Kotlin, SQL, and Bash. Just mention your preferred language in your profile or in the problem context.',
              },
              {
                q: 'What DSA topics can JavihAI solve?',
                a: 'JavihAI covers all major DSA topics: Arrays, Strings, Linked Lists, Trees, Graphs, Dynamic Programming, Recursion, Backtracking, Sorting, Binary Search, Hashing, Stacks, Queues, Heaps, Tries, Bit Manipulation, Greedy, Sliding Window, Two Pointers, SQL, OOP Design, and System Design coding questions.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="card cursor-pointer select-none"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-white">{item.q}</h3>
                  <div className={`w-7 h-7 rounded-full glass flex items-center justify-center transition-bounce flex-shrink-0 ${openFaq === i ? 'rotate-180 gradient-primary' : ''}`}>
                    <span className="text-white text-xs">▼</span>
                  </div>
                </div>
                {openFaq === i && (
                  <p className="text-slate-300 leading-relaxed mt-4 text-sm animate-fade-in-up">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL / COMMUNITY ───────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-950/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="badge mb-4">🌐 Community</div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Join the <span className="text-gradient">JavihAI Community</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-10">
            Daily interview tips, coding round solutions, salary negotiation advice, and real candidate success stories — follow us to stay ahead.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              {
                platform: 'Twitter / X',
                handle: '@Javih_ai',
                href: 'https://x.com/Javih_ai',
                icon: '𝕏',
                desc: 'Daily interview tips & hot takes',
                color: 'from-slate-800 to-slate-900',
                border: 'border-slate-700/50',
              },
              {
                platform: 'LinkedIn',
                handle: 'javih-ai',
                href: 'https://www.linkedin.com/in/javih-ai/',
                icon: '💼',
                desc: 'Career advice & success stories',
                color: 'from-blue-950 to-slate-900',
                border: 'border-blue-800/30',
              },
              {
                platform: 'Instagram',
                handle: '@javih.ai',
                href: 'https://www.instagram.com/javih.ai/',
                icon: '📸',
                desc: 'App demos & interview reels',
                color: 'from-pink-950 to-slate-900',
                border: 'border-pink-800/30',
              },
              {
                platform: 'YouTube',
                handle: '@javih_ai',
                href: 'https://www.youtube.com/@javih_ai',
                icon: '▶️',
                desc: 'Full interview prep tutorials',
                color: 'from-red-950 to-slate-900',
                border: 'border-red-800/30',
              },
            ].map((s) => (
              <a
                key={s.platform}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`card border ${s.border} bg-gradient-to-b ${s.color} hover:scale-105 transition-bounce text-center group no-underline`}
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-bold text-white text-sm mb-0.5">{s.platform}</div>
                <div className="text-slate-500 text-xs mb-2">{s.handle}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{s.desc}</div>
                <div className="mt-3 text-xs text-indigo-400 font-semibold group-hover:text-indigo-300">Follow →</div>
              </a>
            ))}
          </div>

          <p className="text-slate-600 text-sm">
            2,400+ candidates already part of the community · New content every day
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
