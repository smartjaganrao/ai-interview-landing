'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, collection, query, where, getCountFromServer, addDoc } from 'firebase/firestore';
// email-only auth removed — Google sign-in only
import Navbar from '@/components/Navbar';

interface UserData {
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'power';
  createdAt: number;
}

interface UsageData {
  tokensUsed: number;
  voiceMinutes: number;
  screenshotsUsed: number;
}

interface SubscriptionData {
  plan: 'free' | 'pro' | 'power';
  status: string;
  billing?: 'monthly' | 'yearly';
  amount?: number;
  startedAt?: number;
  renewalDate?: number;
  paymentId?: string;
}

interface ActivityData {
  totalSessions: number;
  totalQuestions: number;
}

const APP_VERSION = 'v1.2.4';
const DESKTOP_DOWNLOAD_URL = 'https://github.com/smartjaganrao/ai-interview-helper/releases/latest';
const WINDOWS_DOWNLOAD_URL = `https://github.com/smartjaganrao/ai-interview-helper/releases/download/${APP_VERSION}/JavihAI-${APP_VERSION}-portable-win-x64.exe`;
const MAC_DOWNLOAD_URL = `https://github.com/smartjaganrao/ai-interview-helper/releases/download/${APP_VERSION}/JavihAI-${APP_VERSION}-mac-universal.dmg`;

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [activity, setActivity] = useState<ActivityData>({ totalSessions: 0, totalQuestions: 0 });
  const [loading, setLoading] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  // Support ticket
  const [showSupport, setShowSupport] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (searchParams.get('upgraded') === 'true') {
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }

    if (user) {
      Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDoc(doc(db, 'subscriptions', user.uid)),
        getDoc(doc(db, 'usage_tracking', user.uid, 'months', new Date().toISOString().slice(0, 7))),
      ]).then(([userSnap, subSnap, usageSnap]) => {
        if (userSnap.exists()) {
          const ud = userSnap.data() as UserData;
          if (subSnap.exists()) {
            ud.plan = (subSnap.data().plan || ud.plan) as 'free' | 'pro' | 'power';
          }
          setUserData(ud);
        }
        if (subSnap.exists()) {
          setSubData(subSnap.data() as SubscriptionData);
        }
        if (usageSnap.exists()) {
          setUsageData(usageSnap.data() as UsageData);
        } else {
          setUsageData({ tokensUsed: 0, voiceMinutes: 0, screenshotsUsed: 0 });
        }
        setLoading(false);
      });

      // Interview activity counts (best-effort — won't block dashboard)
      Promise.all([
        getCountFromServer(query(collection(db, 'interview_sessions'), where('userId', '==', user.uid))),
        getCountFromServer(query(collection(db, 'interview_messages'), where('userId', '==', user.uid))),
      ])
        .then(([sessSnap, msgSnap]) => {
          setActivity({
            totalSessions: sessSnap.data().count,
            totalQuestions: msgSnap.data().count,
          });
        })
        .catch(() => {
          // collections may not exist yet for new users; ignore
        });
    }
  }, [user, authLoading, router, searchParams]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const plan = userData?.plan || 'free';
  const planConfig = {
    free: { emoji: '🎯', color: 'from-slate-600 to-slate-700', label: 'Free' },
    pro: { emoji: '🚀', color: 'from-indigo-500 to-purple-600', label: 'Pro' },
    power: { emoji: '⚡', color: 'from-purple-600 to-pink-600', label: 'Power' },
  };

  return (
    <>
      <Navbar />

      {showSuccessBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="glass-heavy rounded-xl p-4 border border-green-500/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">✓</div>
            <div>
              <div className="font-semibold text-white">Welcome to {planConfig[plan].label}! 🎉</div>
              <div className="text-sm text-slate-400">Your account has been upgraded successfully.</div>
            </div>
          </div>
        </div>
      )}

      <section className="pt-32 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">

          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black">
                Welcome back, <span className="text-gradient">{userData?.name || 'Friend'}</span> 👋
              </h1>
            </div>
            <p className="text-slate-400">Ready to ace your next interview?</p>
          </div>

          {/* Activity Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: '🧠', value: activity.totalQuestions, label: 'Questions Practiced' },
              { icon: '🎯', value: activity.totalSessions, label: 'Interview Sessions' },
              {
                icon: '📅',
                value: userData?.createdAt ? Math.max(1, Math.floor((Date.now() - userData.createdAt) / 86400000)) : 1,
                label: 'Days as Member',
              },
              { icon: planConfig[plan].emoji, value: planConfig[plan].label, label: 'Current Plan' },
            ].map((stat, i) => (
              <div key={i} className="card flex items-center gap-4 py-4">
                <div className="text-3xl">{stat.icon}</div>
                <div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Row: Plan + Download */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Plan Card */}
            <div className="card card-glow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-400">Current Plan</div>
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${planConfig[plan].color} text-white text-xs font-semibold`}>
                  {planConfig[plan].label}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{planConfig[plan].emoji}</div>
                <div>
                  <div className="text-2xl font-black text-white">{planConfig[plan].label} Plan</div>
                  <div className="text-sm text-slate-400">
                    {plan === 'free' ? 'Upgrade to unlock unlimited' : 'Premium features active'}
                  </div>
                </div>
              </div>
              {plan === 'free' ? (
                <Link href="/pricing" className="btn btn-primary w-full">
                  Upgrade Plan →
                </Link>
              ) : (
                <Link href="/pricing" className="btn btn-secondary w-full">
                  Manage Plan
                </Link>
              )}
            </div>

            {/* Download Card */}
            <div className="lg:col-span-2 card card-glow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="badge mb-2">💻 Desktop App</div>
                    <h3 className="text-2xl font-black mb-2">Get the Desktop App</h3>
                    <p className="text-slate-400">Download our powerful desktop app for Windows or Mac to start practicing</p>
                  </div>
                  <div className="text-6xl">🖥️</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <a
                    href={WINDOWS_DOWNLOAD_URL}
                    className="btn btn-primary btn-lg flex-1 animate-pulse-glow"
                  >
                    ⬇ Download for Windows
                  </a>
                  <a
                    href={MAC_DOWNLOAD_URL}
                    className="btn btn-primary btn-lg flex-1"
                  >
                    ⬇ Download for Mac
                  </a>
                  <a
                    href={DESKTOP_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-secondary btn-lg"
                  >
                    View Releases
                  </a>
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <span>{APP_VERSION}</span>
                  <span>•</span>
                  <span>Windows 10/11 · macOS (Apple Silicon + Intel)</span>
                </div>

                {/* Install instructions — self-serve, covers the security warnings */}
                <div className="mt-6 pt-6 border-t border-slate-700/60">
                  <h4 className="text-sm font-bold text-slate-200 mb-4">📥 How to install (2 minutes)</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Windows */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 font-semibold text-slate-100">
                        <span className="text-lg">🪟</span> Windows 10/11
                      </div>
                      <ol className="space-y-2.5 text-sm text-slate-400 list-decimal list-inside marker:text-indigo-400 marker:font-bold">
                        <li>Click <span className="text-slate-200 font-medium">Download for Windows</span> and run the downloaded <code className="text-indigo-300">.exe</code>.</li>
                        <li>If you see a blue <span className="text-slate-200">&quot;Windows protected your PC&quot;</span> box, click <span className="text-slate-200 font-medium">More info → Run anyway</span>. <span className="text-slate-500">(It&apos;s safe — the app just isn&apos;t code-signed yet.)</span></li>
                        <li>The app opens near the top of your screen. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">Alt</kbd>+<kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">H</kbd> to show/hide it.</li>
                      </ol>
                    </div>
                    {/* Mac */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 font-semibold text-slate-100">
                        <span className="text-lg">🍎</span> macOS
                      </div>
                      <ol className="space-y-2.5 text-sm text-slate-400 list-decimal list-inside marker:text-indigo-400 marker:font-bold">
                        <li>Click <span className="text-slate-200 font-medium">Download for Mac</span>, open the <code className="text-indigo-300">.dmg</code>, and drag <span className="text-slate-200">JavihAI</span> into <span className="text-slate-200">Applications</span>.</li>
                        <li>In Applications, <span className="text-slate-200 font-medium">right-click JavihAI → Open → Open</span>. <span className="text-slate-500">(Needed once — the app isn&apos;t notarized yet.)</span></li>
                        <li>Still blocked? Open <span className="text-slate-200 font-medium">System Settings → Privacy &amp; Security</span>, scroll down and click <span className="text-slate-200 font-medium">Open Anyway</span>.</li>
                        <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">⌥ Option</kbd>+<kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">H</kbd> to show/hide the window.</li>
                      </ol>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    💡 When you start a voice session, click <span className="text-slate-400">Allow</span> on the microphone prompt. Both apps run fully offline — your keys stay on your device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Stats - only for free tier */}
          {plan === 'free' && usageData && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">📊 Today&apos;s Usage</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { label: 'AI Answers', used: Math.min(usageData.tokensUsed / 500, 10), total: 10, icon: '🧠', color: 'from-blue-500 to-cyan-500' },
                  { label: 'Voice Minutes', used: usageData.voiceMinutes, total: 20, icon: '🎤', color: 'from-purple-500 to-pink-500' },
                  { label: 'Screenshots', used: usageData.screenshotsUsed, total: 3, icon: '📸', color: 'from-orange-500 to-red-500' },
                ].map((stat, i) => {
                  const percent = Math.min((stat.used / stat.total) * 100, 100);
                  return (
                    <div key={i} className="card">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl`}>
                          {stat.icon}
                        </div>
                        <div className="text-sm text-slate-400">{stat.label}</div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-black text-white">{Math.round(stat.used)}</span>
                        <span className="text-slate-400">/ {stat.total}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {percent >= 90 ? '⚠️ Almost at limit' : percent >= 50 ? '🟡 Halfway used' : '🟢 Plenty left'}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="card mt-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Need unlimited access?</h3>
                    <p className="text-slate-300">Upgrade to Pro for unlimited AI answers, voice minutes, and screenshots</p>
                  </div>
                  <Link href="/pricing" className="btn btn-primary">
                    See Plans →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Pro/Power benefits */}
          {(plan === 'pro' || plan === 'power') && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">✨ Your Premium Benefits</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: '∞', label: 'Unlimited AI', desc: 'No daily limits' },
                  { icon: '🎤', label: 'Voice Unlimited', desc: 'Use as much as needed' },
                  { icon: '☁️', label: 'Cloud Sync', desc: 'Access anywhere' },
                  { icon: '⚡', label: 'Priority Support', desc: '24/7 response' },
                ].map((b, i) => (
                  <div key={i} className="card text-center">
                    <div className="text-4xl mb-2">{b.icon}</div>
                    <div className="font-bold text-white mb-1">{b.label}</div>
                    <div className="text-xs text-slate-400">{b.desc}</div>
                  </div>
                ))}
              </div>

              {/* Billing Details */}
              {subData && (
                <div className="card mt-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🧾</span> Subscription &amp; Billing
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Status</div>
                      <div className="inline-flex items-center gap-2 text-green-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        {subData.status === 'active' ? 'Active' : subData.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Billing Cycle</div>
                      <div className="text-white font-semibold capitalize">{subData.billing || 'Monthly'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Amount</div>
                      <div className="text-white font-semibold">{subData.amount ? `₹${subData.amount}` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Renews On</div>
                      <div className="text-white font-semibold">
                        {subData.renewalDate ? new Date(subData.renewalDate).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                  {subData.paymentId && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                      <div className="text-xs text-slate-500 font-mono">Payment ID: {subData.paymentId}</div>
                      <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
                        Change Plan →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="text-lg font-bold mb-2">Getting Started</h3>
              <p className="text-slate-400 text-sm mb-4">Learn how to use the desktop app effectively</p>
              <a href="https://github.com/smartjaganrao/ai-interview-helper#readme" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">Read Guide →</a>
            </div>

            <div className="card">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="text-lg font-bold mb-2">Interview Tips</h3>
              <p className="text-slate-400 text-sm mb-4">Expert tips to ace your next interview</p>
              <a href="https://github.com/smartjaganrao/ai-interview-helper/wiki" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">Read Tips →</a>
            </div>

            <div className="card">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-bold mb-2">Need Help?</h3>
              <p className="text-slate-400 text-sm mb-4">Our team is here to help you succeed</p>
              <button onClick={() => setShowSupport(true)} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">Contact Support →</button>
            </div>
          </div>

          {/* New feature cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Link href="/resume" className="card card-glow hover:border-purple-500/40 transition-all group block">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl flex-shrink-0">📄</div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors mb-1">Resume Builder</h3>
                  <p className="text-slate-400 text-sm mb-2">Build an ATS-ready resume with 5 professional templates. Download as PDF in seconds.</p>
                  <span className="text-purple-400 text-sm font-semibold">Build Resume →</span>
                </div>
              </div>
            </Link>

            <Link href="/jobs" className="card card-glow hover:border-green-500/40 transition-all group block">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-2xl flex-shrink-0">💼</div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-green-300 transition-colors mb-1">Job Recommendations</h3>
                  <p className="text-slate-400 text-sm mb-2">Browse top tech jobs at Flipkart, Razorpay, Swiggy, CRED and more. Practice for any role.</p>
                  <span className="text-green-400 text-sm font-semibold">Browse Jobs →</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Support Ticket Form */}
          {showSupport && (
            <div className="mt-6 card border border-indigo-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Submit a Support Ticket</h3>
                <button onClick={() => { setShowSupport(false); setTicketStatus(''); }} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>
              {ticketStatus === 'sent' ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-green-400 font-semibold">Ticket submitted!</p>
                  <p className="text-slate-400 text-sm mt-1">We&apos;ll reply to {user?.email} within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user || !ticketTitle.trim() || !ticketDesc.trim()) return;
                  setTicketSending(true);
                  try {
                    await addDoc(collection(db, 'support_tickets'), {
                      userId: user.uid,
                      userEmail: user.email,
                      title: ticketTitle.trim(),
                      description: ticketDesc.trim(),
                      category: ticketCategory,
                      status: 'open',
                      priority: 'medium',
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      messageCount: 1,
                      messages: [{ senderType: 'user', senderUid: user.uid, senderEmail: user.email, message: ticketDesc.trim(), timestamp: Date.now() }],
                    });
                    setTicketStatus('sent');
                    setTicketTitle(''); setTicketDesc('');
                  } catch { setTicketStatus('error'); }
                  setTicketSending(false);
                }} className="space-y-4">
                  <input
                    type="text" placeholder="Subject / Title" required
                    value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing / Payment</option>
                    <option value="feature-request">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea placeholder="Describe your issue in detail…" required rows={4}
                    value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  {ticketStatus === 'error' && <p className="text-red-400 text-sm">⚠ Failed to submit. Try again.</p>}
                  <button type="submit" disabled={ticketSending} className="w-full btn btn-primary disabled:opacity-50">
                    {ticketSending ? 'Submitting…' : 'Submit Ticket →'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Account Settings */}
          <div className="mt-10 card">
            <h2 className="text-xl font-bold mb-6">Account Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">Email</div>
                <div className="text-white">{userData?.email || user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Name</div>
                <div className="text-white">{userData?.name || 'Not set'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Member Since</div>
                <div className="text-white">
                  {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">User ID</div>
                <div className="text-white font-mono text-xs">{user?.uid?.slice(0, 16)}...</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
