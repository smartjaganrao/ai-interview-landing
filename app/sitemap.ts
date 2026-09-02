import { MetadataRoute } from 'next';
import { getAllPublishedSlugs } from '@/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // www.javihai.in 307-redirects to javihai.in (Vercel domain config) — the
  // sitemap must list the URL that actually serves 200, not the one that
  // redirects away from itself. See app/layout.tsx BASE_URL for the same fix.
  const base = 'https://javihai.in';
  const now = new Date();

  const blogSlugs = await getAllPublishedSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map(({ slug, updatedAt }) => ({
    url: `${base}/blog/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : now,
  }));

  // No lastModified on these — they're static marketing pages with no real
  // per-page "content changed at" signal. Claiming new Date() on every build
  // told Google every page "just changed" on every crawl, which per Google's
  // sitemap guidance teaches it to ignore lastmod entirely rather than help
  // it prioritize re-crawls. Omitting is valid per the sitemap spec; blog
  // entries below keep their real updatedAt, which is an honest signal.
  return [
    { url: base },
    { url: `${base}/about` },
    { url: `${base}/indian-languages` },
    { url: `${base}/pricing` },
    { url: `${base}/mock-interview` },
    { url: `${base}/blog` },
    { url: `${base}/install` },
    { url: `${base}/resume` },
    { url: `${base}/jobs` },
    { url: `${base}/compare` },
    { url: `${base}/compare/chiku-ai` },
    { url: `${base}/compare/final-round-ai` },
    { url: `${base}/compare/interview-coder` },
    { url: `${base}/compare/cluely` },
    { url: `${base}/compare/lockedin-ai` },
    { url: `${base}/compare/parakeet-ai` },
    { url: `${base}/privacy` },
    { url: `${base}/terms` },
    { url: `${base}/refund` },
    // /creator deliberately not listed — it's a client-side auth-gated
    // account page (redirects anonymous visitors to /auth/login and
    // renders only a loading state until authenticated), same category
    // as /dashboard. Nothing here for a crawler to actually index.
    ...blogEntries,
  ];
}
