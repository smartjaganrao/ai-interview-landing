import { getDynamicPricing } from '@/lib/firebase-admin';
import PricingClient from '@/components/PricingClient';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Quick Pass work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Quick Pass gives you 24 hours of full AI Interview Assistant access. It\'s a one-time purchase — no subscription, no auto-renewal. Perfect for interview day prep.',
      },
    },
    {
      '@type': 'Question',
      name: 'What\'s the difference between Quick Pass and Pro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Quick Pass is 24-hour one-time access. Pro is a longer unlimited pass and includes Resume Analysis and company-specific interview support. Both are one-time purchases with no subscription.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use JavihAI on Mac?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! JavihAI supports both Windows and Mac (Apple Silicon M1/M2/M3 and Intel). Download the appropriate version from our download page.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the overlay really invisible?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. JavihAI uses OS-level APIs to exclude itself from all screen captures. The interviewer sees only your screen, not the overlay, on Zoom, Google Meet, and Microsoft Teams.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is JavihAI different from Final Round AI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JavihAI is built for Indian interviews with Desi Mode (CTC in LPA, notice period, Indian company context), supports Hindi and regional languages, and is more affordable than alternatives.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I switch plans anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — upgrade anytime and it takes effect immediately. To downgrade, contact support and we\'ll handle it manually and prorate your billing.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a free trial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Start with our Free plan — limited AI usage, forever, no credit card required. We also offer a 7-day money-back guarantee on your first paid purchase.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods do you accept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept all major credit cards, debit cards, UPI, and net banking through our secure Razorpay integration.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer refunds?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we offer a 7-day money-back guarantee on your first payment. If you\'re not satisfied, contact support for a full refund.',
      },
    },
  ],
};

// Server Component (mirrors app/page.tsx's exact pattern for the same
// reason) — PricingClient is 'use client' and was previously *this* file's
// default export directly, with no server component anywhere above it to
// invoke it during the server render. Confirmed live via curl with a
// Googlebot UA (and a plain browser UA, and no UA at all — identical
// response, so this wasn't bot-specific cloaking): the entire page body
// was empty in the server HTML, no prices, no FAQ text, nothing — the
// client-only fetch (`useState<Pricing|null>(null)` + useEffect) meant
// zero SEO-critical content shipped until the browser ran JS. Wrapping
// PricingClient in a Server Component here that fetches real data and
// passes it as a prop fixes this the same way LandingClient already does
// for the homepage — the child client component still gets invoked (and
// therefore still produces real markup) because a Server Component is
// rendering it, not because it stopped being a client component.
// Forces real per-request SSR instead of Next.js's default static
// generation for this route. Without this, `getDynamicPricing()` still
// runs, but only ONCE, inside Next's build/ISR prerender sandbox — and
// confirmed live (both in a local `next build && next start` and on the
// actual deployed javihai.in homepage, which already used this same
// fetch-and-pass-as-prop pattern) that sandbox does not return real
// Firestore data the way a live serverless request does: the raw
// prerendered HTML had zero ₹ figures on both routes, while the ordinary
// `/api/pricing` route (already dynamic) returned correct numbers every
// time. `force-dynamic` makes this page render in that same live,
// working request context — the one `/api/pricing` already proves works
// — instead of the build sandbox. Trade-off: no CDN caching of the HTML
// shell, a fresh render per request — acceptable here since this is the
// literal page people decide whether to pay real money from; correctness
// matters more than shaving a render on a moderate-traffic route.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const pricing = await getDynamicPricing();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <PricingClient initialPricing={pricing} />
    </>
  );
}
