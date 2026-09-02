import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tech Jobs in India — Software Engineering & Product Roles',
  description:
    'Browse curated software engineering, product, and data roles at top Indian companies, MNCs, and startups. Updated weekly. Free to use.',
  keywords: [
    'tech jobs India', 'software engineer jobs India', 'IT jobs 2025', 'product manager jobs India',
    'startup jobs India', 'FAANG jobs India', 'MNC jobs India', 'remote jobs India tech',
  ],
  openGraph: {
    title: 'Tech Jobs in India — JavihAI Job Board',
    description:
      'Curated software engineering and product roles at top Indian companies, MNCs, and startups. Updated weekly.',
  },
  twitter: {
    title: 'Tech Jobs in India — JavihAI',
    description: 'Curated software engineering and product roles across India. Updated weekly.',
  },
  alternates: { canonical: 'https://javihai.in/jobs' },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
