'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-slate-300">🎉 Trusted by 10,000+ candidates worldwide</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Ace Your Next Interview
              <br />
              <span className="text-gradient animate-gradient">With AI by Your Side</span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Real-time AI feedback on your answers. Voice analysis, smart suggestions,
              and instant insights. Land your dream job with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/auth/signup" className="btn btn-primary btn-lg animate-pulse-glow">
                Start Free Trial →
              </Link>
              <a href="#features" className="btn btn-secondary btn-lg">
                ▶ Watch Demo
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2"><span className="text-green-400">✓</span> No credit card required</div>
              <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Free 7-day trial</div>
              <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Cancel anytime</div>
            </div>
          </div>

          {/* Hero Mockup */}
          <div className="mt-20 relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 gradient-primary opacity-30 blur-3xl rounded-3xl"></div>
              <div className="relative glass-heavy rounded-3xl p-2 border border-white/10">
                <div className="bg-slate-900 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-slate-500 ml-2">JavihAI • Live Session</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                    <div className="space-y-3">
                      <div className="badge">🎤 Live Recording</div>
                      <div className="text-lg font-semibold text-white">
                        &ldquo;Tell me about a challenging project you worked on...&rdquo;
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="progress-bar"><div className="progress-fill" style={{ width: '75%' }}></div></div>
                        <div className="text-xs text-slate-400">Confidence: 87%</div>
                      </div>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                        <span className="animate-pulse">●</span> AI Analyzing...
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed space-y-1">
                        <div><span className="text-green-400">✓</span> Strong technical explanation</div>
                        <div><span className="text-green-400">✓</span> Good use of STAR method</div>
                        <div><span className="text-yellow-400">!</span> Try quantifying impact more</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '500K+', label: 'Questions Answered' },
              { value: '92%', label: 'Success Rate' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-gradient mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">✨ Features</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Everything You Need to <span className="text-gradient">Succeed</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Powerful AI tools designed to give you the edge in any interview
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🎤', title: 'Real-Time Voice Analysis', desc: 'Get instant feedback on your tone, pace, and clarity. Our AI listens like a hiring manager.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: '🧠', title: 'Smart Answer Suggestions', desc: 'AI-powered suggestions during your responses. Never blank out on a question again.', gradient: 'from-indigo-500 to-purple-500' },
              { icon: '📸', title: 'Screen Capture & Analysis', desc: 'Share code or diagrams. AI analyzes everything you show on your screen instantly.', gradient: 'from-purple-500 to-pink-500' },
              { icon: '📊', title: 'Performance Tracking', desc: 'Track your progress over time. See where you improve and what to focus on.', gradient: 'from-pink-500 to-rose-500' },
              { icon: '🎯', title: 'Industry-Specific Prep', desc: 'Tailored questions for tech, finance, consulting, and more. Practice what matters.', gradient: 'from-orange-500 to-red-500' },
              { icon: '🔒', title: 'Private & Secure', desc: 'Your data stays yours. End-to-end encryption. No recordings stored without consent.', gradient: 'from-green-500 to-emerald-500' },
            ].map((feature, i) => (
              <div key={i} className="card card-glow group">
                <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-bounce`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">🚀 Getting Started</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Start Practicing in <span className="text-gradient">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 gradient-primary opacity-30"></div>

            {[
              { num: '01', title: 'Sign Up Free', desc: 'Create your account in 30 seconds. No credit card required.' },
              { num: '02', title: 'Download Desktop App', desc: 'Get our powerful desktop app for Windows. Mac coming soon.' },
              { num: '03', title: 'Start Practicing', desc: 'Begin practicing with real interview questions and AI feedback.' },
            ].map((step, i) => (
              <div key={i} className="text-center relative z-10">
                <div className="inline-flex w-24 h-24 rounded-full gradient-primary items-center justify-center text-3xl font-black text-white mb-6 animate-pulse-glow">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mb-4">💬 Reviews</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Loved by Candidates <span className="text-gradient">Everywhere</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah Chen', role: 'SWE at Google', avatar: '👩‍💻', text: 'This app helped me land my dream job at Google. The real-time AI feedback during practice sessions was a game-changer.' },
              { name: 'Marcus Johnson', role: 'Product Manager at Meta', avatar: '👨‍💼', text: 'I went from rejected to hired at three FAANG companies. The voice analysis caught nervous patterns I never knew I had.' },
              { name: 'Priya Sharma', role: 'Data Scientist at Microsoft', avatar: '👩‍🔬', text: 'Better than any human coach. Available 24/7, never tires, and gives actionable feedback. Worth every penny.' },
            ].map((t, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-sm text-slate-400">{t.role}</div>
                  </div>
                </div>
                <div className="text-yellow-400 mb-3">★★★★★</div>
                <p className="text-slate-300 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 gradient-primary opacity-90"></div>
            <div className="absolute inset-0 bg-grid opacity-30"></div>
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Ready to Land Your Dream Job?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join 10,000+ candidates who&apos;ve transformed their interview skills with AI
              </p>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:scale-105 transition-bounce shadow-2xl">
                Get Started Free →
              </Link>
              <p className="text-white/80 text-sm mt-4">No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">❓ FAQ</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How does the AI interview helper work?', a: 'Our desktop app uses advanced AI to analyze your voice, suggest answers in real-time, and provide instant feedback on your interview performance. It works during live interviews or practice sessions.' },
              { q: 'Is my data private and secure?', a: 'Yes, absolutely. All audio is processed in real-time and never stored unless you opt-in. Your data is encrypted end-to-end and we never share it with third parties.' },
              { q: 'Can I use it during a real interview?', a: 'Yes! The app runs in stealth mode and provides discreet suggestions. Many users find it helpful as a confidence booster during high-stakes interviews.' },
              { q: 'What platforms are supported?', a: 'Currently we support Windows 10/11. Mac and Linux versions are coming in Q2 2026.' },
              { q: 'How much does it cost?', a: 'We have a free tier with 10 questions per day. Pro is ₹499/month for unlimited usage. Power tier is ₹999/month with priority AI models.' },
              { q: 'Can I cancel anytime?', a: 'Yes, cancel anytime with one click. No questions asked. You can also pause your subscription if you need a break.' },
            ].map((item, i) => (
              <div key={i} className="card cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="w-full text-left flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white pr-4">{item.q}</h3>
                  <div className={`w-8 h-8 rounded-full glass flex items-center justify-center transition-bounce flex-shrink-0 ${
                    openFaq === i ? 'rotate-180 gradient-primary' : ''
                  }`}>
                    <span className="text-white text-xs">▼</span>
                  </div>
                </div>
                {openFaq === i && (
                  <p className="text-slate-300 leading-relaxed mt-4 animate-fade-in-up">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
