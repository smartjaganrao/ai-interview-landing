import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free AI Resume Builder — ATS-Friendly Templates, PDF Export',
  description:
    'Build a job-ready resume free with JavihAI — multiple ATS-friendly templates, instant PDF export, free account, no payment required. Built for Indian freshers and working professionals applying to tech roles.',
  keywords: [
    'free resume builder India', 'ATS resume builder free', 'AI resume builder India',
    'resume maker for freshers', 'PDF resume builder free', 'tech resume template India',
    'software engineer resume builder', 'ATS friendly resume template',
  ],
  openGraph: {
    title: 'Free AI Resume Builder — JavihAI',
    description:
      'Multiple ATS-friendly templates, instant PDF export, completely free. Built for Indian job seekers.',
  },
  twitter: {
    title: 'Free AI Resume Builder — JavihAI',
    description: 'ATS-friendly templates, instant PDF export, free account — no payment required.',
  },
  alternates: { canonical: 'https://www.javihai.in/resume' },
};

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
