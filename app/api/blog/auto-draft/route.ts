import { NextRequest, NextResponse } from 'next/server';
// Vercel Cron calls this daily (configured in vercel.json) to generate one
// fresh blog draft — never auto-published. Reuses /api/blog/generate's
// existing Groq prompt/logic rather than duplicating it; just adds topic
// rotation and the Firestore write on top.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdmin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!raw) throw new Error('FIREBASE_ADMIN_SDK_JSON not set');
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return getFirestore();
}

// Rotates through in order, one per day, wrapping around — tracked in
// _meta/blog_auto_draft.nextIndex so a redeploy doesn't reset progress.
const TOPIC_ANGLES = [
  'How to answer "Tell me about yourself" in an Indian tech interview',
  'System design interview prep for SDE-2 roles at Indian product companies',
  'How to negotiate CTC and variable pay in an Indian offer letter',
  'Common HR round questions at Indian IT services companies like TCS and Infosys',
  'How to prepare for a FAANG India onsite interview loop',
  'STAR method examples for behavioral interviews, for Indian freshers',
  'How to answer "why are you switching jobs" in an Indian interview',
  'Interview prep checklist for Indian campus placement season',
  'How notice period and bond clause questions come up in Indian HR rounds',
  'HackerRank vs LeetCode style coding rounds in Indian hiring',
  'Using AI interview tools ethically during a real interview',
  'What interview questions to expect at Indian product startups like Flipkart or Swiggy',
  'How to prepare for a remote interview vs an in-person one in India',
  'Common mistakes freshers make in their first tech interview',
  'How to stay calm and build confidence before a stressful interview',
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdmin();
    const stateRef = db.collection('_meta').doc('blog_auto_draft');
    const stateSnap = await stateRef.get();
    const idx = (stateSnap.data()?.nextIndex ?? 0) % TOPIC_ANGLES.length;
    const idea = TOPIC_ANGLES[idx];

    const genRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blog/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, tone: 'conversational but sharp', length: 'medium' }),
    });
    if (!genRes.ok) {
      const err = await genRes.json().catch(() => ({}));
      throw new Error(`generate failed: ${err.error || genRes.status}`);
    }
    const { post } = await genRes.json();

    // Dedup: if this exact slug already exists (e.g. topic repeated after a
    // full rotation), suffix with today's date rather than overwrite or skip.
    let slug = post.slug as string;
    const existing = await db.collection('blog_posts').where('slug', '==', slug).limit(1).get();
    if (!existing.empty) {
      slug = `${slug}-${new Date().toISOString().slice(0, 10)}`;
    }

    const now = Date.now();
    const ref = await db.collection('blog_posts').add({
      title: post.title,
      slug,
      excerpt: post.excerpt,
      contentHtml: post.contentHtml,
      coverImageUrl: '/og-home.png',
      coverImageAlt: post.title,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      tags: Array.isArray(post.tags) ? post.tags : [],
      authorName: 'JavihAI Team',
      published: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });

    await stateRef.set({ nextIndex: idx + 1, lastRunAt: now, lastIdea: idea }, { merge: true });

    return NextResponse.json({ ok: true, id: ref.id, slug, title: post.title, idea });
  } catch (err) {
    console.error('[blog/auto-draft] failed:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
