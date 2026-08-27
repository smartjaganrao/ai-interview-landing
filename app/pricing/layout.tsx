import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Free, Pro & Power Plans',
  description:
    'JavihAI pricing: Free plan available, Pro and Power plans for unlimited use. 7-day money-back guarantee. Cancel anytime.',
  keywords: [
    'JavihAI pricing', 'AI interview tool price India', 'affordable interview AI',
    'interview prep subscription India', 'Final Round AI cheaper alternative',
  ],
  openGraph: {
    title: 'JavihAI Pricing — Free, Pro & Power Plans',
    description:
      'Free plan available. Pro and Power plans for unlimited use. 7-day money-back guarantee. Cancel anytime.',
  },
  twitter: {
    title: 'JavihAI Pricing — Free, Pro & Power',
    description: 'Free plan available. Pro and Power plans with 7-day refund.',
  },
  alternates: { canonical: 'https://www.javihai.in/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
