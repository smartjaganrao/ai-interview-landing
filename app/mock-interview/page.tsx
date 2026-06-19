'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ── Types ────────────────────────────────────────────────────────────────── */
type Phase = 'setup' | 'interview' | 'results';
type Role  = 'Software Engineer' | 'Frontend Engineer' | 'Backend Engineer' | 'Full Stack Engineer' | 'ML Engineer' | 'Data Engineer' | 'DevOps Engineer' | 'Product Manager';

interface Message { role: 'ai' | 'user'; text: string; score?: number; feedback?: string; }

const ROLES: Role[] = [
  'Software Engineer', 'Frontend Engineer', 'Backend Engineer',
  'Full Stack Engineer', 'ML Engineer', 'Data Engineer', 'DevOps Engineer', 'Product Manager',
];

const DIFFICULTIES = ['Junior (0–2 YOE)', 'Mid-level (2–5 YOE)', 'Senior (5+ YOE)'];

const QUESTION_COUNT = 5;

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function MockInterviewPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [phase,       setPhase]       = useState<Phase>('setup');
  const [role,        setRole]        = useState<Role>('Software Engineer');
  const [difficulty,  setDifficulty]  = useState(DIFFICULTIES[1]);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [answer,      setAnswer]      = useState('');
  const [loading,     setLoading]     = useState(false);
  const [qIndex,      setQIndex]      = useState(0);
  const [scores,      setScores]      = useState<number[]>([]);
  const [sessionId,   setSessionId]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ── Start interview ──────────────────────────────────────────────────── */
  const startInterview = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setLoading(true);
    const sid = Math.random().toString(36).slice(2, 9);
    setSessionId(sid);
    setMessages([]);
    setQIndex(0);
    setScores([]);

    try {
      const idToken = user ? await user.getIdToken() : '';
      const res  = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Firebase-Token': idToken },
        body: JSON.stringify({ action: 'start', role, difficulty, sessionId: sid }),
      });
      const data = await res.json() as { question?: string; error?: string };
      if (!res.ok) {
        setMessages([{ role: 'ai', text: data.error || 'Failed to start interview.' }]);
        setPhase('setup');
        return;
      }
      setMessages([{ role: 'ai', text: data.question! }]);
      setPhase('interview');
    } finally {
      setLoading(false);
    }
  };

  /* ── Submit answer ────────────────────────────────────────────────────── */
  const submitAnswer = async () => {
    if (!answer.trim() || loading) return;
    const userMsg = answer.trim();
    setAnswer('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const isLast = qIndex >= QUESTION_COUNT - 1;
      const res    = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', role, difficulty, sessionId, answer: userMsg, qIndex, isLast }),
      });
      const data = await res.json() as { score: number; feedback: string; nextQuestion?: string };

      const newScores = [...scores, data.score];
      setScores(newScores);

      setMessages(prev => [
        ...prev,
        { role: 'ai', text: data.feedback, score: data.score, feedback: data.feedback },
        ...(data.nextQuestion ? [{ role: 'ai' as const, text: data.nextQuestion }] : []),
      ]);

      if (isLast) {
        setPhase('results');
      } else {
        setQIndex(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg    = (s: number) => s >= 80 ? 'bg-green-500/10 border-green-500/30' : s >= 60 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center card max-w-md">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-3">Sign in to start a mock interview</h2>
            <p className="text-slate-400 mb-6">Practice with a real AI interviewer — get scored, get feedback, get hired.</p>
            <button onClick={() => router.push('/auth/login')} className="btn btn-primary w-full">Sign In with Google →</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-24 pb-20 max-w-3xl mx-auto px-4">

        {/* ── Setup ──────────────────────────────────────────────────────── */}
        {phase === 'setup' && (
          <div>
            <div className="text-center mb-10">
              <div className="badge mb-3">🎯 Mock Interview</div>
              <h1 className="text-4xl font-black mb-3">AI Mock Interview</h1>
              <p className="text-slate-400">Real questions. Real scoring. AI feedback after every answer.</p>
            </div>

            <div className="card mb-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Configure your session</h2>

              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-2">Target Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-all text-left ${
                        role === r ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs text-slate-400 mb-2">Experience Level</label>
                <div className="flex gap-2 flex-wrap">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        difficulty === d ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl mb-6 text-sm text-slate-400">
                <span>📋 {QUESTION_COUNT} questions</span>
                <span>•</span>
                <span>⏱ ~15 minutes</span>
                <span>•</span>
                <span>📊 Scored out of 100</span>
              </div>

              <button onClick={startInterview} disabled={loading} className="btn btn-primary w-full btn-lg">
                {loading ? 'Preparing questions…' : 'Start Mock Interview →'}
              </button>
            </div>

            {/* Tips */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">💡 Tips for best results</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Type your answer as you would speak it — full sentences work best</li>
                <li>• Use the STAR method for behavioral questions (Situation, Task, Action, Result)</li>
                <li>• Include specific numbers and outcomes when possible</li>
                <li>• Don't worry about length — quality over quantity</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Interview ──────────────────────────────────────────────────── */}
        {phase === 'interview' && (
          <div>
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-sm text-slate-400">{role} · {difficulty.split(' ')[0]}</span>
                <h2 className="font-bold text-white">Question {qIndex + 1} of {QUESTION_COUNT}</h2>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: QUESTION_COUNT }).map((_, i) => (
                  <div key={i} className={`w-8 h-2 rounded-full ${i < qIndex ? 'bg-green-500' : i === qIndex ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="card mb-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'ai'
                      ? 'bg-slate-800 text-slate-200 rounded-tl-sm'
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  }`}>
                    {msg.role === 'ai' && msg.score !== undefined && (
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border mb-2 ${scoreBg(msg.score)}`}>
                        <span className={scoreColor(msg.score)}>Score: {msg.score}/100</span>
                      </div>
                    )}
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Answer input */}
            {phase === 'interview' && qIndex < QUESTION_COUNT && (
              <div className="flex gap-3">
                <textarea
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Type your answer here… (be specific, use examples)"
                  rows={3}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAnswer(); }}
                  disabled={loading}
                />
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || loading}
                  className="btn btn-primary px-6 self-end disabled:opacity-40"
                >
                  Send →
                </button>
              </div>
            )}
            <p className="text-xs text-slate-600 mt-2 text-center">Press Cmd+Enter to submit</p>
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────────────── */}
        {phase === 'results' && (
          <div>
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{avgScore >= 80 ? '🏆' : avgScore >= 60 ? '💪' : '📈'}</div>
              <h1 className="text-4xl font-black mb-2">Interview Complete!</h1>
              <div className={`text-6xl font-black ${scoreColor(avgScore)}`}>{avgScore}<span className="text-2xl text-slate-400">/100</span></div>
              <p className="text-slate-400 mt-2">
                {avgScore >= 80 ? 'Excellent performance! You\'re ready.' : avgScore >= 60 ? 'Good effort! A few more sessions and you\'ll nail it.' : 'Keep practising — you\'ll improve fast.'}
              </p>
            </div>

            {/* Per-question scores */}
            <div className="card mb-6">
              <h3 className="text-sm font-semibold text-white mb-4">Question breakdown</h3>
              <div className="space-y-3">
                {scores.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16">Q{i + 1}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${s}%` }} />
                    </div>
                    <span className={`text-sm font-bold w-12 text-right ${scoreColor(s)}`}>{s}/100</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <button onClick={() => { setPhase('setup'); setMessages([]); setScores([]); }} className="btn btn-primary">
                🔄 Try Again
              </button>
              <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
                Dashboard →
              </button>
            </div>

            {avgScore < 80 && (
              <div className="card bg-indigo-500/5 border-indigo-500/20 text-center">
                <p className="text-slate-300 text-sm mb-3">Practice more with the desktop app for real-time AI coaching during live interviews.</p>
                <a href="/dashboard" className="text-indigo-400 text-sm font-semibold hover:text-indigo-300">Download JavihAI Desktop App →</a>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
