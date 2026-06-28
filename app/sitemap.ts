import { MetadataRoute } from 'next';
import { getAllPublishedSlugs } from '@/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://javihai.in';
  const now = new Date();

  const blogSlugs = await getAllPublishedSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map(({ slug, updatedAt }) => ({
    url: `${base}/blog/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    { url: base,                                lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/mock-interview`,            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`,                      lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/install`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/resume`,                    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/jobs`,                      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/compare`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/compare/chiku-ai`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/compare/final-round-ai`,    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/compare/interview-coder`,   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacy`,                   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,                     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/refund`,                    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/creator`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...blogEntries,
  ];
}
