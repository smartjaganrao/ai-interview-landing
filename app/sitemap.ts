import { MetadataRoute } from 'next';
import { getAllPublishedSlugs } from '@/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://javihai.in';
  const now = new Date();

  const blogSlugs = await getAllPublishedSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map(({ slug, updatedAt }) => ({
    url: `${base}/blog/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : now,
  }));

  return [
    { url: base, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    { url: `${base}/pricing`, lastModified: now },
    { url: `${base}/mock-interview`, lastModified: now },
    { url: `${base}/blog`, lastModified: now },
    { url: `${base}/install`, lastModified: now },
    { url: `${base}/resume`, lastModified: now },
    { url: `${base}/jobs`, lastModified: now },
    { url: `${base}/compare`, lastModified: now },
    { url: `${base}/compare/chiku-ai`, lastModified: now },
    { url: `${base}/compare/final-round-ai`, lastModified: now },
    { url: `${base}/compare/interview-coder`, lastModified: now },
    { url: `${base}/compare/cluely`, lastModified: now },
    { url: `${base}/compare/lockedin-ai`, lastModified: now },
    { url: `${base}/compare/parakeet-ai`, lastModified: now },
    { url: `${base}/privacy`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
    { url: `${base}/refund`, lastModified: now },
    { url: `${base}/creator`, lastModified: now },
    ...blogEntries,
  ];
}
