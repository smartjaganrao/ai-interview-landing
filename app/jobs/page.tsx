import { fetchJobs } from '@/lib/jobs';
import JobsClient from '@/components/JobsClient';

const jobBoardSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'JavihAI Job Recommendations',
  description: 'Top tech jobs in India curated for JavihAI users. Practice for any of these with your AI coach.',
  url: 'https://javihai.in/jobs',
};

// Server Component — fetches the default (unfiltered) job list server-side
// and renders JSON-LD here, same fix + rationale as app/pricing/page.tsx.
// Without this, both the job listings and the schema only ever existed
// after JobsClient's own client-side useEffect fetch ran.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { jobs } = await fetchJobs('', '');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobBoardSchema).replace(/</g, '\\u003c') }}
      />
      <JobsClient initialJobs={jobs} />
    </>
  );
}
