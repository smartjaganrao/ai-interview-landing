import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CaptureAttribution from '@/components/CaptureAttribution';
import WhatsAppButton from '@/components/WhatsAppButton';
import Navbar from '@/components/Navbar';
import { ReduxProvider } from '@/components/ReduxProvider';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

// The apex domain is what actually serves the site — www.javihai.in
// 307-redirects to javihai.in at the Vercel domain level. Every canonical
// tag, OG url, and JSON-LD url needs to point at the URL that serves 200,
// not the one that immediately redirects away from itself.
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
    "India's first unlimited AI interview copilot — 100% invisible on Zoom, Meet & Teams. Built for freshers & working professionals. Hears your interviewer & answers in <2s. Free forever. ~4× cheaper than Final Round AI. 7-day money-back guarantee. Works in 9 Indian regional languages.",

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
      "India's first unlimited AI interview copilot — 100% invisible on Zoom, Meet & Teams. Free forever · ~4× cheaper than Final Round AI · 7-day money-back guarantee.",
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
      "India's first unlimited AI interview copilot. Free for freshers, 100% invisible overlay. Hears your interviewer and answers in under 2 seconds.",
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
    email: 'javihaiofficial@gmail.com',
    contactType: 'customer support',
    availableLanguage: ['English', 'Hindi', 'Tamil', 'Telugu'],
  },
  sameAs: [
    'https://twitter.com/javihai',
    'https://www.linkedin.com/company/javihai',
    'https://www.instagram.com/javih.ai/',
    'https://www.youtube.com/channel/UCWAJd9eDBp9foxfxroxQukA',
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
  // No aggregateRating here — there is no real review-collection system
  // backing a count yet, and asserting one Google can't verify is a
  // structured-data risk, not a trust signal. Add it back only once a real
  // count exists (see the matching removal in components/LandingClient.tsx).
};

// JSON-LD: BreadcrumbList
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
  ],
};

// Individual Review JSON-LD was removed from here (2026-09-11): it only
// covered 3 of the 6 testimonials shown on the homepage, using the exact
// same marketing copy as the visible cards rather than data from any real
// review-collection system — i.e. it wasn't machine-readable proof of
// anything beyond what LandingClient.tsx already renders visibly. Don't
// re-add Review/AggregateRating markup until there's an actual review
// pipeline (dated, sourced submissions) to generate it from.

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
