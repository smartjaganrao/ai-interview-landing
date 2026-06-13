import type { Metadata } from 'next';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'JavihAI — Master Interviews with AI',
  description: 'Real-time AI-powered interview prep with voice analysis, smart feedback, and instant insights. Used by 10,000+ candidates worldwide.',
  keywords: 'AI interview prep, interview practice, coding interview, AI feedback, voice analysis',
  openGraph: {
    title: 'JavihAI — Master Interviews with AI',
    description: 'Real-time AI-powered interview prep with instant feedback',
    type: 'website',
    url: 'https://javihai.in',
    images: [{ url: 'https://javihai.in/logo.svg', width: 800, height: 400, alt: 'JavihAI' }],
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  metadataBase: new URL('https://javihai.in'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GoogleAnalytics />
        <div className="bg-gradient-mesh bg-grid min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
