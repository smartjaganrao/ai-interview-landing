'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';

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

const PLAN_LIMITS = {
  free: {
    answers: 10,
    screenshots: 3,
    voiceMinutes: 20,
  },
  pro: {
    answers: Infinity,
    screenshots: Infinity,
    voiceMinutes: Infinity,
  },
  power: {
    answers: Infinity,
    screenshots: Infinity,
    voiceMinutes: Infinity,
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }

        // Fetch usage data
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const usageDoc = await getDoc(
          doc(db, 'usage_tracking', user.uid, 'months', currentMonth)
        );
        if (usageDoc.exists()) {
          setUsageData(usageDoc.data() as UsageData);
        } else {
          setUsageData({
            tokensUsed: 0,
            voiceMinutes: 0,
            screenshotsUsed: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Failed to load dashboard</p>
          <Link href="/auth/login" className="btn btn-primary mt-4">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  const planLimits = PLAN_LIMITS[userData.plan];
  const answerUsagePercent = Math.min(
    ((usageData?.tokensUsed || 0) / 4000) * 100,
    100
  );
  const voiceUsagePercent = Math.min(
    ((usageData?.voiceMinutes || 0) / (planLimits.voiceMinutes === Infinity ? 600 : planLimits.voiceMinutes)) * 100,
    100
  );

  return (
    <div className="min-h-screen gradient-dark">
      {/* Header */}
      <header className="glass border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-slate-400">Welcome back, {userData.name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded-full text-sm font-semibold text-indigo-300 capitalize">
              {userData.plan} Plan
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Download Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="card border-indigo-500 ring-2 ring-indigo-500/30">
            <h2 className="text-2xl font-bold mb-4">Get Started</h2>
            <p className="text-slate-300 mb-6">
              Download the AI Interview Helper app and start practicing with AI feedback.
            </p>
            <a
              href="https://github.com/smartjaganrao/ai-interview-helper/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full justify-center mb-4"
            >
              ⬇️ Download for Windows
            </a>
            <p className="text-xs text-slate-500 text-center">
              v1.1.0-beta.1 • ~200 MB • Windows 10/11
            </p>
          </div>

          {/* Plan Info */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 capitalize">{userData.plan} Plan</h2>
            <div className="space-y-3 mb-6">
              {userData.plan === 'free' && (
                <>
                  <p className="text-slate-300">
                    💰 Free tier includes:
                  </p>
                  <ul className="space-y-2 text-slate-400">
                    <li>✓ 10 AI answers per day</li>
                    <li>✓ 3 screen captures per day</li>
                    <li>✓ 20 minutes of voice per day</li>
                    <li>✓ Cloud history sync</li>
                  </ul>
                  <Link
                    href="/dashboard/upgrade"
                    className="btn btn-primary w-full justify-center mt-4"
                  >
                    Upgrade to Pro
                  </Link>
                </>
              )}
              {userData.plan === 'pro' && (
                <>
                  <p className="text-slate-300">
                    ⭐ You have unlimited access:
                  </p>
                  <ul className="space-y-2 text-slate-400">
                    <li>✓ Unlimited AI answers</li>
                    <li>✓ Unlimited screen captures</li>
                    <li>✓ Unlimited voice practice</li>
                    <li>✓ Priority support</li>
                  </ul>
                  <button className="btn btn-secondary w-full justify-center mt-4">
                    Manage Subscription
                  </button>
                </>
              )}
              {userData.plan === 'power' && (
                <>
                  <p className="text-slate-300">
                    👑 Power tier with extra benefits:
                  </p>
                  <ul className="space-y-2 text-slate-400">
                    <li>✓ Everything in Pro</li>
                    <li>✓ Interview recording</li>
                    <li>✓ Team collaboration</li>
                    <li>✓ 1-on-1 coaching</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        {userData.plan === 'free' && (
          <div className="card mb-12">
            <h2 className="text-xl font-bold mb-6">This Month's Usage</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* AI Answers */}
              <div>
                <p className="text-slate-400 text-sm mb-2">AI Answers</p>
                <div className="text-2xl font-bold mb-2">
                  {usageData?.tokensUsed || 0} / {planLimits.answers}
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${answerUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Voice Minutes */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Voice Minutes</p>
                <div className="text-2xl font-bold mb-2">
                  {usageData?.voiceMinutes || 0} / {planLimits.voiceMinutes}
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${voiceUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Screenshots</p>
                <div className="text-2xl font-bold mb-2">
                  {usageData?.screenshotsUsed || 0} / {planLimits.screenshots}
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((usageData?.screenshotsUsed || 0) / planLimits.screenshots) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm">Email</label>
              <p className="font-semibold">{userData.email}</p>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Name</label>
              <p className="font-semibold">{userData.name}</p>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Member Since</label>
              <p className="font-semibold">
                {new Date(userData.createdAt).toLocaleDateString()}
              </p>
            </div>
            <hr className="border-slate-700 my-4" />
            <button className="text-red-400 hover:text-red-300 text-sm">
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
