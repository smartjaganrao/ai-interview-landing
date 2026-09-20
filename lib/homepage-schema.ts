// Homepage FAQ content + JSON-LD, shared between app/page.tsx (a Server
// Component, so it can emit the <script> tags in the server-rendered HTML —
// Googlebot's second-wave JS render isn't guaranteed/fast, and most AI
// answer-engine crawlers render JS worse than Googlebot or not at all, so
// client-only JSON-LD is effectively invisible to them) and
// components/LandingClient.tsx (a Client Component, for the visible FAQ
// accordion). Keeping FAQ_ITEMS in one place prevents the schema from
// drifting out of sync with what's actually on the page (Google requires
// structured data to match visible content for FAQPage rich results).
//
// Trimmed from 18 to the 6 highest-value, least-duplicated questions for the
// 2026-09 homepage redesign (see the `nifty-mixing-kitten` plan) — the
// dropped items (DSA topic coverage, full competitor breakdown, full
// language list, freshers/campus framing, coding-platform support, resume
// formats) are already covered by dedicated pages (`/compare`,
// `/indian-languages`, `/dsa-topics`, `/programming-languages`) that carry
// their own on-page content and schema.
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How does JavihAI — the AI interview assistant — work during a live interview?',
    a: 'Run JavihAI alongside your video call (Zoom, Google Meet, Teams). Choose System Audio to hear the interviewer, or Microphone mode. JavihAI auto-detects when a question is asked and streams a structured AI answer in under 2 seconds — while staying completely invisible to screen sharing.',
  },
  {
    q: 'Is JavihAI visible to the interviewer during screen share?',
    a: 'No. The JavihAI window uses OS-level exclusion from screen capture on both Windows and Mac. The interviewer sees only your screen — not the overlay. It has been tested on Zoom, Google Meet, Microsoft Teams, and Webex.',
  },
  {
    q: 'How much does JavihAI cost? Is there a free plan?',
    a: 'JavihAI has a permanent free plan with up to 25 AI answers per day (5 screenshot solves, 10 system-audio answers, 10 mic answers) — no credit card, no time limit. Unlike other AI interview tools in India that give a one-time trial that runs out, JavihAI\'s free allowance resets every single day, forever, for every user. Paid plans unlock unlimited answers, Desi Mode, and more. Both paid plans include a 7-day money-back guarantee.',
  },
  {
    q: 'What platforms and operating systems does JavihAI support?',
    a: 'JavihAI supports Windows 10, Windows 11, and macOS — both Apple Silicon (M1/M2/M3) and Intel. The desktop app is required for real-time interview mode and works alongside Zoom, Google Meet, Microsoft Teams, and Webex.',
  },
  {
    q: 'How do I install JavihAI? My computer shows a security warning.',
    a: 'On Windows: run the .exe — if you see "Windows protected your PC", click More info → Run anyway. On Mac: drag to Applications, then right-click → Open → Open (or System Settings → Privacy & Security → Open Anyway). This is normal for new publishers and the app is completely safe.',
  },
  {
    q: 'What is Desi Mode?',
    a: 'Desi Mode is a Power-plan feature that adapts every AI answer to Indian interview culture: CTC in ₹ LPA (not USD), notice period and bond clause context, ESOP vs variable pay, and company-specific framing for FAANG India, product startups, MNCs, and IT services. It also enables answers in Hindi, Tamil, Telugu, Kannada, and other Indian languages.',
  },
];

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export const howToSchema = {
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
