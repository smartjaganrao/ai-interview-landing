import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Interview Helper — Master Interviews with AI',
  description: 'Real-time AI-powered interview prep with voice analysis, smart feedback, and instant insights. Used by 10,000+ candidates worldwide.',
  keywords: 'AI interview prep, interview practice, coding interview, AI feedback, voice analysis',
  openGraph: {
    title: 'AI Interview Helper — Master Interviews with AI',
    description: 'Real-time AI-powered interview prep with instant feedback',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
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
        <div className="bg-gradient-mesh bg-grid min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
