import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { verifyIdToken, getUserPlan, dayKey, db } from '@/lib/firebase-admin';

const FREE_MOCK_SESSIONS_PER_DAY = 1;
const QUESTION_COUNT = 5;

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
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

async function generateQuestion(profile: Profile | undefined, askedQuestions: string[]): Promise<string> {
  const role = profile?.targetRole?.trim() || 'Software Engineer';
  const ctx = profileContext(profile);

  const prompt = `You are an experienced technical interviewer conducting a mock interview for a "${role}" candidate.

${ctx ? `Candidate context:\n${ctx}\n` : ''}
${askedQuestions.length ? `Questions already asked this session (do NOT repeat or closely rephrase any of these):\n${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
Generate exactly ONE new interview question for this candidate, grounded in their role/skills/job description when given. Mix question types across a session — technical, behavioral, and role-specific — and vary the angle each time so it doesn't feel scripted. Reply with ONLY the question text, no preamble, no numbering, no quotes.`;

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
      temperature: 0.95,
    });
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

  const body = await req.json() as {
    action: 'start' | 'answer';
    profile?: Profile;
    sessionId: string;
    askedQuestions?: string[];
    answer?: string;
    currentQuestion?: string;
    qIndex?: number;
    isLast?: boolean;
  };

  const role = body.profile?.targetRole?.trim() || 'Software Engineer';

  /* ── Start: check free session limit then generate first question ───────── */
  if (body.action === 'start') {
    const plan = await getUserPlan(user.uid);
    if (plan === 'free' && db) {
      try {
        const ref = db.collection('usage_tracking').doc(user.uid).collection('days').doc(dayKey());
        // Use a transaction so concurrent requests can't both pass the quota check
        // (read + increment are atomic — eliminates the TOCTOU race).
        const allowed = await db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          const sessionsToday = snap.exists ? (snap.data()?.mockSessions || 0) : 0;
          if (sessionsToday >= FREE_MOCK_SESSIONS_PER_DAY) return false;
          tx.set(ref, { mockSessions: sessionsToday + 1, lastUpdated: Date.now() }, { merge: true });
          return true;
        });
        if (!allowed) {
          return NextResponse.json(
            { error: 'Free plan allows 1 mock interview per day. Upgrade to Pro for unlimited sessions.' },
            { status: 429 }
          );
        }
      } catch { /* fail open */ }
    }

    const question = await generateQuestion(body.profile, []);
    return NextResponse.json({
      question: `👋 Welcome to your ${role} mock interview, based on your profile.\n\nI'll ask you ${QUESTION_COUNT} questions and score each answer. Speak your answer when ready.\n\n**Question 1:** ${question}`,
      firstQuestion: question,
    });
  }

  /* ── Answer: score + feedback + next (dynamically generated) question ──── */
  const { answer = '', currentQuestion = '', qIndex = 0, isLast = false, profile } = body;
  const askedQuestions = body.askedQuestions || [];

  const scorePrompt = `You are an expert technical interviewer evaluating a ${role} candidate.
${profileContext(profile) ? `\nCandidate context:\n${profileContext(profile)}\n` : ''}
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
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: scorePrompt }],
      max_tokens: 256,
      temperature: 0.3,
    });

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
    if (!isLast) {
      const nq = await generateQuestion(profile, [...askedQuestions, currentQuestion]);
      nextQuestion = `\n\n**Question ${qIndex + 2}:** ${nq}`;
      return NextResponse.json({ score, feedback: feedbackMsg, nextQuestion, nextQuestionRaw: nq });
    }

    return NextResponse.json({ score, feedback: feedbackMsg });
  } catch (err) {
    console.error('[mock-interview]', err);
    return NextResponse.json({ score: 60, feedback: 'Could not score this answer. Please try again.' });
  }
}
