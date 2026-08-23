import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CaptureAttribution from '@/components/CaptureAttribution';
import WhatsAppButton from '@/components/WhatsAppButton';
import Navbar from '@/components/Navbar';
import { ReduxProvider } from '@/components/ReduxProvider';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const BASE_URL = 'https://javihai.in';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "JavihAI — India's First Unlimited AI Interview Copilot | 100% Invisible",
    template: '%s | JavihAI',
  },

  description:
    "India's first unlimited AI interview copilot — 100% invisible on Zoom, Meet & Teams. Built for freshers & working professionals. Hears your interviewer & answers in <2s. Free forever. 15× cheaper than Final Round AI. 7-day money-back guarantee. Trusted by 2,400+ candidates at Google, Microsoft, Flipkart & more.",

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
    title: "JavihAI — India's First Unlimited AI Interview Copilot | 100% Invisible",
    description:
      "India's first unlimited AI interview copilot — 100% invisible on Zoom, Meet & Teams. Free forever · 15× cheaper than Final Round AI · 7-day money-back · 2,400+ helped.",
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
    title: "JavihAI — India's First Unlimited AI Interview Tool | 100% Invisible",
    description:
      "India's first unlimited AI interview copilot. Free for freshers, 100% invisible overlay. 2,400+ candidates hired at Google, Flipkart, Amazon India.",
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
        <Navbar />
        <div className="bg-gradient-mesh bg-grid min-h-screen">
          <ReduxProvider>
            {children}
          </ReduxProvider>
        </div>
      </body>
    </html>
  );
}
