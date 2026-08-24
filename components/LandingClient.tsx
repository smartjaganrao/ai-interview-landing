'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import FreeTrialModal from '@/components/FreeTrialModal';
import DownloadStepsModal from '@/components/DownloadStepsModal';

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
      name: 'Are there other precautions to take before starting an interview with JavihAI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — a couple of simple ones. JavihAI itself is invisible during screen shares, but other running apps (password managers, chat clients, other overlays) can still show icons in your menu bar or taskbar. Check it before you start and hide anything unnecessary — on Mac, System Settings → Control Center → Menu Bar lets you toggle individual app icons off. Also close apps that might trigger notification popups during the call.',
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
        text: 'JavihAI has a permanent free plan — no time limit, no credit card. Paid plans unlock unlimited AI answers, Desi Mode, and priority support. All paid plans include a 7-day money-back guarantee. JavihAI is 15× cheaper than Final Round AI.',
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

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to use JavihAI for interview prep',
  description: 'Get started with JavihAI in 3 steps: create a free account, download the desktop app, and start getting AI answers in your interviews.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Create Free Account',
      text: 'Sign up in 30 seconds with Google — no credit card required. Get 10 AI answers/day free, forever.',
    },
    {
      '@type': 'HowToStep',
      name: 'Download Desktop App',
      text: 'Install the free desktop overlay for Windows 10/11 or macOS (Apple Silicon or Intel). Runs silently in background.',
    },
    {
      '@type': 'HowToStep',
      name: 'Open in Your Interview',
      text: 'Join Zoom/Meet/Teams as usual. JavihAI overlay is invisible. Questions are auto-detected. Answers stream in 2 seconds.',
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
  plans: {
    free: { oneTime: number };
    quick_pass: { oneTime: number };
    pro: { oneTime: number };
    power: { monthly: number; yearly: number };
  };
  offer: { active: boolean; label: string; percentOff: number; appliesTo: string; expiresAt: number | null };
}

function effectivePrice(base: number, offer: PricingData['offer'], plan: 'pro' | 'power'): number {
  if (!offer.active || offer.percentOff <= 0) return base;
  if (offer.expiresAt && Date.now() > offer.expiresAt) return base;
  if (offer.appliesTo !== 'all' && offer.appliesTo !== plan) return base;
  return Math.max(1, Math.round(base * (1 - offer.percentOff / 100)));
}

interface LandingClientProps {
  initialPricing: PricingData;
}

function userCardClasses(color: string) {
  return color === 'purple'
    ? 'p-4 rounded-xl bg-purple-500/8 border border-purple-500/15 hover:border-purple-500/25 transition-smooth'
    : 'p-4 rounded-xl bg-blue-500/8 border border-blue-500/15 hover:border-blue-500/25 transition-smooth';
}

function userTitleClasses(color: string) {
  return color === 'purple'
    ? 'font-semibold text-purple-400 text-sm mb-0.5'
    : 'font-semibold text-blue-400 text-sm mb-0.5';
}

const GRADIENT_CLASSES: Record<string, string> = {
  'from-blue-500 to-indigo-500': 'bg-gradient-to-br from-blue-500 to-indigo-500',
  'from-indigo-500 to-purple-500': 'bg-gradient-to-br from-indigo-500 to-purple-500',
  'from-purple-500 to-blue-500': 'bg-gradient-to-br from-purple-500 to-blue-500',
  'from-blue-500 to-purple-500': 'bg-gradient-to-br from-blue-500 to-purple-500',
  'from-orange-500 to-red-500': 'bg-gradient-to-br from-orange-500 to-red-500',
  'from-blue-500 to-green-500': 'bg-gradient-to-br from-blue-500 to-green-500',
  'from-sky-500 to-blue-500': 'bg-gradient-to-br from-sky-500 to-blue-500',
  'from-violet-500 to-purple-500': 'bg-gradient-to-br from-violet-500 to-purple-500',
  'from-slate-800 to-slate-900': 'bg-gradient-to-b from-slate-800 to-slate-900',
  'from-blue-950 to-slate-900': 'bg-gradient-to-b from-blue-950 to-slate-900',
  'from-pink-950 to-slate-900': 'bg-gradient-to-b from-pink-950 to-slate-900',
  'from-red-950 to-slate-900': 'bg-gradient-to-b from-red-950 to-slate-900',
  'from-green-950 to-slate-900': 'bg-gradient-to-b from-green-950 to-slate-900',
};

