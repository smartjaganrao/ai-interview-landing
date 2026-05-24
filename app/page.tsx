'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqItems = [
    {
      q: 'Do I need experience with coding interviews?',
      a: 'No! The AI Interview Helper is designed for everyone—from beginners to experienced engineers. Start at your level and progress at your own pace.',
    },
    {
      q: 'How does the AI feedback work?',
      a: 'Our AI analyzes your responses in real-time, looking for clarity, structure, and depth. You get instant feedback and suggestions for improvement.',
    },
    {
      q: 'Can I practice with code?',
      a: 'Yes! You can share your screen and write code in any editor. The AI watches and provides feedback on both your approach and implementation.',
    },
    {
      q: 'Is my data private?',
      a: 'Absolutely. Your conversations are encrypted and stored securely. Only you and our team (with permission) can access them. We never share data with third parties.',
    },
    {
      q: 'What if I need help?',
      a: 'Pro and Power users get priority email support. We also have a community forum and weekly office hours with our coaches.',
    },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect to get started',
      features: [
        '10 AI answers per day',
        '3 screen captures per day',
        '20 minutes of voice per day',
        'Basic feedback',
        'Community access',
      ],
      cta: user ? 'Go to Dashboard' : 'Get Started',
      ctaLink: user ? '/dashboard' : '/auth/signup',
      primary: false,
    },
    {
      name: 'Pro',
      price: '499',
      period: '/month',
      description: 'For serious candidates',
      features: [
        'Unlimited AI answers',
        'Unlimited screen captures',
        'Unlimited voice practice',
        'Detailed analytics',
        'Priority support',
        'Cloud history sync',
      ],
      cta: user ? 'Upgrade Now' : 'Start Free Trial',
      ctaLink: user ? '/dashboard/upgrade' : '/auth/signup?plan=pro',
      primary: true,
    },
    {
      name: 'Power',
      price: '999',
      period: '/month',
      description: 'For power users',
      features: [
        'Everything in Pro',
        'Interview recording',
        'Team collaboration',
        'Custom scenarios',
        '1-on-1 coaching',
        'Lifetime updates',
      ],
      cta: user ? 'Upgrade Now' : 'Start Free Trial',
      ctaLink: user ? '/dashboard/upgrade' : '/auth/signup?plan=power',
      primary: false,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-gradient">AI Interview</div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="btn btn-ghost">
                  Dashboard
                </Link>
                <Link href="/auth/logout" className="btn btn-secondary">
                  Sign Out
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-ghost">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Master Interviews with
              <span className="text-gradient"> AI Feedback</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Practice with real-time voice, screen sharing, and AI-powered analysis. Get feedback instantly. Land your dream role.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href={user ? '/dashboard' : '/auth/signup'} className="btn btn-primary text-lg">
                {user ? 'Open Dashboard' : 'Start for Free'}
              </Link>
              <a href="#pricing" className="btn btn-secondary text-lg">
                See Pricing
              </a>
            </div>
            <p className="text-sm text-slate-400 mt-6">
              ✓ No credit card required • ✓ 10 free answers per day • ✓ All features included
            </p>
          </div>
          <div className="relative h-96 bg-gradient-to-br from-indigo-500/20 to-purple-900/20 rounded-2xl glass border border-indigo-500/30 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎤</div>
              <p className="text-slate-300">Voice + Screen Share</p>
              <p className="text-sm text-slate-500 mt-2">Real-time feedback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 py-20 bg-slate-800/30 border-y border-slate-700">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-slate-300">Choose the plan that fits your goals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`card ${tier.primary ? 'border-indigo-500 ring-2 ring-indigo-500/30' : ''}`}
              >
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-slate-400 mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₹{tier.price}</span>
                  {tier.period && <span className="text-slate-400">{tier.period}</span>}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-indigo-400 mt-1">✓</span>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaLink}
                  className={`btn w-full justify-center ${
                    tier.primary ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="card cursor-pointer"
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{item.q}</h3>
                  <span className="text-2xl text-indigo-400">
                    {expandedFaq === idx ? '−' : '+'}
                  </span>
                </div>
                {expandedFaq === idx && (
                  <p className="text-slate-300 mt-4">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to level up?</h2>
          <p className="text-xl text-slate-100 mb-8">
            Join thousands practicing with AI feedback. No credit card required.
          </p>
          <Link href={user ? '/dashboard' : '/auth/signup'} className="btn btn-secondary text-lg">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 px-4 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-lg font-bold text-gradient mb-4">AI Interview</div>
            <p className="text-slate-400">Master interviews with AI feedback.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#pricing" className="hover:text-white transition-smooth">Pricing</a></li>
              <li><Link href="/features">Features</Link></li>
              <li><Link href="/roadmap">Roadmap</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/refund">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 text-center text-slate-500">
          <p>&copy; 2025 AI Interview Helper. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
