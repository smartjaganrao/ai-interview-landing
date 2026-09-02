import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free AI Mock Interview — Practice Technical & HR Rounds',
  description:
    'Practice real interview questions with JavihAI\'s AI interviewer. Role-specific questions for software engineers, PMs, and more. Get instant scoring and feedback. Free to use — no sign-up required to try.',
  keywords: [
    'free AI mock interview', 'AI interview practice India', 'technical interview practice',
    'coding interview simulator', 'HR round practice AI', 'system design mock interview',
    'software engineer interview prep', 'AI interview feedback India',
  ],
  openGraph: {
    title: 'Free AI Mock Interview Practice — JavihAI',
    description:
      'Practice technical and HR interview rounds with an AI interviewer. Role-specific questions, instant scoring, and detailed feedback. Free.',
  },
  twitter: {
    title: 'Free AI Mock Interview — JavihAI',
    description: 'Practice real interview rounds with an AI interviewer. Instant feedback and scoring.',
  },
  alternates: { canonical: 'https://javihai.in/mock-interview' },
};

export default function MockInterviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
