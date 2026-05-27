'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
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

const DESKTOP_DOWNLOAD_URL = 'https://github.com/smartjaganrao/ai-interview-helper/releases/latest';
const DIRECT_DOWNLOAD_URL = 'https://github.com/smartjaganrao/ai-interview-helper/releases/download/v1.1.0-beta.1/AI.Interview.Helper.v1.1.0-beta.1.exe';

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

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
        if (usageSnap.exists()) {
          setUsageData(usageSnap.data() as UsageData);
        } else {
          setUsageData({ tokensUsed: 0, voiceMinutes: 0, screenshotsUsed: 0 });
        }
        setLoading(false);
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
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black">
                Welcome back, <span className="text-gradient">{userData?.name || 'Friend'}</span> 👋
              </h1>
            </div>
            <p className="text-slate-400">Ready to ace your next interview?</p>
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
                    <p className="text-slate-400">Download our powerful Windows app to start practicing</p>
                  </div>
                  <div className="text-6xl">🖥️</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <a
                    href={DIRECT_DOWNLOAD_URL}
                    className="btn btn-primary btn-lg flex-1 animate-pulse-glow"
                  >
                    ⬇ Download for Windows
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
                  <span>v1.1.0-beta.1</span>
                  <span>•</span>
                  <span>Windows 10/11</span>
                  <span>•</span>
                  <span>222 MB</span>
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
            </div>
          )}

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="text-lg font-bold mb-2">Getting Started</h3>
              <p className="text-slate-400 text-sm mb-4">Learn how to use the desktop app effectively</p>
              <a href="#" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">Read Guide →</a>
            </div>

            <div className="card">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="text-lg font-bold mb-2">Interview Tips</h3>
              <p className="text-slate-400 text-sm mb-4">Expert tips to ace your next interview</p>
              <a href="#" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">View Tips →</a>
            </div>

            <div className="card">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-bold mb-2">Need Help?</h3>
              <p className="text-slate-400 text-sm mb-4">Our team is here to help you succeed</p>
              <a href="mailto:support@aiinterview.com" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">Contact Support →</a>
            </div>
          </div>

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
