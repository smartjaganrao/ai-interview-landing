import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { getPublishedPosts } from '@/lib/blog';

export const metadata = {
  title: 'Blog — Interview Prep Tips & Guides',
  description: 'Practical interview-prep guides, coding round strategies, and career advice for Indian freshers and working professionals — from the team behind JavihAI.',
  alternates: { canonical: 'https://javihai.in/blog' },
  openGraph: {
    title: 'JavihAI Blog — Interview Prep Tips & Guides',
    description: 'Practical interview-prep guides and career advice for Indian job seekers.',
  },
};

// Re-fetched from Firestore at most every 5 minutes so new/edited posts show
// up without a redeploy (mirrors the pattern in app/install/page.tsx).
export const revalidate = 300;

function formatDate(ts: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts(20);

  return (
    <>

      <section className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="badge mb-4">📝 Blog</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Interview Prep Tips &amp; Guides</h1>
          <p className="text-slate-400 mb-12 max-w-2xl">
            Practical, India-focused advice on cracking coding rounds, system design, and HR interviews —
            from the team behind JavihAI.
          </p>

          {posts.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-slate-400">No posts yet — check back soon.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card card-glow hover:border-indigo-500/40 transition-all group block overflow-hidden">
                  {post.coverImageUrl && (
                    <div className="relative w-full h-44 mb-4 -mx-6 -mt-6" style={{ width: 'calc(100% + 3rem)' }}>
                      <Image
                        src={post.coverImageUrl}
                        alt={post.coverImageAlt || post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mb-2">{formatDate(post.publishedAt || post.createdAt)}</div>
                  <h2 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-slate-400 text-sm mb-3">{post.excerpt}</p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
