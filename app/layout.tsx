import type { Metadata } from 'next';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CaptureAttribution from '@/components/CaptureAttribution';
import TawkChat from '@/components/TawkChat';

const BASE_URL = 'https://javihai.in';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'JavihAI — Real-Time AI Interview Copilot for India',
    template: '%s | JavihAI',
  },

  description:
    "India's AI interview copilot. Stealth overlay detects questions & answers in <2s. Free forever · Pro ₹499/mo · 15× cheaper than Final Round AI · 2,400+ users.",

  keywords: [
    'AI interview assistant India',
    'real-time interview AI',
    'interview copilot India',
    'JavihAI',
    'interview prep AI India',
    'Desi Mode interview AI',
    'FAANG interview prep India',
    'Final Round AI alternative India',
    'Chiku AI alternative',
    'stealth interview overlay',
    'AI mock interview free',
    'coding interview AI help',
    'system design interview AI',
    'technical interview assistant',
    'affordable AI interview tool India',
    'interview answer generator',
    'AI interview software Windows Mac',
    'online interview preparation India',
    'screen share invisible overlay',
    'IIT NIT interview prep',
  ],

  authors: [{ name: 'JavihAI', url: BASE_URL }],
  creator: 'JavihAI',
  publisher: 'JavihAI',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'JavihAI',
    title: 'JavihAI — Real-Time AI Interview Copilot for India',
    description:
      'Stealth desktop overlay that listens to your interview and generates structured AI answers in under 2 seconds. Free plan · Pro from ₹499/month · Used by 2,400+ candidates.',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'JavihAI — Real-Time AI Interview Copilot',
        type: 'image/svg+xml',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@javihai',
    creator: '@javihai',
    title: 'JavihAI — Real-Time AI Interview Copilot for India',
    description:
      'Stealth overlay that hears your interview and generates answers in under 2 seconds. Free plan · ₹499/month Pro. 2,400+ candidates helped.',
    images: ['/logo.svg'],
  },

  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }],
    apple: '/logo.svg',
  },

  alternates: {
    canonical: BASE_URL,
  },

  verification: {
    google: 'cxMZqVzYT1n--iUdqFpiBEXZItuOYGVtlwDZD1wsNpk',
  },
};

// JSON-LD: WebSite (enables Google Sitelinks search box)
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'JavihAI',
  url: BASE_URL,
  description: "India's real-time AI interview copilot — free plan, stealth overlay, Desi Mode.",
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/jobs?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

// JSON-LD: Organization
const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JavihAI',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.svg`,
  description:
    'Real-time AI interview copilot for India — stealth desktop overlay with instant AI answers, Desi Mode, and mock interviews.',
  foundingDate: '2024',
  areaServed: 'IN',
  sameAs: [],
};

// JSON-LD: SoftwareApplication
const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'JavihAI',
  operatingSystem: 'Windows 10, Windows 11, macOS',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Interview Preparation',
  url: BASE_URL,
  description:
    'A stealth desktop overlay that listens to your interview, detects questions, and generates structured AI answers in under 2 seconds.',
  inLanguage: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa'],
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'INR',
      description: '10 AI answers per day, no time limit',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '499',
      priceCurrency: 'INR',
      description: 'Unlimited AI answers, priority support',
    },
    {
      '@type': 'Offer',
      name: 'Power',
      price: '999',
      priceCurrency: 'INR',
      description: 'Unlimited AI answers with priority AI models',
    },
  ],
  author: { '@type': 'Organization', name: 'JavihAI', url: BASE_URL },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '2400',
    bestRating: '5',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <CaptureAttribution />
        <TawkChat />
        <div className="bg-gradient-mesh bg-grid min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
