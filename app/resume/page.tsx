import ResumeClient from '@/components/ResumeClient';

// Server Component wrapper — this page had no data to fetch, but was still
// directly 'use client' as the route's own page.tsx with nothing server-side
// invoking it, so its static marketing copy (header, ATS tips) never shipped
// in server HTML either. Same fix as app/pricing/page.tsx: a thin Server
// Component here is enough to make the child's render happen server-side.
export default function Page() {
  return <ResumeClient />;
}
