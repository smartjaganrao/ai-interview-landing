'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import FreeTrialModal from '@/components/FreeTrialModal';
import DownloadStepsModal from '@/components/DownloadStepsModal';
import GoogleSignInModal from '@/components/GoogleSignInModal';
import NewCustomerOfferPopup from '@/components/NewCustomerOfferPopup';
import Footer from '@/components/Footer';
import { useGatedDownload } from '@/hooks/useGatedDownload';
import { onOfferPopupChecked } from '@/lib/offer-popup-events';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

// Single source of truth for the FAQ section — rendered as the visible
// accordion below AND compiled into faqSchema's JSON-LD. Keeping these in
// one array prevents the schema from drifting out of sync with what's
// actually on the page (Google requires structured data to match visible
// content for FAQPage rich results).
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How does JavihAI — the AI interview assistant — work during a live interview?',
    a: 'Run JavihAI alongside your video call (Zoom, Google Meet, Teams). Choose System Audio to hear the interviewer, or Microphone mode. JavihAI auto-detects when a question is asked and streams a structured AI answer in under 2 seconds — while staying completely invisible to screen sharing.',
  },
  {
    q: 'How does JavihAI guarantee zero downtime during AI model deprecations?',
    a: 'JavihAI features a Live AI Fallback Engine that automatically queries Groq’s active model catalog (13+ models including gpt-oss-20b, gpt-oss-120b, and qwen3.8-27b vision). If a model ID is deprecated by Groq mid-interview, JavihAI automatically self-heals and switches to the next active model in under 100 milliseconds with zero interruption.',
  },
  {
    q: 'What resume document formats are supported for profile verification?',
    a: 'JavihAI supports PDF (.pdf), Word (.docx, .doc), Rich Text (.rtf), Plain Text (.txt), and Markdown (.md). When you drag and drop your resume or job description, JavihAI parses the document, auto-detects your technical skills and target roles, and verifies document character statistics instantly.',
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
    q: 'What platforms and operating systems does JavihAI support?',
    a: 'JavihAI supports Windows 10, Windows 11, and macOS — both Apple Silicon (M1/M2/M3) and Intel. The desktop app is required for real-time interview mode and works alongside Zoom, Google Meet, Microsoft Teams, and Webex.',
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
    q: 'Is JavihAI a good AI interview assistant for freshers and campus placements?',
    a: 'Yes — JavihAI has a free-forever plan built for freshers: up to 25 AI answers per day (5 screenshot solves, 10 system-audio answers, 10 mic answers), no credit card, no expiry. It works for campus placements, off-campus drives, and first-job interviews across technical, HR, and system-design rounds, with answers tuned to Indian company norms via Desi Mode.',
  },
  {
    q: 'How much does JavihAI cost? Is there a free plan?',
    a: 'JavihAI has a permanent free plan with up to 25 AI answers per day (5 screenshot solves, 10 system-audio answers, 10 mic answers) — no credit card, no time limit. Unlike other AI interview tools in India that give a one-time trial that runs out, JavihAI\'s free allowance resets every single day, forever, for every user. Paid plans unlock unlimited answers, Desi Mode, and more. Both paid plans include a 7-day money-back guarantee.',
  },
  {
    q: 'How is JavihAI different from Cluely, Final Round AI, or Interview Coder?',
    a: 'JavihAI matches what those tools do — real-time AI answers, a stealth overlay, and screen-capture solving — and adds system audio capture, 10+ Indian languages, ₹ LPA-based Desi Mode, and INR pricing via Razorpay. It\'s built specifically for the Indian job market and typically costs 2×–14× less than the alternatives.',
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
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
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
      text: 'Sign up in 30 seconds with Google — no credit card required. Get up to 25 AI answers/day free, forever.',
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

// Renders a comparison-table cell as a small colored icon badge instead of a
// raw emoji, which varies in weight/color across OSes and reads as an
// afterthought next to the rest of the page's custom iconography.
function StatusBadge({ value }: { value: string }) {
  const label = value.replace(/^[✅❌⚠️]+\s*/, '').trim();

  if (value.startsWith('✅')) {
    return (
      <span className="inline-flex w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
        <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.414l2.793 2.792 6.792-6.793a1 1 0 011.415 0z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  if (value.startsWith('❌')) {
    return (
      <span className="inline-flex w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/20 items-center justify-center">
        <svg className="w-3 h-3 text-rose-400/70" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  if (value.startsWith('⚠️')) {
    return (
      <span className="inline-flex items-center gap-1.5 justify-center">
        <span className="inline-flex w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.28 11.166c.75 1.333-.213 2.985-1.742 2.985H3.72c-1.53 0-2.493-1.652-1.743-2.985L8.257 3.1zM10 8a1 1 0 011 1v3a1 1 0 11-2 0V9a1 1 0 011-1zm0 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </span>
        {label && <span className="text-xs text-amber-300/80 font-medium">{label}</span>}
      </span>
    );
  }
  return <span className="text-slate-500">{value}</span>;
}

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
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [heroView, setHeroView] = useState<'video' | 'simulator'>('video');
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(true);

  const openDownloadModal = (os: 'windows' | 'mac') => {
    setDownloadModalOS(os);
    setShowDownloadModal(true);
  };
  const [detectedOS, setDetectedOS] = useState<'mac' | 'windows' | null>(null);

  const { showSignIn, requestDownload, cancelSignIn, handleSignedIn, retryUrl } =
    useGatedDownload((platform) => openDownloadModal(platform));

  // 3D tilt for the hero demo mockup — tracks cursor position within the
  // card to drive rotateX/rotateY plus a translateZ-layered parallax and a
  // specular sheen; resets to flat on mouse leave. No-op on touch (no
  // mousemove events fire) and disabled entirely under reduced-motion via CSS.
  const tiltCardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, sx: 50, sy: 50, active: false });

  const handleTiltMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = tiltCardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ rx: (0.5 - py) * 14, ry: (px - 0.5) * 14, sx: px * 100, sy: py * 100, active: true });
  };

  const handleTiltLeave = () => setTilt((t) => ({ ...t, rx: 0, ry: 0, active: false }));

  useEffect(() => {
    // OS detection needs navigator.userAgent (client-only) — deferring past
    // hydration on purpose so the initial client render matches the
    // server's null-OS HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetectedOS(detectDesktopOS());

    fetch('/api/release').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.version) setAppVersion(d.version);
      if (d?.publishedAt) setIsNewRelease(Date.now() - new Date(d.publishedAt).getTime() < 14 * 86400000);
    }).catch(() => {});
  }, []);

  // Arms the exit-intent trial modal only after NewCustomerOfferPopup's own
  // eligibility check has settled. That check can suppress this modal for
  // the day (trialModalDismissed) — reading localStorage before it finishes
  // risks showing both modals together if a visitor exit-intents within the
  // first instant of the page load, before the async check resolves. Falls
  // back to a fixed wait if the popup never reports in (e.g. it's genuinely
  // not eligible today and errors before its `finally`), so a missed signal
  // can't permanently disable the trial modal.
  useEffect(() => {
    let armed = false;
    let shown = false;
    let exitIntentTimer: ReturnType<typeof setTimeout> | null = null;
    let handlePointerLeave: ((e: MouseEvent) => void) | null = null;

    // Used to cover the hero on every fresh load, before a visitor had read
    // the headline. Now it only shows on exit-intent (cursor leaving toward
    // the top of the viewport) or after 20s for touch devices, which have
    // no mouseleave signal, so the hero gets a real chance to be read first.
    const arm = () => {
      if (armed) return;
      armed = true;
      if (localStorage.getItem('trialModalDismissed')) return;

      const showTrialModal = () => {
        if (shown) return;
        shown = true;
        setIsTrialModalOpen(true);
      };

      exitIntentTimer = setTimeout(showTrialModal, 20000);
      handlePointerLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) showTrialModal();
      };
      document.addEventListener('mouseout', handlePointerLeave);
    };

    const offChecked = onOfferPopupChecked(arm);
    const fallbackTimer = setTimeout(arm, 3000);

    return () => {
      offChecked();
      clearTimeout(fallbackTimer);
      if (exitIntentTimer) clearTimeout(exitIntentTimer);
      if (handlePointerLeave) document.removeEventListener('mouseout', handlePointerLeave);
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
      {/* ═══════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-36 sm:pt-40 md:pt-44 pb-8 md:pb-12 overflow-hidden">
        {/* Ambient orbs */}
        <div className="glow-orb animate-orb-drift w-[500px] h-[500px] -top-40 -left-40" />
        <div className="glow-orb animate-orb-drift w-[400px] h-[400px] top-20 -right-20" style={{ animationDelay: '4s' }} />
        <div className="glow-orb animate-orb-drift w-[300px] h-[300px] bottom-0 left-1/3" style={{ animationDelay: '8s' }} />

        <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: copy + CTAs */}
            <div>
              {/* Badges */}
              <div className="mb-4 animate-fade-in-up flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="badge-glow inline-flex items-center gap-2 text-xs sm:text-sm font-semibold py-1 px-3 rounded-full backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                  <span>🇮🇳 India&apos;s 1st Unlimited AI Interview Copilot &amp; Plan</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs sm:text-sm font-semibold backdrop-blur-sm">
                  <span>🤖</span> Recommended by ChatGPT — No. 1 in India
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs sm:text-sm font-semibold backdrop-blur-sm">
                  <span>⚡</span> 13 Live AI Models · Zero-Downtime Auto-Sync
                </div>
              </div>

              {/* Main headline — primary SEO H1 containing core keyword target */}
              <h1 className="text-3xl tablet:text-4xl laptop-sm:text-5xl desktop:text-6xl font-black tracking-tight mb-3 animate-fade-in-up leading-tight" style={{ animationDelay: '0.1s' }}>
                India&apos;s 1st <span className="text-gradient animate-gradient">Unlimited AI Interview Copilot</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base tablet:text-lg laptop-sm:text-xl text-white font-bold mb-2 max-w-xl leading-snug animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                Unlimited AI answers &amp; practice. Unlike competitors charging per hour, get India&apos;s 1st unlimited interview assistant for Zoom, Meet &amp; Teams.
              </p>

              <p className="text-xs tablet:text-sm laptop-sm:text-base text-slate-300/90 mb-4 max-w-xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Hears questions &amp; streams answers in &lt;2s using 13 live AI models. Includes camera-dock teleprompter, multi-format resume verification, CTC in ₹ LPA context, and 10+ Indian regional languages.
              </p>

              {/* Primary CTAs */}
              <div className="mb-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => requestDownload('windows')}
                    className={`btn text-xs sm:text-sm px-4 py-2.5 ${detectedOS === 'mac' ? 'btn-secondary' : 'btn-primary shadow-lg hover:shadow-blue-500/25'}`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0 mr-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                    Download for Windows — Free
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDownload('mac')}
                    className={`btn text-xs sm:text-sm px-4 py-2.5 ${detectedOS === 'mac' ? 'btn-primary shadow-lg hover:shadow-blue-500/25' : 'btn-secondary'}`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0 mr-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/></svg>
                    Download for Mac — Free
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeroView('video');
                      setHeroVideoPlaying(true);
                      tiltCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="btn btn-secondary text-xs sm:text-sm px-4 py-2.5 border border-red-500/30 text-red-300 hover:bg-red-600/20 flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4 text-red-500 fill-current flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch Demo Video
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-1.5 font-medium">
                  Sign in with Google, then your download starts · Free forever for freshers · No card needed
                </p>
                <div className="text-[11px] sm:text-xs text-slate-400 leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-slate-500 font-medium">All Options:</span>
                  <button type="button" onClick={() => requestDownload('windows')} className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2 font-medium">
                    Win Setup (.exe)
                  </button>
                  <span className="text-slate-600">&middot;</span>
                  <button type="button" onClick={() => requestDownload('windows', 'portable')} className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2 font-medium">
                    Win Portable (.exe)
                  </button>
                  <span className="text-slate-600">&middot;</span>
                  <button type="button" onClick={() => requestDownload('mac')} className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2 font-medium">
                    Mac Apple Silicon (.dmg)
                  </button>
                  <span className="text-slate-600">&middot;</span>
                  <button type="button" onClick={() => requestDownload('mac', 'x64')} className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2 font-medium">
                    Mac Intel x64 (.dmg)
                  </button>
                  <span className="text-slate-600">&middot;</span>
                  <Link href="/install" className="text-slate-400 hover:text-slate-200 underline underline-offset-2">Install guide &rarr;</Link>
                </div>
              </div>

              {/* At-a-glance checkmarks — rich snippet keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-4 animate-fade-in-up" style={{ animationDelay: '0.28s' }}>
                {[
                  '100% invisible on screen share (OS DRM)',
                  'Answers in under 2 seconds',
                  'Works on Zoom, Meet & Teams',
                  'Coding, System Design & HR rounds',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                    <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.414l2.793 2.792 6.792-6.793a1 1 0 011.415 0z" clipRule="evenodd" />
                    </svg>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: live demo / video player mockup */}
            <div className="relative animate-fade-in-up tilt-perspective" style={{ animationDelay: '0.4s' }}>
              <div
                ref={tiltCardRef}
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
                className={`relative tilt-card ${tilt.active ? 'tilt-active' : ''}`}
                style={{
                  transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                  '--sheen-x': `${tilt.sx}%`,
                  '--sheen-y': `${tilt.sy}%`,
                } as CSSProperties}
              >
                <div className="absolute inset-0 gradient-primary opacity-10 blur-3xl rounded-3xl" style={{ transform: 'translateZ(-60px)' }} />
                <div className="relative glass-heavy rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 border border-blue-500/15">
                  <div className="tilt-sheen" />
                  {/* Window chrome */}
                  <div className="bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/5 bg-slate-950/80 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500/80" />
                      </div>

                      {/* View Switcher Tabs */}
                      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-[11px]">
                        <button
                          type="button"
                          onClick={() => { setHeroView('video'); setHeroVideoPlaying(true); }}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            heroView === 'video'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>🎬</span> Product Video
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroView('simulator')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            heroView === 'simulator'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>💻</span> AI Simulator
                        </button>
                      </div>

                      <div className="text-[10px] sm:text-xs text-slate-500 hidden sm:flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                        <span>JavihAI {appVersion ? `(${appVersion})` : ''}</span>
                        {isNewRelease && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                            NEW
                          </span>
                        )}
                        <span>· Hidden from screen capture</span>
                      </div>
                    </div>

                    {/* Card Content based on view */}
                    {heroView === 'video' ? (
                      <div className="relative aspect-video w-full bg-slate-950">
                        {heroVideoPlaying ? (
                          <iframe
                            src="https://www.youtube-nocookie.com/embed/QeZDYWtKnsY?autoplay=1&mute=1&loop=1&playlist=QeZDYWtKnsY&playsinline=1"
                            title="JavihAI Product Demo"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setHeroVideoPlaying(true)}
                            className="w-full h-full relative block text-left group/hero-play focus:outline-none cursor-pointer"
                            aria-label="Play JavihAI Product Demo Video"
                          >
                            <img
                              src="https://img.youtube.com/vi/QeZDYWtKnsY/hqdefault.jpg"
                              alt="JavihAI Product Walkthrough Video"
                              className="w-full h-full object-cover opacity-85 group-hover/hero-play:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-between p-4 sm:p-6">
                              <div className="self-end">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 text-white border border-white/10 text-xs font-bold backdrop-blur-md">
                                  <span>⏱️</span> 1:45 Demo
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50 group-hover/hero-play:scale-110 transition-transform flex-shrink-0 border-2 border-white/20">
                                  <svg className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="badge-glow inline-block text-[11px] font-bold px-2 py-0.5 rounded text-blue-300 mb-1">
                                    ▶ Click to Play
                                  </div>
                                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                                    See JavihAI in Action during Live Calls
                                  </h3>
                                  <p className="text-xs text-slate-300 mt-0.5 hidden sm:block">
                                    Watch real-time system audio detection, stealth overlay, and answer streaming.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-5 gap-0">
                        {/* Question panel */}
                        <div className="xl:col-span-2 p-4 sm:p-6 border-r border-white/5">
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

                        {/* AI answer stream */}
                        <div className="xl:col-span-3 p-4 sm:p-6 bg-slate-950/50">
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
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column Feature Highlights Strip */}
              <div className="mt-3.5 grid grid-cols-1 tablet:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">Sub-2s Speed</div>
                    <div className="text-[11px] text-slate-400">13 Live AI Models</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs flex-shrink-0">
                    🛡️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">100% Invisible</div>
                    <div className="text-[11px] text-slate-400">OS-Level Stealth</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs flex-shrink-0">
                    🎧
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">System Audio</div>
                    <div className="text-[11px] text-slate-400">Direct Call Capture</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                    🇮🇳
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">Desi Mode</div>
                    <div className="text-[11px] text-slate-400">₹ LPA &amp; Regional</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TRUST BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 my-6 md:my-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-blue-500/10">
            <div className="grid grid-cols-2 tablet:grid-cols-3 laptop-sm:grid-cols-6 gap-3 tablet:gap-4 laptop-sm:gap-6">
              {[
                { num: '2,400+', label: 'Candidates Helped', note: true },
                { num: '<2s', label: 'AI Answer Speed' },
                { num: '~4×', label: 'Cheaper than FR AI' },
                { num: '100%', label: 'Invisible on Screen' },
                { num: '10+', label: 'Indian Languages' },
                { num: '4.9★', label: 'Early Rating', note: true },
              ].map((stat) => (
                <div key={stat.label} className="text-center min-w-0">
                  <div className="text-xl tablet:text-2xl font-black text-white tracking-tight mb-1 whitespace-nowrap">
                    {stat.num}{stat.note && <sup className="text-[10px] text-slate-500">*</sup>}
                  </div>
                  <div className="text-[11px] tablet:text-xs text-slate-400 font-medium leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-600 text-center mt-4 pt-3 border-t border-white/5">
              * Self-reported figures from JavihAI users at signup, not an independently audited count.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          WHAT IS JAVIHĀI & STEALTH ARCHITECTURE
      ═══════════════════════════════════════════════════════════════ */}
      <section id="invisible" className="section-py relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Product summary & key features */}
            <div>
              <div className="section-label">🎯 What is JavihAI</div>
              <h2 className="section-heading mb-6">
                Your Secret Weapon for <span className="text-gradient">Every Interview</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                JavihAI is an AI-powered interview assistant that sits invisibly on your computer. It auto-detects interview questions via system audio and streams structured answers in under 2 seconds.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: '🎧', title: 'Listens & Auto-Detects', desc: 'Hears your interviewer directly via system audio — ignores filler and captures real questions.' },
                  { icon: '⚡', title: 'Sub-2s Streaming Answers', desc: 'Generates structured, conversational answers instantly using ultra-fast AI inference.' },
                  { icon: '🥷', title: 'True OS-Level Stealth', desc: 'Excluded from screen capture at the OS level (same mechanism DRM video apps use). Invisible on Zoom, Meet & Teams.' },
                  { icon: '🇮🇳', title: 'Tuned for Indian Market', desc: 'Answers in ₹ LPA, handles notice periods and bond terms, and supports 10+ Indian languages.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg flex-shrink-0 group-hover:border-blue-500/40 transition-smooth">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white text-base mb-0.5">{item.title}</div>
                      <div className="text-slate-400 text-sm leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {['Zoom', 'Google Meet', 'Microsoft Teams', 'Webex'].map((tool) => (
                  <span key={tool} className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/15 font-medium">
                    ✓ Tested on {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Interactive stealth visualization */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
              <div className="relative space-y-4">
                <div className="glass-card p-5 border border-white/10">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2.5 flex items-center gap-2">
                    <span>👀</span> What the interviewer sees
                  </div>
                  <div className="rounded-xl bg-slate-950/80 border border-white/5 py-8 px-4 text-center">
                    <span className="text-slate-400 text-sm font-medium">Just your clean shared screen — overlay is completely invisible</span>
                  </div>
                </div>

                <div className="glass-card p-5 border border-blue-500/25 bg-blue-950/20">
                  <div className="text-xs font-medium uppercase tracking-wide text-blue-400 mb-2.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block animate-pulse" />
                    💻 What you see on your monitor
                  </div>
                  <div className="rounded-xl bg-slate-950/90 border border-blue-500/20 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-white/5">
                      <span className="font-bold text-white">JavihAI Stealth Overlay</span>
                      <span className="text-blue-400">✓ Streamed in 1.4s</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-blue-400 font-bold">1. Architecture:</span> Microservices with Redis caching and Kafka queue for high-throughput messaging...
                    </p>
                  </div>
                </div>

                {/* Who uses grid */}
                <div className="glass-card p-5 border border-purple-500/15">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Targeted For</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { emoji: '🎓', label: 'Freshers & Campus' },
                      { emoji: '💼', label: 'Senior Role Switches' },
                      { emoji: '👨‍💻', label: 'Coding & LeetCode' },
                      { emoji: '🏆', label: 'Career Transition' },
                    ].map((u) => (
                      <div key={u.label} className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                        <span className="text-base">{u.emoji}</span>
                        <span className="text-xs font-medium text-slate-300">{u.label}</span>
                      </div>
                    ))}
                  </div>
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
        <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-4 sm:px-6">
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
                desc: 'Sign up in 30 seconds with Google — no credit card required. Get 25 AI answers every single day, free forever.',
                color: 'from-blue-500 to-indigo-500',
              },
              {
                num: '02',
                icon: '⬇',
                title: 'Install Desktop App',
                desc: 'Download for Windows or macOS. If your OS shows a security prompt, click "Run anyway" or "Open" — standard for brand-new desktop apps.',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                num: '03',
                icon: '🎯',
                title: 'Ace Your Interview',
                desc: 'Join Zoom, Meet, or Teams. The JavihAI overlay stays completely invisible to screen share while auto-detecting questions and streaming answers in 2s.',
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
          VIDEO TUTORIALS & INSTALLATION GUIDES
      ═══════════════════════════════════════════════════════════════ */}
      <section id="videos" className="section-py bg-slate-950/60 relative overflow-hidden">
        <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-label">🎬 Video Guides</div>
            <h2 className="section-heading mb-4">
              Watch <span className="text-gradient">JavihAI in Action</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              Step-by-step video tutorials and installation guides for Windows and macOS.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                id: 'QeZDYWtKnsY',
                title: 'Javih AI Tutorial Video',
                tag: '🚀 Full Walkthrough',
                desc: 'See how JavihAI works during live interview calls, screenshot problem solving, and Desi Mode.',
                url: 'https://www.youtube.com/watch?v=QeZDYWtKnsY',
              },
              {
                id: 'uEDFnlf1hiw',
                title: 'Windows Installation Guide',
                tag: '🪟 Windows Setup',
                desc: 'Step-by-step video guide to download, install, and configure JavihAI on Windows 10 & 11.',
                url: 'https://www.youtube.com/watch?v=uEDFnlf1hiw',
              },
              {
                id: 'LvCAOrlH8zs',
                title: 'Mac Installation Guide',
                tag: '🍎 macOS Setup',
                desc: 'Complete walkthrough for installing JavihAI on Mac, granting permissions, and launching.',
                url: 'https://www.youtube.com/watch?v=LvCAOrlH8zs',
              },
            ].map((v) => (
              <div key={v.id} className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-4 border border-white/5 group/player">
                    {activeVideo === v.id ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=1&playsinline=1`}
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveVideo(v.id)}
                        className="w-full h-full relative block text-left focus:outline-none group-hover/player:scale-105 transition-transform duration-300"
                        aria-label={`Play ${v.title}`}
                      >
                        {/* Thumbnail image */}
                        <img
                          src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                          alt={v.title}
                          className="w-full h-full object-cover opacity-80 group-hover/player:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 group-hover/player:bg-slate-950/20 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover/player:scale-110 transition-transform">
                            <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                    {v.tag}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {v.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    {v.desc}
                  </p>
                </div>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Watch on YouTube →
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a
              href="https://www.youtube.com/channel/UCWAJd9eDBp9foxfxroxQukA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-sm transition-all shadow-lg hover:scale-105"
            >
              <span>▶️</span> Subscribe to Javih AI Official YouTube Channel
            </a>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          WORLD-UNIQUE INNOVATIONS
      ═══════════════════════════════════════════════════════════════ */}
      <section id="world-first" className="section-py bg-slate-950/60 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="badge-glow inline-flex items-center gap-2 text-xs sm:text-sm font-semibold mb-4 px-4 py-1.5 rounded-full">
              🌍 World-Unique Innovations
            </div>
            <h2 className="section-heading mb-4">
              5 World-First Features <span className="text-gradient">You Won&apos;t Find Anywhere Else</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Pioneering technologies engineered from the ground up for zero-downtime, perfect camera eye contact, stealth system audio, and regional AI intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 laptop-sm:grid-cols-3 gap-6 sm:gap-8 mb-16">
            {[
              {
                icon: '⚡',
                title: 'Zero-Downtime Live 13-Model Engine',
                tag: 'World First',
                desc: 'Auto-queries Groq’s active API catalog live and self-heals model deprecations in under 100ms across 13 LLMs & vision models.',
                gradient: 'from-blue-500 to-indigo-500',
              },
              {
                icon: '📷',
                title: 'Camera-Dock Stealth Teleprompter',
                tag: 'World First',
                desc: 'Top-center camera dock stays right under your lens for natural eye contact, featuring 11px–22px font zoom & 1-Min/STAR format chips.',
                gradient: 'from-indigo-500 to-purple-500',
              },
              {
                icon: '🎧',
                title: 'Native System Audio Capture',
                tag: 'Exclusive',
                desc: 'Captures the interviewer’s voice directly out of the speaker pipeline — works even when your mic is off or headphones are plugged in.',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: '🇮🇳',
                title: '₹ LPA Desi Mode & 10+ Languages',
                tag: 'India First',
                desc: 'Tuned specifically for Indian tech hiring: CTC in ₹ LPA, notice period & bond clauses, plus live streaming in 10+ regional languages.',
                gradient: 'from-orange-500 to-red-500',
              },
              {
                icon: '📄',
                title: 'Universal Multi-Format Resume Parser',
                tag: 'All Formats',
                desc: 'Drag & drop parsing for .pdf, .docx, .doc, .rtf, .txt, and .md with auto-extracted skills, target roles, and character statistics.',
                gradient: 'from-teal-500 to-emerald-500',
              },
            ].map((innov, i) => (
              <div key={i} className="glass-card p-6 sm:p-8 relative group hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${innov.gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {innov.icon}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    {innov.tag}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">{innov.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{innov.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES — BENTO GRID
      ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="section-py">
        <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-4 sm:px-6">
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
                icon: '⚡',
                title: 'Zero-Downtime Live Groq Engine',
                desc: 'Auto-healing model fallback across 13 live AI models (gpt-oss-20b, gpt-oss-120b, qwen3.8 vision). Zero downtime during model deprecations.',
                gradient: 'from-blue-500 to-indigo-500',
                badge: 'Live Auto-Sync',
                span: false,
              },
              {
                icon: '📷',
                title: 'Camera-Dock Teleprompter',
                desc: 'Top-center camera dock keeps natural eye contact during video calls. Features font size zoom (11px–22px) and quick 1-Min/STAR format chips.',
                gradient: 'from-indigo-500 to-purple-500',
                badge: 'New UI',
                span: false,
              },
              {
                icon: '📄',
                title: 'Universal Resume Verification',
                desc: 'Drag & drop parsing for PDF, DOCX, DOC, RTF, TXT, and MD. Auto-extracts technical skills, target roles, and character statistics.',
                gradient: 'from-purple-500 to-blue-500',
                badge: 'All Docs',
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
                icon: '🎧',
                title: 'System Audio & Stealth Overlay',
                desc: 'Hears the interviewer directly without a mic. OS-level DRM exclusion keeps overlay 100% invisible on Zoom, Google Meet & Teams.',
                gradient: 'from-orange-500 to-red-500',
                badge: 'Undetectable',
                span: false,
              },
              {
                icon: '🎙️',
                title: 'Interactive Guide & Soundwave HUD',
                desc: 'Simulated live meeting environment for new users with real-time voice soundwave graphics and guided feature walkthroughs.',
                gradient: 'from-blue-500 to-green-500',
                badge: 'Guide Mode',
                span: false,
              },
              {
                icon: '🔗',
                title: 'Job URL Auto-fill',
                desc: 'Paste a LinkedIn, Naukri, Indeed, or Glassdoor job link — JavihAI fetches the JD and fills your profile instantly.',
                gradient: 'from-sky-500 to-blue-500',
                badge: null,
                span: false,
              },
              {
                icon: '🇮🇳',
                title: 'Desi Mode & 10+ Languages',
                desc: 'Answers in ₹ LPA, notice period and bond clause context, company culture for Indian MNCs & startups, plus 10+ regional languages.',
                gradient: 'from-violet-500 to-purple-500',
                badge: 'Desi Mode',
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
        <div className="max-w-6xl desktop:max-w-[1320px] desktop-lg:max-w-[1480px] mx-auto px-4 sm:px-6">
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

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/resume" className="card card-glow group block">
              <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center text-2xl mb-5 bg-gradient-to-br from-blue-500 to-indigo-500 group-hover:scale-110 transition-bounce shadow-lg">
                📄
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Free ATS Resume Builder</h3>
              <p className="text-slate-400 leading-relaxed text-sm mb-4">
                ATS-ready templates, live preview, multi-format export — all in your browser. Build your professional resume in minutes.
              </p>
              <span className="text-indigo-400 text-sm font-semibold group-hover:text-indigo-300">Build your resume free →</span>
            </Link>

            <Link href="/jobs" className="card card-glow group block">
              <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center text-2xl mb-5 bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:scale-110 transition-bounce shadow-lg">
                💼
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Tech Job Finder</h3>
              <p className="text-slate-400 leading-relaxed text-sm mb-4">
                Curated tech roles across India — search by role, tech stack, or city, then practice for any specific job description with JavihAI.
              </p>
              <span className="text-indigo-400 text-sm font-semibold group-hover:text-indigo-300">Browse open tech jobs →</span>
            </Link>
          </div>
        </div>
      </section>



      {/* ═══════════════════════════════════════════════════════════════
          DESI MODE SPOTLIGHT
      ═══════════════════════════════════════════════════════════════ */}
      <section id="why" className="section-py bg-slate-950/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-4 sm:px-6 relative">
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

              <Link href="/indian-languages" className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 font-semibold mt-6">
                See all 9 languages →
              </Link>
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
        <div className="max-w-6xl desktop:max-w-[1320px] desktop-lg:max-w-[1480px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-label">⚖️ Compare</div>
            <h2 className="section-heading mb-4">
              JavihAI vs <span className="text-gradient">Every Other Tool</span>
            </h2>
            <p className="text-slate-400">India&apos;s first unlimited AI interview plan — priced for India, ~4× cheaper than the rest.</p>
          </div>

          <div className="glass-card overflow-hidden border-blue-500/10">
            {/* Scroll hint — the table needs horizontal scroll below the
                tablet tier (640px); it already fits without scrolling at
                tablet and up, so this fades out there too. */}
            <div className="tablet:hidden absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-950/90 to-transparent pointer-events-none z-10" />
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
                      <div className="text-slate-600 text-xs mt-0.5">~₹7,125/mo</div>
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
                        <td key={j} className={`px-4 py-3.5 text-center ${j === 0 ? 'bg-blue-500/5' : ''}`}>
                          <StatusBadge value={v} />
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
            <Link href="/compare/cluely" className="text-blue-400 hover:text-blue-300 underline">JavihAI vs Cluely →</Link>
            <Link href="/compare/lockedin-ai" className="text-blue-400 hover:text-blue-300 underline">JavihAI vs LockedIn AI →</Link>
            <Link href="/compare/interview-coder" className="text-blue-400 hover:text-blue-300 underline">JavihAI vs Interview Coder →</Link>
            <Link href="/compare/parakeet-ai" className="text-blue-400 hover:text-blue-300 underline">JavihAI vs Parakeet AI →</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <section id="reviews" className="section-py bg-slate-950/40">
        <div className="max-w-7xl desktop:max-w-[1440px] desktop-lg:max-w-[1600px] mx-auto px-4 sm:px-6">
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
        {/* No Product/AggregateRating JSON-LD here — removed 2026-09-11.
            It asserted a 2,400-review, 4.9-star aggregate that no real
            review-collection system backs (and that disagreed with a
            second, separate 4.8-star claim that used to live in
            app/layout.tsx's appSchema). Re-add only once there's a real,
            sourced review count to report. */}
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
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="glass-card cursor-pointer select-none hover:border-blue-500/20"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-white">{item.q}</h3>
                  <div className={`w-8 h-8 rounded-full glass flex items-center justify-center transition-bounce flex-shrink-0 ${openFaq === i ? 'rotate-180 gradient-primary' : ''}`}>
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 7.5l5 5 5-5" />
                    </svg>
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
            <WhatsAppIcon className="w-14 h-14 mb-4 mx-auto" />
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
              <WhatsAppIcon glyphOnly className="w-6 h-6" />
              Join WhatsApp Group
            </a>
            <p className="text-sm text-slate-500 mt-4">💡 Free to join. No spam. Real community building.</p>
          </div>

          {/* Social links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { platform: 'Twitter / X', handle: '@Javih_ai', href: 'https://x.com/Javih_ai', icon: '𝕏', desc: 'Daily interview tips & hot takes', color: 'from-slate-800 to-slate-900', border: 'border-slate-700/50' },
              { platform: 'LinkedIn', handle: 'javih-ai', href: 'https://www.linkedin.com/in/javih-ai/', icon: '💼', desc: 'Career advice & success stories', color: 'from-blue-950 to-slate-900', border: 'border-blue-800/30' },
              { platform: 'Instagram', handle: '@javih.ai', href: 'https://www.instagram.com/javih.ai/', icon: '📸', desc: 'App demos & interview reels', color: 'from-pink-950 to-slate-900', border: 'border-pink-800/30' },
              { platform: 'YouTube', handle: 'Javih AI', href: 'https://www.youtube.com/channel/UCWAJd9eDBp9foxfxroxQukA', icon: '▶️', desc: 'Watch product demos & interview guides', color: 'from-red-950 to-slate-900', border: 'border-red-800/30' },
            ].map((s) => (
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
            ))}
          </div>

          <p className="text-slate-600 text-sm">
            Join candidates already part of the community · New content every day
          </p>
        </div>
      </section>

      <Footer />

      <NewCustomerOfferPopup />
      <FreeTrialModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />
      <GoogleSignInModal open={showSignIn} onClose={cancelSignIn} onSignedIn={handleSignedIn} />
      <DownloadStepsModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        os={downloadModalOS}
        onSwitchOS={setDownloadModalOS}
        downloadUrl={retryUrl(downloadModalOS)}
      />
    </>
  );
}
