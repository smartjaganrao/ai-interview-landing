import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'groq-sdk/resources/chat/completions';
import { verifyIdToken, getUserPlan, dayKey, db } from '@/lib/firebase-admin';

const FREE_MOCK_SESSIONS_PER_DAY = 1;
// Open-ended session — the candidate ends it themselves (no fixed question
// count). This cap is just a cost/abuse safety net, not a target length.
const MAX_QUESTIONS = 15;

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  easy: 'Ask foundational, junior-friendly questions — definitions, straightforward "explain X" or "describe a time you did Y" questions. Avoid multi-part or deeply technical trick questions.',
  medium: 'Ask mid-level questions that require some depth — trade-offs, "how would you approach X", debugging scenarios, or behavioral questions with follow-up nuance.',
  hard: 'Ask senior-level, challenging questions — system design, deep technical trade-offs, edge cases, ambiguous/open-ended problems, or questions that probe judgment under pressure.',
};

// Groq deprecates model IDs without warning (e.g. llama-3.1-8b-instant
// vanished 2026-08) — tried in order after the requested model 404s with
// "model_not_found" instead of falling through to the canned default.
const FALLBACK_MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'groq/compound-mini'];

function isModelNotFoundError(err: unknown): boolean {
  const e = err as { status?: number; error?: { error?: { code?: string } } };
  return e?.status === 404 && e?.error?.error?.code === 'model_not_found';
}

async function createChatCompletionWithFallback(
  groq: Groq,
  params: Omit<ChatCompletionCreateParamsNonStreaming, 'model'>,
  preferredModel: string,
) {
  const candidates = [preferredModel, ...FALLBACK_MODELS.filter(m => m !== preferredModel)];
  let lastErr: unknown;
  for (const model of candidates) {
    try {
      return await groq.chat.completions.create({ ...params, model });
    } catch (err) {
      lastErr = err;
      if (!isModelNotFoundError(err)) throw err;
      console.warn(`[mock-interview] Model "${model}" no longer exists, trying next fallback...`);
    }
  }
  throw lastErr;
}

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
  // Explicit short timeout + no retries: the SDK default is a 60s timeout
  // THAT IS RETRIED (per the SDK's own docs), so a single stalled Groq
  // request could silently chain past 100s+ before settling. Both call
  // sites below already have a try/catch that falls back to a safe
  // default (a canned question, or a 60/100 default score) the instant
  // this throws, so failing fast here is strictly better than hanging —
  // it's what let a handful of requests silently ride all the way to
  // Vercel's 300s hard function timeout (confirmed via production runtime
  // errors: "Task timed out after 300 seconds" on this exact route).
  return new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 10_000, maxRetries: 0 });
}

interface Profile {
  targetRole?: string;
  jobDescription?: string;
  skills?: string;
  companyType?: string;
}

function profileContext(profile: Profile | undefined): string {
  if (!profile) return '';
  const lines: string[] = [];
  if (profile.targetRole) lines.push(`Target role: ${profile.targetRole}`);
  if (profile.skills?.trim()) lines.push(`Skills: ${profile.skills.trim()}`);
  if (profile.companyType) lines.push(`Target company type: ${profile.companyType}`);
  if (profile.jobDescription) lines.push(`Job description excerpt: ${profile.jobDescription.slice(0, 800)}`);
  return lines.join('\n');
}