// Highlights the visitor's own OS as the primary download button instead of
// making them pick between two equal-weight buttons. Arch (arm64 vs x64)
// can't be reliably detected from the UA string on modern browsers, so Mac
// always defaults to arm64 with a manual x64 link alongside it.
function detectDesktopOS(): 'mac' | 'windows' | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) return 'mac';
  return null;
}

export default function LandingClient(props: LandingClientProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [typedQ, setTypedQ] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [pricing] = useState<PricingData>(props.initialPricing);
  const [appVersion, setAppVersion] = useState('');
  const [isNewRelease, setIsNewRelease] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadModalOS, setDownloadModalOS] = useState<'windows' | 'mac'>('windows');

  const openDownloadModal = (os: 'windows' | 'mac') => {
    setDownloadModalOS(os);
    setShowDownloadModal(true);
  };
  const [detectedOS, setDetectedOS] = useState<'mac' | 'windows' | null>(null);

  useEffect(() => {
    setDetectedOS(detectDesktopOS());

    fetch('/api/release').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.version) setAppVersion(d.version);
      if (d?.publishedAt) setIsNewRelease(Date.now() - new Date(d.publishedAt).getTime() < 14 * 86400000);
    }).catch(() => {});

    if (localStorage.getItem('trialModalDismissed')) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10) setIsTrialModalOpen(true);
    };

    const timer = setTimeout(() => {
      setIsTrialModalOpen(true);
    }, 8000);

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Ambient orbs */}
        <div className="glow-orb animate-orb-drift w-[500px] h-[500px] -top-40 -left-40" />
        <div className="glow-orb animate-orb-drift w-[400px] h-[400px] top-20 -right-20" style={{ animationDelay: '4s' }} />
        <div className="glow-orb animate-orb-drift w-[300px] h-[300px] bottom-0 left-1/3" style={{ animationDelay: '8s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Badge */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="badge-glow inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span>India&apos;s First Unlimited AI Interview Copilot</span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 text-center animate-fade-in-up leading-[0.95]" style={{ animationDelay: '0.1s' }}>
            The AI Only
            <br className="hidden sm:block" />
            <span className="text-gradient animate-gradient"> You Can See</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-xl md:text-2xl text-white font-bold mb-3 text-center max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            Invisible AI overlay for Zoom, Meet &amp; Teams.
            <br className="hidden md:block" />
            Hears questions. Streams answers in &lt;2s.
          </p>

          <p className="text-base sm:text-lg text-slate-400 mb-8 md:mb-10 text-center max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Free forever for freshers. 15× cheaper than Final Round AI. Works on Windows 10/11 and Mac.
          </p>

          {/* Primary CTAs */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-4">
              <a
                href="/api/download/win"
                target="_blank"
                rel="noopener"
                onClick={() => openDownloadModal('windows')}
                className={`btn btn-xl w-full sm:w-auto ${detectedOS === 'mac' ? 'btn-secondary' : 'btn-primary shadow-lg hover:shadow-blue-500/25'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                Download for Windows — Free
              </a>
              <a
                href="/api/download/mac"
                target="_blank"
                rel="noopener"
                onClick={() => openDownloadModal('mac')}
                className={`btn btn-xl w-full sm:w-auto ${detectedOS === 'mac' ? 'btn-primary shadow-lg hover:shadow-blue-500/25' : 'btn-secondary'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/></svg>
                Download for Mac — Free
              </a>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 text-center mb-1.5">
              Free forever for freshers · No card needed · 2-minute setup
            </p>
            <p className="text-xs text-slate-600 text-center">
              Intel Mac? <a href="/api/download/mac?arch=x64" target="_blank" rel="noopener" onClick={() => openDownloadModal('mac')} className="text-slate-500 hover:text-slate-300 underline underline-offset-2">Get the x64 build</a>
              {' '}&middot; Prefer a written guide? <Link href="/install" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">Read the install steps →</Link>
            </p>
          </div>

          {/* What happens after you click — the security-prompt moment is the
              #1 reason a first-time visitor abandons an unsigned-app install,
              so pre-empt it here instead of letting it surprise them. */}
          <div className="max-w-3xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
              {[
                { n: '1', text: 'Download starts instantly — no sign-up needed first.' },
                { n: '2', text: 'Windows or Mac shows a one-time security prompt. Click "Run anyway" or "Open" — expected for a brand-new app, not a threat.' },
                { n: '3', text: 'Sign in with Google inside the app and start practicing.' },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-2.5 text-left">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 flex items-center justify-center mt-0.5">
                    {step.n}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Account CTA — secondary to Download, for visitors who'd rather
              start with an account (or already have one) than download first. */}
          <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <div className="inline-flex items-center gap-1 p-1 rounded-full glass border border-white/10">
              <Link
                href="/auth/signup"
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                ✨ Create free account
              </Link>
              <Link
                href="/auth/login"
                className="px-5 py-2 rounded-full text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Live demo mockup */}
          <div className="mt-12 md:mt-16 relative animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 gradient-primary opacity-10 blur-3xl rounded-3xl" />
              <div className="relative glass-heavy rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 border border-blue-500/15">
                {/* Window chrome */}
                <div className="bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/5 bg-slate-950/80">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500/80" />
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                      JavihAI · Live Session · Hidden from screen capture
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-600">
                      <span>{appVersion}</span>
                      {isNewRelease && (
                        <span className="ml-1.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                    {/* Left: question panel */}
                    <div className="md:col-span-2 p-4 sm:p-6 border-r border-white/5">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium">System Audio · Auto-detected question</span>
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-white leading-relaxed min-h-[60px] sm:min-h-[72px]">
                        {typedQ}<span className="animate-pulse text-blue-400">|</span>
                      </div>
                      <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-blue-500/15 text-blue-300">System Design</span>
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-slate-700/50 text-slate-400">SDE-2 Round</span>
                      </div>
                    </div>

                    {/* Right: AI answer stream */}
                    <div className="md:col-span-3 p-4 sm:p-6 bg-slate-950/50">
                      <div className="text-[10px] sm:text-xs text-slate-400 mb-2 sm:mb-3 flex items-center gap-2">
                        <span className="animate-pulse text-blue-400 text-base">●</span>
                        <span className="font-medium text-slate-300">JavihAI answer</span>
                        <span className="ml-auto text-blue-400">✓ 1.4s</span>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        <div><span className="text-blue-400 font-bold">1. Load Balancer</span> — Route to regional clusters (Mumbai, Delhi, Hyderabad) to reduce latency for Indian users by 40%.</div>
                        <div><span className="text-blue-400 font-bold">2. Pub/Sub Queue</span> — Kafka topics per notification type; consumers fan out to FCM (Android), APNs (iOS), SMS (Twilio).</div>
                        <div><span className="text-blue-400 font-bold">3. Rate Limiting</span> — Token bucket per user to avoid spam. Global limit: 10M notifs/min during IPL or election surges.</div>
                        <div><span className="text-blue-400 font-bold">4. Deduplication</span> — Redis set with 24h TTL to prevent duplicate sends on retry.</div>
                        <div className="text-slate-500 text-[10px] sm:text-xs pt-1 flex items-center gap-2">
                          <span className="text-yellow-400">★</span>{' '}Tailored for Indian scale · invisible to interviewer
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 hidden md:flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full glass text-[10px] sm:text-xs text-blue-400 font-semibold border border-blue-500/20">
                🥷 Invisible to Zoom
              </div>
              <div className="absolute -bottom-3 sm:-bottom-4 -left-3 sm:-left-4 hidden md:flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full glass text-[10px] sm:text-xs text-purple-400 font-semibold border border-purple-500/20">
                ⚡ Answer in 1.4s
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TRUST BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 -mt-8 mb-12 md:mb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-blue-500/10">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-8">
              {[
                { num: '2,400+', label: 'Candidates Helped' },
                { num: '<2s', label: 'AI Answer Speed' },
                { num: '15×', label: 'Cheaper than FR AI' },
                { num: '100%', label: 'Invisible on Screen' },
                { num: '10+', label: 'Indian Languages' },
                { num: '4.9★', label: 'Early Rating' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="stat-number mb-1">{stat.num}</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          WHAT IS JAVIHĀI
      ═══════════════════════════════════════════════════════════════ */}
      <section className="section-py relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Text */}
            <div>
              <div className="section-label">🎯 What is JavihAI</div>
              <h2 className="section-heading mb-6">
                Your Secret Weapon for <span className="text-gradient">Every Interview</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                JavihAI is an AI-powered interview assistant that sits invisibly on your computer and helps you ace every interview — whether it&apos;s on Zoom, Google Meet, Microsoft Teams, or any other platform.
              </p>

              <div className="space-y-5">
                {[
                  { icon: '🎧', title: 'Listens & Understands', desc: 'Hears your interviewer directly via system audio and auto-detects when real questions are being asked.' },
                  { icon: '⚡', title: 'Instant Answers', desc: 'Generates structured, conversational answers in under 2 seconds using the world\'s fastest AI.' },
                  { icon: '🥷', title: '100% Invisible', desc: 'The interviewer never sees it. Window is excluded from screen capture at the OS level.' },
                  { icon: '🇮🇳', title: 'Built for India', desc: 'Answers in ₹ LPA, understands Indian company culture, and supports 10+ Indian languages.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 items-start group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl flex-shrink-0 group-hover:border-blue-500/40 transition-smooth">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white mb-1">{item.title}</div>
                      <div className="text-slate-400 text-sm leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Benefits card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
              <div className="relative glass-card p-8 border border-blue-500/15 space-y-5">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🎯</div>
                  <div className="text-2xl font-black text-white">Who Uses JavihAI?</div>
                  <div className="text-sm text-slate-500 mt-1">Candidates across India</div>
                </div>

                <div className="space-y-4">
                  {[
                    { emoji: '🎓', title: 'Freshers & Students', desc: 'First job interviews, campus placements, off-campus drives', color: 'blue' },
                    { emoji: '💼', title: 'Working Professionals', desc: 'Job switches, FAANG prep, senior/lead role interviews', color: 'purple' },
                    { emoji: '👨‍💻', title: 'Coders & Engineers', desc: 'Coding rounds on HackerRank, LeetCode, CodeSignal & more', color: 'blue' },
                    { emoji: '🏆', title: 'Career Switchers', desc: 'Changing roles, upskilling, interviewing at new companies', color: 'purple' },
                  ].map((user) => (
                    <div key={user.title} className={userCardClasses(user.color)}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">{user.emoji}</span>
                        <div>
                          <div className={userTitleClasses(user.color)}>{user.title}</div>
                          <div className="text-slate-400 text-xs leading-relaxed">{user.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="section-py bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label">🚀 3-Minute Setup</div>
            <h2 className="section-heading mb-4">
              Ready Before Your Next <span className="text-gradient">Interview</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">No complex setup. No coaching. Just install, sign in, and start.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-14 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30" />

            {[
              {
                num: '01',
                icon: '📝',
                title: 'Create Free Account',
                desc: 'Sign up in 30 seconds — no credit card. Get 10 AI answers/day free, forever. No expiry.',
                color: 'from-blue-500 to-indigo-500',
              },
              {
                num: '02',
                icon: '⬇',
                title: 'Download Desktop App',
                desc: 'Install the free desktop overlay for Windows 10/11 or macOS (Apple Silicon or Intel). Runs silently in background.',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                num: '03',
                icon: '🎯',
                title: 'Open in Your Interview',
                desc: 'Join Zoom/Meet/Teams as usual. JavihAI overlay is invisible. Questions are auto-detected. Answers stream in 2 seconds.',
                color: 'from-blue-500 to-purple-500',
              },
            ].map((step) => (
              <div key={step.num} className="text-center relative z-10">
                <div className={`inline-flex w-20 h-20 rounded-2xl items-center justify-center text-4xl mb-5 shadow-lg shadow-blue-500/20 ${GRADIENT_CLASSES[step.color] || 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
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

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES — BENTO GRID
      ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="section-py">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label">✨ Features</div>
            <h2 className="section-heading mb-4">
              Every Tool You Need <span className="text-gradient">in One Overlay</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Nine AI-powered features for technical, HR, and system-design rounds
            </p>
          </div>

          <div className="bento-grid">
            {[
              {
                icon: '🎧',
                title: 'System Audio Capture',
                desc: 'Hears the interviewer directly — no need to tap a mic. Works even when the interviewer is muted on your end or shares their screen.',
                gradient: 'from-blue-500 to-indigo-500',
                badge: 'Exclusive',
                span: false,
              },
              {
                icon: '⚡',
                title: 'Instant AI Answers',
                desc: 'Structured answers streamed word-by-word in under 2 seconds. Powered by Groq\'s LLaMA — the fastest AI inference on the planet.',
                gradient: 'from-indigo-500 to-purple-500',
                badge: null,
                span: false,
              },
              {
                icon: '🧠',
                title: 'Smart Question Detection',
                desc: 'Auto-detects when a real question is asked — ignores greetings, filler, and small talk. You only see answers that matter.',
                gradient: 'from-purple-500 to-blue-500',
                badge: null,
                span: false,
              },
              {
                icon: '📸',
                title: 'Screen Capture & Solve',
                desc: 'Press a hotkey and JavihAI reads your screen — coding problems, system design diagrams, or HackerRank challenges. Explains step-by-step.',
                gradient: 'from-blue-500 to-purple-500',
                badge: null,
                span: true,
              },
              {
                icon: '🥷',
                title: 'Stealth Overlay',
                desc: 'OS-level exclusion from screen capture. Invisible on Zoom, Google Meet, Teams, and any other tool. The interviewer sees only your screen.',
                gradient: 'from-orange-500 to-red-500',
                badge: 'Undetectable',
                span: false,
              },
              {
                icon: '🎤',
                title: 'Live Caption Transcript',
                desc: 'See your own words transcribed in real-time as you speak. Review what you said, never miss a beat.',
                gradient: 'from-blue-500 to-green-500',
                badge: null,
                span: false,
              },
              {
                icon: '🔗',
                title: 'Job URL Auto-fill',
                desc: 'Paste a LinkedIn, Naukri, Indeed, or Glassdoor job link — JavihAI fetches the JD and fills your profile instantly.',
                gradient: 'from-sky-500 to-blue-500',
                badge: 'New',
                span: false,
              },
              {
                icon: '🎯',
                title: 'Detect Skills from JD',
                desc: 'After loading a job description, one click auto-selects the required tech stack — React, Python, AWS, Docker and 24 more.',
                gradient: 'from-violet-500 to-purple-500',
                badge: 'New',
                span: false,
              },
              {
                icon: '🗣️',
                title: 'Voice-Driven Mock Interview',
                desc: 'Practice out loud, not by typing. Questions generated live from your profile and JD at Easy/Medium/Hard — speak your answer, get scored.',
                gradient: 'from-purple-500 to-blue-500',
                badge: 'Rebuilt',
                span: true,
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`glass-card p-6 sm:p-8 group ${feature.span ? 'bento-span-2' : ''}`}
              >
                {feature.badge && (
                  <div className="absolute top-4 right-4 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 font-bold z-10">
                    {feature.badge}
                  </div>
                )}
                <div className={`inline-flex w-12 h-12 rounded-xl items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-bounce shadow-lg ${GRADIENT_CLASSES[feature.gradient] || 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FREE TOOLS — no download required
      ═══════════════════════════════════════════════════════════════ */}
      <section className="section-py bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-label">🧰 Also free</div>
            <h2 className="section-heading mb-4">
              Tools You Can Use <span className="text-gradient">Right Now</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              No download, no sign-in required — build your resume or find your next role before you even
              install the desktop app.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/resume" className="card card-glow group block">
              <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center text-2xl mb-5 bg-gradient-to-br from-blue-500 to-indigo-500 group-hover:scale-110 transition-bounce shadow-lg">
                📄
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Resume Builder</h3>
              <p className="text-slate-400 leading-relaxed text-sm mb-4">
                ATS-ready templates, live preview, one-click PDF export — all in your browser. Two premium templates included with Pro.
              </p>
              <span className="text-indigo-400 text-sm font-semibold group-hover:text-indigo-300">Build your resume →</span>
            </Link>

            <Link href="/jobs" className="card card-glow group block">
              <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center text-2xl mb-5 bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:scale-110 transition-bounce shadow-lg">
                💼
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Job Recommendations</h3>
              <p className="text-slate-400 leading-relaxed text-sm mb-4">
                Curated tech roles across India — search by role, skill, or city, then practice for any of them with JavihAI.
              </p>
              <span className="text-indigo-400 text-sm font-semibold group-hover:text-indigo-300">Browse jobs →</span>
            </Link>

            <Link href="/mock-interview" className="card card-glow group block">
              <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center text-2xl mb-5 bg-gradient-to-br from-purple-500 to-blue-500 group-hover:scale-110 transition-bounce shadow-lg">
                🗣️
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Voice Mock Interview</h3>
              <p className="text-slate-400 leading-relaxed text-sm mb-4">
                Speak your answers to questions generated from your profile and JD — scored live, inside the desktop app.
              </p>
              <span className="text-indigo-400 text-sm font-semibold group-hover:text-indigo-300">See how it works →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          DESI MODE SPOTLIGHT
      ═══════════════════════════════════════════════════════════════ */}
      <section id="why" className="section-py bg-slate-950/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: text */}
            <div>
              <div className="section-label">🇮🇳 Made for India</div>
              <h2 className="section-heading mb-6">
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
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/15 flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm mb-1">{item.title}</div>
                      <div className="text-slate-400 text-sm leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Desi Mode card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 to-red-500/8 rounded-3xl blur-2xl" />
              <div className="relative glass-card p-8 border border-orange-500/15">
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

                <div className="space-y-5 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wide">Interviewer asks:</div>
                    <div className="text-slate-300 italic leading-relaxed">&ldquo;What is your current CTC and what are your expectations?&rdquo;</div>
                  </div>
                  <div className="border-t border-white/5 pt-5">
                    <div className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wide flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block animate-pulse" />
                      JavihAI · Desi Mode answer:
                    </div>
                    <div className="text-slate-300 leading-relaxed">
                      My current CTC is <span className="text-blue-400 font-semibold">₹18 LPA</span> (₹14L fixed + ₹4L variable). I&apos;m targeting <span className="text-blue-400 font-semibold">₹26–28 LPA</span> based on my 4 YOE in fintech and the scope here. I have a <span className="text-yellow-400">60-day notice period</span>, negotiable to 30 days.
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/12 text-orange-300 border border-orange-500/15">₹ in LPA</span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/50 text-slate-400 border border-slate-700/30">Notice period</span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/50 text-slate-400 border border-slate-700/30">Indian norms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          COMPARISON TABLE
      ═══════════════════════════════════════════════════════════════ */}
      <section className="section-py">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-label">⚖️ Compare</div>
            <h2 className="section-heading mb-4">
              JavihAI vs <span className="text-gradient">Every Other Tool</span>
            </h2>
            <p className="text-slate-400">Same real-time AI help. 15× cheaper. Built for India.</p>
          </div>

          <div className="glass-card overflow-hidden border-blue-500/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/40">
                    <th className="text-left px-5 py-4 text-slate-400 font-semibold w-48">Feature</th>
                    <th className="px-4 py-4 text-center">
                      <div className="text-white font-bold text-base">JavihAI</div>
                      <div className="text-blue-400 text-xs font-semibold mt-0.5">₹{effectivePrice(pricing.plans.pro.oneTime, pricing.offer, 'pro')}</div>
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
                    ['Real-time AI answers', '✅', '✅', '✅', '✅'],
                    ['Desktop app (true stealth)', '✅', '⚠️ Web', '✅', '⚠️ Web'],
                    ['System audio capture', '✅', '❌', '✅', '❌'],
                    ['Screen capture & solve', '✅', '✅', '✅', '❌'],
                    ['Indian languages (10+)', '✅', '❌', '❌', '⚠️ 2'],
                    ['Indian interview context', '✅', '❌', '❌', '⚠️ Basic'],
                    ['₹ LPA salary & notice norms', '✅', '❌', '❌', '❌'],
                    ['INR pricing (Razorpay)', '✅', '❌', '❌', '❌'],
                    ['Free plan (no time limit)', '✅', '❌', '❌', '⚠️ Trial'],
                    ['7-day money-back guarantee', '✅', '❌', '❌', '❌'],
                    ['Mock interview with scoring', '✅', '✅', '❌', '❌'],
                    ['Job URL auto-fill (JD fetch)', '✅', '❌', '❌', '❌'],
                    ['Detect skills from JD', '✅', '❌', '❌', '❌'],
                  ].map(([feature, ...vals], i) => (
                    <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-slate-900/20' : ''} hover:bg-slate-800/20 transition-smooth`}>
                      <td className="px-5 py-3.5 text-slate-300 font-medium">{feature}</td>
                      {vals.map((v, j) => (
                        <td key={j} className={`px-4 py-3.5 text-center text-base ${j === 0 ? 'bg-blue-500/5' : ''}`}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-center mt-8 flex-wrap text-sm">
            <Link href="/compare/final-round-ai" className="text-blue-400 hover:text-blue-300 underline">JavihAI vs Final Round AI →</Link>
            <Link href="/compare/chiku-ai" className="text-blue-400 hover:text-blue-300 underline">JavihAI vs Chiku AI →</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <section id="reviews" className="section-py bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-label">💬 Real Candidates</div>
            <h2 className="section-heading mb-4">
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
                quote: "Was paying ₹7,000/mo for Final Round AI. Switched to JavihAI and honestly the answers are better. The Indian context makes a huge difference in HR rounds.",
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
              <div key={i} className="glass-card flex flex-col gap-4 hover:border-blue-500/20">
                <div className="flex justify-between items-start">
                  <div className="testimonial-avatar">{t.emoji}</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <span key={j} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed text-sm flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="border-t border-white/5 pt-4">
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                  <div className="text-xs text-blue-400 mt-1 font-medium">{t.company}</div>
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
              url: 'https://www.javihai.in',
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

      {/* ═══════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="section-py">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-label">❓ FAQ</div>
            <h2 className="section-heading mb-4">
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
                q: 'Are there other precautions I should take before starting an interview?',
                a: 'A couple of quick ones: JavihAI itself is never visible in a screen share, but other apps can still show icons in your menu bar (Mac) or taskbar (Windows) — password managers, chat apps, other overlays. Glance at it before you start and hide anything you don\'t want visible — on Mac, System Settings → Control Center → Menu Bar lets you toggle individual app icons off. Also close notification popups (Slack, email, WhatsApp) so nothing pops up mid-interview.',
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
                a: 'JavihAI has a permanent free plan with 10 AI answers per day — no credit card, no time limit. Paid plans unlock unlimited answers, Desi Mode, and more. Both paid plans include a 7-day money-back guarantee.',
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
                className="glass-card cursor-pointer select-none hover:border-blue-500/20"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-white">{item.q}</h3>
                  <div className={`w-8 h-8 rounded-full glass flex items-center justify-center transition-bounce flex-shrink-0 ${openFaq === i ? 'rotate-180 gradient-primary' : ''}`}>
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

      {/* ═══════════════════════════════════════════════════════════════
          COMMUNITY / CTA BAND
      ═══════════════════════════════════════════════════════════════ */}
      <section className="section-py bg-slate-950/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="section-label">🌐 Community</div>
          <h2 className="section-heading mb-4">
            Join the <span className="text-gradient">JavihAI Community</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-10">
            Daily interview tips, coding round solutions, salary negotiation advice, and real candidate success stories — follow us to stay ahead.
          </p>

          {/* WhatsApp CTA */}
          <div className="glass-card p-8 md:p-12 border border-blue-500/15 text-center mb-10">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
              Join Candidates on WhatsApp
            </h3>
            <p className="text-slate-300 text-lg mb-6 max-w-lg mx-auto">
              Daily interview tips, success stories, and exclusive strategies from candidates who&apos;ve cracked FAANG and India&apos;s top companies.
            </p>
            <a
              href="https://chat.whatsapp.com/JdfkOG55dqEHlWNvEXkFh0?s=sw&p=a&ilr=4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all shadow-md"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.781 1.13L.9 3.546l1.9 6.943a9.788 9.788 0 001.348 4.168 9.868 9.868 0 008.284 4.745h.005c5.048 0 9.28-4.073 9.797-9.126.629-6.289-4.844-11.745-11.255-11.745"/>
              </svg>
              Join WhatsApp Group
            </a>
            <p className="text-sm text-slate-500 mt-4">💡 Free to join. No spam. Real community building.</p>
          </div>

          {/* Social links */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              { platform: 'Twitter / X', handle: '@Javih_ai', href: 'https://x.com/Javih_ai', icon: '𝕏', desc: 'Daily interview tips & hot takes', color: 'from-slate-800 to-slate-900', border: 'border-slate-700/50' },
              { platform: 'LinkedIn', handle: 'javih-ai', href: 'https://www.linkedin.com/in/javih-ai/', icon: '💼', desc: 'Career advice & success stories', color: 'from-blue-950 to-slate-900', border: 'border-blue-800/30' },
              { platform: 'Instagram', handle: '@javih.ai', href: 'https://www.instagram.com/javih.ai/', icon: '📸', desc: 'App demos & interview reels', color: 'from-pink-950 to-slate-900', border: 'border-pink-800/30' },
              { platform: 'YouTube', handle: '@javih_ai', href: 'https://www.youtube.com/@javih_ai', icon: '▶️', desc: 'Full interview prep tutorials', color: 'from-red-950 to-slate-900', border: 'border-red-800/30' },
              { platform: 'WhatsApp', handle: 'Channel', href: '#', icon: '💬', desc: 'Message us on WhatsApp', color: 'from-green-950 to-slate-900', border: 'border-green-800/30', cta: 'Open WhatsApp' },
            ].map((s) => (
              s.platform === 'WhatsApp' ? (
                <button
                  key={s.platform}
                  onClick={() => window.dispatchEvent(new Event('open-whatsapp-form'))}
                  className={`glass-card border ${s.border} text-center group hover:scale-105 transition-bounce ${GRADIENT_CLASSES[s.color] || 'bg-gradient-to-b from-slate-800 to-slate-900'}`}
                >
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="font-bold text-white text-sm mb-0.5">{s.platform}</div>
                  <div className="text-slate-500 text-xs mb-2">{s.handle}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{s.desc}</div>
                  <div className="mt-3 text-xs text-blue-400 font-semibold">Message us →</div>
                </button>
              ) : (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`glass-card border ${s.border} text-center group hover:scale-105 transition-bounce no-underline ${GRADIENT_CLASSES[s.color] || 'bg-gradient-to-b from-slate-800 to-slate-900'}`}
                >
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="font-bold text-white text-sm mb-0.5">{s.platform}</div>
                  <div className="text-slate-500 text-xs mb-2">{s.handle}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{s.desc}</div>
                  <div className="mt-3 text-xs text-blue-400 font-semibold group-hover:text-blue-300">Follow →</div>
                </a>
              )
            ))}
          </div>

          <p className="text-slate-600 text-sm">
             candidates already part of the community · New content every day
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-12 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="font-bold text-white mb-4">Product</div>
              <div className="space-y-2.5">
                <Link href="/#features" className="footer-link block">Features</Link>
                <Link href="/pricing" className="footer-link block">Pricing</Link>
                <Link href="/#how-it-works" className="footer-link block">How It Works</Link>
                <Link href="/" className="footer-link block">Download</Link>
              </div>
            </div>
            <div>
              <div className="font-bold text-white mb-4">Resources</div>
              <div className="space-y-2.5">
                <Link href="/blog" className="footer-link block">Blog</Link>
                <Link href="/#faq" className="footer-link block">FAQ</Link>
                <Link href="/compare" className="footer-link block">Compare</Link>
                <Link href="/#reviews" className="footer-link block">Reviews</Link>
              </div>
            </div>
            <div>
              <div className="font-bold text-white mb-4">Legal</div>
              <div className="space-y-2.5">
                <Link href="/privacy" className="footer-link block">Privacy Policy</Link>
                <Link href="/terms" className="footer-link block">Terms of Service</Link>
                <Link href="/refund" className="footer-link block">Refund Policy</Link>
              </div>
            </div>
            <div>
              <div className="font-bold text-white mb-4">Support</div>
              <div className="space-y-2.5">
                <Link href="/auth/login" className="footer-link block">Sign In</Link>
                <Link href="/auth/signup" className="footer-link block">Sign Up</Link>
                <a href="mailto:support@javihai.in" className="footer-link block">support@javihai.in</a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="JavihAI" className="h-8 w-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              <span className="font-bold text-white">JavihAI</span>
            </div>
            <p className="text-slate-600 text-sm">
              © {new Date().getFullYear()} JavihAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <FreeTrialModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />
      <DownloadStepsModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        os={downloadModalOS}
        onSwitchOS={setDownloadModalOS}
        downloadUrl={downloadModalOS === 'windows' ? '/api/download/win' : '/api/download/mac'}
      />
    </>
  );
}
