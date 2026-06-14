import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const QUESTION_BANK: Record<string, string[]> = {
  'Software Engineer': [
    'Tell me about yourself and your engineering background.',
    'Describe a technically challenging problem you solved. What was the approach and outcome?',
    'How do you ensure code quality in a fast-moving team?',
    'Explain how you would design a URL shortener like bit.ly.',
    'Tell me about a time you disagreed with a technical decision. How did you handle it?',
  ],
  'Frontend Engineer': [
    'Walk me through your frontend development experience.',
    'How do you optimize a React app that is rendering slowly?',
    'Explain the difference between SSR, SSG, and CSR. When would you use each?',
    'Describe how you would build an accessible, responsive navigation menu.',
    'Tell me about a complex UI feature you built from scratch.',
  ],
  'Backend Engineer': [
    'Tell me about your backend engineering background.',
    'How would you design a rate-limiting system for a public API?',
    'Explain database indexing and when you would use composite indexes.',
    'Describe how you handle database migrations without downtime.',
    'Tell me about a production incident you resolved. What did you learn?',
  ],
  'Full Stack Engineer': [
    'Walk me through a full-stack feature you built end-to-end.',
    'How do you decide where to put business logic — frontend, backend, or database?',
    'Describe your approach to API design.',
    'How do you manage state in a large React application?',
    'Tell me about a time you had to make a trade-off between frontend and backend performance.',
  ],
  'ML Engineer': [
    'Tell me about an ML model you built and deployed in production.',
    'How do you handle class imbalance in a classification problem?',
    'Explain the bias-variance trade-off with a real example.',
    'How would you monitor an ML model for data drift in production?',
    'Describe your experience with feature engineering.',
  ],
  'Data Engineer': [
    'Walk me through a data pipeline you built.',
    'How do you handle late-arriving data in a streaming pipeline?',
    'Explain the difference between a data lake and a data warehouse.',
    'How do you ensure data quality in your pipelines?',
    'Describe how you would build a real-time analytics system.',
  ],
  'DevOps Engineer': [
    'Tell me about your DevOps experience and the tools you use.',
    'How would you design a CI/CD pipeline for a microservices application?',
    'Explain how Kubernetes handles pod scheduling and resource limits.',
    'How do you approach incident management and post-mortems?',
    'Describe how you reduced infrastructure costs in a previous role.',
  ],
  'Product Manager': [
    'Tell me about a product you owned and its impact.',
    'How do you prioritize features when everything seems urgent?',
    'Describe how you gathered user insights and translated them into requirements.',
    'Tell me about a time a product launch didn\'t go as planned.',
    'How do you measure the success of a feature after launch?',
  ],
};

function getQuestions(role: string): string[] {
  return QUESTION_BANK[role] ?? QUESTION_BANK['Software Engineer'];
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    action: 'start' | 'answer';
    role: string;
    difficulty: string;
    sessionId: string;
    answer?: string;
    qIndex?: number;
    isLast?: boolean;
  };

  const questions = getQuestions(body.role);

  /* ── Start: return first question ──────────────────────────────────────── */
  if (body.action === 'start') {
    return NextResponse.json({ question: `👋 Welcome to your ${body.role} mock interview (${body.difficulty}).\n\nI'll ask you ${questions.length} questions and score each answer. Take your time.\n\n**Question 1:** ${questions[0]}` });
  }

  /* ── Answer: score + feedback + next question ──────────────────────────── */
  const { answer, qIndex = 0, isLast = false } = body;
  const currentQ = questions[qIndex] ?? questions[0];
  const nextQ    = !isLast ? questions[qIndex + 1] : null;

  const scorePrompt = `You are an expert technical interviewer evaluating a ${body.role} candidate (${body.difficulty} level).

Question asked: "${currentQ}"
Candidate's answer: "${answer}"

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
    const nextQuestion = nextQ ? `\n\n**Question ${qIndex + 2}:** ${nextQ}` : undefined;

    return NextResponse.json({ score, feedback: feedbackMsg, nextQuestion });
  } catch (err) {
    console.error('[mock-interview]', err);
    return NextResponse.json({ score: 60, feedback: 'Could not score this answer. Please try again.', nextQuestion: nextQ ? `**Question ${qIndex + 2}:** ${nextQ}` : undefined });
  }
}
