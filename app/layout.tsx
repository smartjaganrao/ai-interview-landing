import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CaptureAttribution from '@/components/CaptureAttribution';
import WhatsAppButton from '@/components/WhatsAppButton';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const BASE_URL = 'https://javihai.in';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "JavihAI — India's First Unlimited AI Interview Copilot | ₹499/mo | 100% Invisible",
    template: '%s | JavihAI',
  },

  description:
    "India's first unlimited AI interview copilot at ₹499/mo — 100% invisible on Zoom, Meet & Teams. Built for freshers & working professionals. Hears your interviewer & answers in <2s. Free forever. 15× cheaper than Final Round AI. 7-day money-back guarantee. Trusted by 2,400+ candidates at Google, Microsoft, Flipkart & more.",

  keywords: [
    // High-intent India-specific
    'AI interview assistant India',
    'AI interview copilot India',
    'real-time interview AI India',
    'interview copilot India free',
    'best AI interview tool India',
    'AI interview help India',
    'interview AI India',
    'interview preparation AI India',

    // "First unlimited at ₹499" positioning
    "India's first unlimited AI interview tool",
    'unlimited AI interview answers India',
    'unlimited interview copilot ₹499',
    'unlimited AI interview assistant cheap',

    // Stealth / undetectable angle (high search volume)
    'undetectable AI interview tool',
    'stealth AI interview assistant',
    '100% invisible AI interview tool',
    'AI interview overlay',
    'invisible interview assistant',
    'screen share invisible AI overlay',
    'AI interview tool undetectable zoom',

    // Competitor alternatives (people comparing)
    'Final Round AI alternative India',
    'Final Round AI alternative free',
    'Chiku AI alternative',
    'Cluely alternative India',
    'LockedIn AI alternative India',
    'Parakeet AI alternative',
    'cheaper than Final Round AI',

    // Role-specific keywords
    'technical interview AI assistant',
    'coding interview AI help',
    'system design interview AI',
    'behavioral interview AI',
    'software engineer interview prep AI',
    'FAANG interview preparation India',
    'product manager interview AI',

    // Feature keywords
    'AI mock interview free India',
    'AI interview answer generator',
    'real-time interview answers',
    'interview answer generator AI',
    'AI resume interview prep',
    'job interview AI tool',
    'desktop interview AI app',
    'AI interview software Windows Mac',

    // India market + cheapest + audience
    'interview prep India free',
    'Naukri interview preparation',
    'Desi Mode interview AI',
    'IIT NIT interview prep AI',
    'Flipkart Google Amazon interview India',
    'affordable AI interview tool India',
    'INR interview AI tool',
    'interview AI tool Hindi Tamil Telugu',
    "India's cheapest AI interview tool",
    'cheapest AI interview copilot India',
    'low cost AI interview assistant India',
    'AI interview tool for freshers India',
    'AI interview tool for freshers free',
    'best AI interview tool freshers',
    'fresher interview prep AI',
    'first job interview AI tool',
    'campus placement AI assistant',
    'AI interview tool for working professionals',
    'job switch interview AI India',
    'interview prep for experienced professionals',
    'career change interview AI',

    // Coding rounds
    'AI for HackerRank coding round',
    'AI for LeetCode interview',
    'coding round AI assistant India',
    'HackerRank AI solver',
    'LeetCode AI helper India',
    'CodeSignal AI assistant',
    'coding interview AI tool India',
    'crack coding round AI',
    'online assessment AI helper',
    'OA round AI tool India',

    // "Smartest & most affordable" positioning
    "India's smartest AI interview copilot",
    'smartest AI interview assistant India',
    'best value AI interview tool India',
    'most affordable AI interview copilot',
    'smart and cheap AI interview tool India',
    'top AI interview copilot India',

    // Brand
    'JavihAI',
    'javihai interview',
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
    title: "JavihAI — India's First Unlimited AI Interview Copilot | ₹499/mo | 100% Invisible",
    description:
      "India's first unlimited AI interview copilot at ₹499/mo — 100% invisible on Zoom, Meet & Teams. Free forever · 15× cheaper than Final Round AI · 7-day money-back · 2,400+ helped.",
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'JavihAI — Real-Time AI Interview Copilot',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@javihai',
    creator: '@javihai',
    title: "JavihAI — India's First Unlimited AI Interview Tool | ₹499/mo | 100% Invisible",
    description:
      "India's first unlimited AI interview copilot. Free for freshers, ₹499/mo for unlimited, 100% invisible overlay. 2,400+ candidates hired at Google, Flipkart, Amazon India.",
    images: ['/og-home.png'],
  },

  icons: {
    icon: [
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',

  alternates: {
    canonical: BASE_URL,
    languages: {
      en: BASE_URL,
      hi: `${BASE_URL}/hi`,
      ta: `${BASE_URL}/ta`,
      te: `${BASE_URL}/te`,
      kn: `${BASE_URL}/kn`,
      ml: `${BASE_URL}/ml`,
      bn: `${BASE_URL}/bn`,
      mr: `${BASE_URL}/mr`,
      gu: `${BASE_URL}/gu`,
      pa: `${BASE_URL}/pa`,
    },
  },

  verification: {
    google: ['cxMZqVzYT1n--iUdqFpiBEXZItuOYGVtlwDZD1wsNpk', 'emZMdvXk-Z2uYGmP2pr9zC1Mkg0v_UnNmzESpBo8mxA'],
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
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bangalore',
    addressRegion: 'Karnataka',
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@javihai.in',
    contactType: 'customer support',
    availableLanguage: ['English', 'Hindi', 'Tamil', 'Telugu'],
  },
  sameAs: [
    'https://twitter.com/javihai',
    'https://www.linkedin.com/company/javihai',
    'https://github.com/smartjaganrao/ai-interview-helper',
  ],
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

// JSON-LD: BreadcrumbList
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
  ],
};

const reviewSchema = [
  {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: 'JavihAI',
      applicationCategory: 'BusinessApplication',
    },
    author: {
      '@type': 'Person',
      name: 'Arjun S.',
    },
    datePublished: '2025-06-15',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    reviewBody:
      'I had a system design round at a product startup. Switched to System Audio mode — JavihAI caught the question and gave me a clean architecture answer before I could even panic. Got the offer.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: 'JavihAI',
      applicationCategory: 'BusinessApplication',
    },
    author: {
      '@type': 'Person',
      name: 'Priya M.',
    },
    datePublished: '2025-06-10',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    reviewBody:
      'The Desi Mode is underrated. It knows Indian salary ranges, notice period norms, bond clauses — things that global tools just blank out on. Feels like prep made for us.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: 'JavihAI',
      applicationCategory: 'BusinessApplication',
    },
    author: {
      '@type': 'Person',
      name: 'Karthik R.',
    },
    datePublished: '2025-05-28',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    reviewBody:
      'I was skeptical about using an AI tool during a real interview but the stealth overlay is genuinely invisible. Walked into my FAANG loop with way more confidence than before.',
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {reviewSchema.map((review, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(review) }}
          />
        ))}
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        <CaptureAttribution />
        <WhatsAppButton />
        <div className="bg-gradient-mesh bg-grid min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