async function generateQuestion(
  profile: Profile | undefined,
  askedQuestions: string[],
  difficulty: Difficulty = 'medium'
): Promise<string> {
  const role = profile?.targetRole?.trim() || 'Software Engineer';
  const ctx = profileContext(profile);
  const hasJD = !!profile?.jobDescription?.trim();

  const prompt = `You are an experienced technical interviewer conducting a mock interview for a "${role}" candidate.

${ctx ? `Candidate context:\n${ctx}\n` : ''}
${askedQuestions.length ? `Questions already asked this session (do NOT repeat or closely rephrase any of these):\n${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
Difficulty level: ${difficulty.toUpperCase()}. ${DIFFICULTY_GUIDE[difficulty]}

${hasJD
    ? 'The job description above is the PRIMARY source for this question — pick a specific responsibility, requirement, technology, or skill mentioned in it and ask the candidate directly about their experience with that exact thing. Do not ask a generic question if the job description gives you something specific to ask about instead.'
    : 'No job description was provided — base the question on the candidate\'s target role and skills.'}
Generate exactly ONE new interview question at the difficulty level given above. Mix question types across a session — technical, behavioral, and role-specific — and vary the angle each time so it doesn't feel scripted. Reply with ONLY the question text, no preamble, no numbering, no quotes.`;

  try {
    const completion = await createChatCompletionWithFallback(
      getGroq(),
      { messages: [{ role: 'user', content: prompt }], max_tokens: 120, temperature: 0.95 },
      'openai/gpt-oss-20b',
    );
    const q = completion.choices[0]?.message?.content?.trim();
    if (q) return q.replace(/^["']|["']$/g, '');
  } catch (err) {
    console.error('[mock-interview] question generation failed:', err);
  }
  return `Tell me about a project where you used your skills as a ${role}.`;
}

export async function POST(req: NextRequest) {
  // Require authentication
  const idToken = req.headers.get('X-Firebase-Token') || '';
  if (!idToken) {
    return NextResponse.json({ error: 'Sign in to use mock interviews.' }, { status: 401 });
  }
  const user = await verifyIdToken(idToken);
  if (!user) {
    return NextResponse.json({ error: 'Invalid session. Please sign in again.' }, { status: 401 });
  }

  // The admin panel's "Ban User" button only ever set users/{uid}.status —
  // nothing here previously read it, so a banned user could still run full
  // mock interview sessions. Checked once for both actions.
  if (db) {
    try {
      const u = await db.collection('users').doc(user.uid).get();
      if (u.data()?.status === 'banned') {
        return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
      }
    } catch { /* fail open on read error */ }
  }

  const body = await req.json() as {
    action: 'start' | 'answer';
    profile?: Profile;
    difficulty?: Difficulty;
    sessionId: string;
    askedQuestions?: string[];
    answer?: string;
    currentQuestion?: string;
    qIndex?: number;
    isLast?: boolean;
  };

  const role = body.profile?.targetRole?.trim() || 'Software Engineer';
  const difficulty: Difficulty = body.difficulty && body.difficulty in DIFFICULTY_GUIDE ? body.difficulty : 'medium';

  /* ── Start: mock interview is a Power-only feature. Free users get 1 free
   *     session/day as a trial; Quick Pass and Pro users get none. ─────────── */
  if (body.action === 'start') {
    const plan = await getUserPlan(user.uid);
    if (plan !== 'power' && db) {
      if (plan === 'free') {
        try {
          const ref = db.collection('usage_tracking').doc(user.uid).collection('days').doc(dayKey());
          const allowed = await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const sessionsToday = snap.exists ? (snap.data()?.mockSessions || 0) : 0;
            if (sessionsToday >= FREE_MOCK_SESSIONS_PER_DAY) return false;
            tx.set(ref, { mockSessions: sessionsToday + 1, lastUpdated: Date.now() }, { merge: true });
            return true;
          });
          if (!allowed) {
            return NextResponse.json(
              { error: 'Free plan allows 1 mock interview per day. Upgrade to Power for unlimited sessions.' },
              { status: 429 }
            );
          }
        } catch { /* fail open */ }
      } else {
        return NextResponse.json(
          { error: 'AI Mock Interview is a Power plan feature. Upgrade to Power to access unlimited mock interviews with scoring and evaluation.' },
          { status: 403 }
        );
      }
    }

    const question = await generateQuestion(body.profile, [], difficulty);
    return NextResponse.json({
      question: `👋 Welcome to your ${role} mock interview, based on your profile (${difficulty} difficulty).\n\nI'll keep asking questions until you end the session. Speak your answer when ready.\n\n**Question 1:** ${question}`,
      firstQuestion: question,
    });
  }

  /* ── Answer: score + feedback + next (dynamically generated) question ──── */
  const { answer = '', currentQuestion = '', qIndex = 0, isLast = false, profile } = body;
  const askedQuestions = body.askedQuestions || [];
  // Hard safety cap regardless of what the client sends — open-ended sessions
  // still need a ceiling so a stuck client can't loop forever on the AI quota.
  const effectiveIsLast = isLast || qIndex + 1 >= MAX_QUESTIONS;

  const scorePrompt = `You are an expert technical interviewer evaluating a ${role} candidate.
${profileContext(profile) ? `\nCandidate context:\n${profileContext(profile)}\n\nWeigh the answer against the job description and skills above where relevant — an answer that demonstrates the specific tech/responsibilities mentioned there should score higher than an equally articulate but generic one.\n` : ''}
Question asked: "${currentQuestion}"
Candidate's spoken answer (transcribed from voice, may contain minor transcription errors — judge the substance, not phrasing): "${answer}"

Evaluate the answer and respond in this EXACT JSON format (no markdown, no extra text):
{
  "score": <number 0-100>,
  "feedback": "<2-3 sentences: what was good, what was missing, one specific improvement tip>"
}

Scoring guide:
- 90-100: Outstanding — specific, structured, shows deep expertise
- 70-89: Good — solid answer, minor gaps
- 50-69: Average — relevant but shallow or missing key points
- 0-49: Needs work — off-topic, too vague, or missing fundamentals`;

  try {
    const completion = await createChatCompletionWithFallback(
      getGroq(),
      { messages: [{ role: 'user', content: scorePrompt }], max_tokens: 256, temperature: 0.3 },
      'openai/gpt-oss-20b',
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    let score = 65;
    let feedback = 'Good attempt. Be more specific with examples and quantify your impact where possible.';

    try {
      const parsed = JSON.parse(raw) as { score: number; feedback: string };
      score    = Math.max(0, Math.min(100, parsed.score));
      feedback = parsed.feedback;
    } catch {
      // extract score from raw text as fallback
      const m = raw.match(/"score"\s*:\s*(\d+)/);
      if (m) score = parseInt(m[1]);
      const f = raw.match(/"feedback"\s*:\s*"([^"]+)"/);
      if (f) feedback = f[1];
    }

    const feedbackMsg = `**Feedback (${score}/100):** ${feedback}`;

    let nextQuestion: string | undefined;
    if (!effectiveIsLast) {
      const nq = await generateQuestion(profile, [...askedQuestions, currentQuestion], difficulty);
      nextQuestion = `\n\n**Question ${qIndex + 2}:** ${nq}`;
      return NextResponse.json({ score, feedback: feedbackMsg, nextQuestion, nextQuestionRaw: nq });
    }

    return NextResponse.json({ score, feedback: feedbackMsg });
  } catch (err) {
    console.error('[mock-interview]', err);
    return NextResponse.json({ score: 60, feedback: 'Could not score this answer. Please try again.' });
  }
}
