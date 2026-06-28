/**
 * Server-only reads of admin-authored blog posts from Firestore. Mirrors the
 * shape of lib/github-release.ts — typed helpers, graceful empty/null returns
 * instead of throwing, used directly from server components (no API
 * round-trip needed since these only ever run server-side).
 */
import { db } from './firebase-admin';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  authorName: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
}

function toPost(id: string, data: FirebaseFirestore.DocumentData): BlogPost {
  return {
    id,
    title: data.title || '',
    slug: data.slug || '',
    excerpt: data.excerpt || '',
    contentHtml: data.contentHtml || '',
    coverImageUrl: data.coverImageUrl || null,
    coverImageAlt: data.coverImageAlt || '',
    seoTitle: data.seoTitle || '',
    seoDescription: data.seoDescription || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    authorName: data.authorName || 'JavihAI Team',
    published: data.published === true,
    createdAt: data.createdAt || 0,
    updatedAt: data.updatedAt || 0,
    publishedAt: data.publishedAt || null,
  };
}

/** Latest published posts, newest first. */
export async function getPublishedPosts(limit = 20): Promise<BlogPost[]> {
  if (!db) return [];
  try {
    const snap = await db.collection('blog_posts')
      .where('published', '==', true)
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => toPost(d.id, d.data()));
  } catch {
    return [];
  }
}

/** Single published post by slug, or null if missing/unpublished. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!db) return null;
  try {
    const snap = await db.collection('blog_posts').where('slug', '==', slug).limit(1).get();
    if (snap.empty) return null;
    const post = toPost(snap.docs[0].id, snap.docs[0].data());
    return post.published ? post : null;
  } catch {
    return null;
  }
}

/** All published slugs + their updatedAt — for generateStaticParams and the sitemap. */
export async function getAllPublishedSlugs(): Promise<{ slug: string; updatedAt: number }[]> {
  if (!db) return [];
  try {
    const snap = await db.collection('blog_posts').where('published', '==', true).get();
    return snap.docs.map((d) => ({ slug: d.data().slug || '', updatedAt: d.data().updatedAt || 0 })).filter((s) => s.slug);
  } catch {
    return [];
  }
}
