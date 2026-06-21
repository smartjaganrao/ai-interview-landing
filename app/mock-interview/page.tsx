'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function MockInterviewPage() {
  return (
    <>
      <Navbar />
      <div className="pt-24 pb-20 max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="badge mb-3">🎯 Mock Interview</div>
          <h1 className="text-4xl font-black mb-3">Voice-Driven AI Mock Interview</h1>
          <p className="text-slate-400">Speak your answers like a real interview. Questions from your profile &amp; JD. Scored live.</p>
        </div>

        <div className="card mb-6 text-center">
          <div className="text-5xl mb-4">💻</div>
          <h2 className="text-xl font-bold mb-3">Mock Interview runs in the JavihAI desktop app</h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Download JavihAI, sign in, fill in your profile (role, skills, job description), then open{' '}
            <strong className="text-white">Menu → Mock Interview</strong>. Pick a difficulty, speak your answers
            out loud, and get an AI-scored breakdown — all inside the app, no typing required.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <a href="/api/download/mac" className="btn btn-primary btn-lg">
              ⬇ Download for Mac
            </a>
            <a href="/api/download/win" className="btn btn-secondary btn-lg">
              ⬇ Download for Windows
            </a>
          </div>
          <p className="text-xs text-slate-600">Free plan included — no credit card needed.</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3">📋 What to expect</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Questions generated live from your target role, skills, and job description — never the same session twice</li>
            <li>• Choose Easy, Medium, or Hard difficulty</li>
            <li>• Speak your answer naturally — live captions transcribe as you talk, no record/stop button</li>
            <li>• Open-ended — keep going as long as you like, end whenever you're ready</li>
            <li>• Scored out of 100 with specific feedback after every answer</li>
            <li>• Same AI scoring used by 2,400+ candidates on JavihAI</li>
          </ul>
        </div>

        <div className="card mt-6 bg-indigo-500/5 border-indigo-500/20 text-center">
          <p className="text-slate-300 text-sm mb-3">
            Already have the app installed? Open it, sign in, and look for <strong className="text-white">Mock Interview</strong> in the menu.
          </p>
          <a href="/dashboard" className="text-indigo-400 text-sm font-semibold hover:text-indigo-300">Go to Dashboard →</a>
        </div>
      </div>
      <Footer />
    </>
  );
}
