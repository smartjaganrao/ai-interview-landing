import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Free, Pro & Power Plans',
  description:
    'JavihAI pricing: Free plan with 3 AI answers/day (no time limit), Pro at ₹499/month for unlimited use, Power at ₹999/month with priority AI models. 7-day money-back guarantee. 15× cheaper than Final Round AI.',
  keywords: [
    'JavihAI pricing', 'AI interview tool price India', 'affordable interview AI',
    'interview prep subscription India', 'Final Round AI cheaper alternative',
  ],
  openGraph: {
    title: 'JavihAI Pricing — Free, Pro & Power Plans',
    description:
      'Free plan available. Pro from ₹499/month. Power at ₹999/month. 7-day money-back guarantee. Cancel anytime.',
  },
  twitter: {
    title: 'JavihAI Pricing — Free, Pro & Power',
    description: 'Free plan with 3 answers/day. Pro ₹499/mo. Power ₹999/mo. 7-day refund.',
  },
  alternates: { canonical: 'https://javihai.in/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
