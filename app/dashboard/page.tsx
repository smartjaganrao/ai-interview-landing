'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, onSnapshot, collection, query, where, getCountFromServer } from 'firebase/firestore';
import CompleteProfileModal, { shouldShowProfilePrompt } from '@/components/CompleteProfileModal';
import { PLANS, PlanId, migratePlanId, getPlanById } from '@/lib/pricing-config';

interface UserData {
  email: string;
  name: string;
  plan: string;
  createdAt: number;
  phone?: string;
  experienceLevel?: string;
  city?: string;
  referralSource?: string;
}

interface UsageData {
  tokensUsed: number;
  voiceMinutes: number;
  screenshotsUsed: number;
}

interface SubscriptionData {
  plan: string;
  status: string;
  billing?: 'monthly' | 'yearly' | 'one-time';
  amount?: number;
  startedAt?: number;
  renewalDate?: number;
  paymentId?: string;
  cancelAtPeriodEnd?: boolean;
  planType?: 'one-time' | 'subscription';
  hoursPurchased?: number;
  hoursRemaining?: number;
  expiresAt?: number;
}

interface ActivityData {
  totalSessions: number;
  totalQuestions: number;
}

const WINDOWS_DOWNLOAD_URL = '/api/download/win';
const MAC_DOWNLOAD_URL = '/api/download/mac';

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const withAttribution = (url: string) =>
    user ? `${url}?uid=${encodeURIComponent(user.uid)}&email=${encodeURIComponent(user.email || '')}` : url;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [activity, setActivity] = useState<ActivityData>({ totalSessions: 0, totalQuestions: 0 });
  const [dataReady, setDataReady] = useState({ user: false, sub: false, usage: false, activity: false });
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportTab, setSupportTab] = useState<'new'|'history'>('new');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState('');
  const [myTickets, setMyTickets] = useState<Array<{
    id: string; title: string; category: string; status: string;
    createdAt: number; updatedAt: number;
    messages: Array<{ senderType: 'user'|'admin'; senderEmail: string; message: string; timestamp: number }>;
  }>>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string|null>(null);
  const [appVersion, setAppVersion] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  useEffect(() => {
    fetch('/api/release').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.version) setAppVersion(d.version);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      const checkInstall = localStorage.getItem('javihai_installed');
      const checkDownload = localStorage.getItem('javihai_downloaded');
      setHasInstalled(!!checkInstall);
      setHasDownloaded(!!checkDownload);
      setHasSignedIn(true);

      const created = userData?.createdAt || Date.now();
      const isNew = (Date.now() - created) < 7 * 86400000;
      setIsNewUser(isNew);

      if (isNew) {
        setTimeout(() => setShowSupport(true), 1500);
      }
    }
  }, [user, userData]);

  const loadMyTickets = async () => {
    if (!user) return;
    setTicketsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/support/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) { const d = await res.json(); setMyTickets(d.tickets || []); }
    } catch { /* silent */ }
    setTicketsLoading(false);
  };

  const toggleCancel = async (cancel: boolean) => {
    if (!user || cancelBusy) return;
    setCancelBusy(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, cancel }),
      });
      if (res.ok) {
        setSubData(prev => prev ? { ...prev, cancelAtPeriodEnd: cancel } : prev);
      }
    } catch { /* silent */ }
    setCancelBusy(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setDataReady(prev => ({ ...prev, user: false, sub: false, usage: false, activity: false }));

    getDoc(doc(db, 'usage_tracking', user.uid, 'days', new Date().toISOString().slice(0, 10)))
      .then((usageSnap) => {
        setUsageData(usageSnap.exists() ? (usageSnap.data() as UsageData) : { tokensUsed: 0, voiceMinutes: 0, screenshotsUsed: 0 });
        setDataReady(prev => ({ ...prev, usage: true }));
      })
      .catch((err) => {
        console.error('[dashboard] failed to load usage:', err);
        setDataReady(prev => ({ ...prev, usage: true }));
      });

    let latestUserData: UserData | null = null;
    let latestSubData: SubscriptionData | null = null;
    let gotUser = false;
    let gotSub = false;
    const maybeStopLoading = () => {
      if (gotUser && gotSub) {
        setDataReady(prev => ({ ...prev, user: true, sub: true }));
      }
    };

    const mergeAndSetUserData = () => {
      if (!latestUserData) return;
      const ud = { ...latestUserData };
      if (latestSubData?.plan) ud.plan = latestSubData.plan;
      setUserData(ud);
      setShowProfilePrompt(shouldShowProfilePrompt(ud));
    };

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      gotUser = true;
      if (snap.exists()) {
        latestUserData = snap.data() as UserData;
        mergeAndSetUserData();
      }
      maybeStopLoading();
    }, (err) => {
      console.error('[dashboard] users listener failed:', err);
      gotUser = true;
      maybeStopLoading();
    });

    const unsubSub = onSnapshot(doc(db, 'subscriptions', user.uid), (snap) => {
      gotSub = true;
      if (snap.exists()) {
        latestSubData = snap.data() as SubscriptionData;
        setSubData(latestSubData);
        mergeAndSetUserData();
      }
      maybeStopLoading();
    }, (err) => {
      console.error('[dashboard] subscriptions listener failed:', err);
      gotSub = true;
      maybeStopLoading();
    });

    Promise.all([
      getCountFromServer(query(collection(db, 'interview_sessions'), where('userId', '==', user.uid))),
      getCountFromServer(query(collection(db, 'interview_messages'), where('userId', '==', user.uid))),
    ])
      .then(([sessSnap, msgSnap]) => {
        setActivity({
          totalSessions: sessSnap.data().count,
          totalQuestions: msgSnap.data().count,
        });
        setDataReady(prev => ({ ...prev, activity: true }));
      })
      .catch(() => {
        setDataReady(prev => ({ ...prev, activity: true }));
      });

    return () => {
      unsubUser();
      unsubSub();
    };
  }, [user]);

  const handleDownload = (platform: 'windows' | 'mac') => {
    localStorage.setItem('javihai_downloaded', 'true');
    setHasDownloaded(true);
    const url = platform === 'windows' ? WINDOWS_DOWNLOAD_URL : MAC_DOWNLOAD_URL;
    window.open(withAttribution(url), '_blank');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const rawPlan = userData?.plan || 'free';
  const plan = migratePlanId(rawPlan) as PlanId;
  const planConfig = getPlanById(plan) || PLANS[0];
  const onboardingProgress = [hasDownloaded, hasInstalled, hasSignedIn].filter(Boolean).length;
  const onboardingPercent = (onboardingProgress / 3) * 100;

  const StatCardSkeleton = () => (
    <div className="card animate-pulse text-center">
      <div className="w-12 h-12 bg-white/5 rounded-xl mx-auto mb-3"></div>
      <div className="h-8 bg-white/5 rounded w-16 mx-auto mb-2"></div>
      <div className="h-4 bg-white/5 rounded w-20 mx-auto"></div>
    </div>
  );

  return (
    <>
      {showProfilePrompt && user && (
        <CompleteProfileModal
          user={user}
          onDone={(saved) => {
            setShowProfilePrompt(false);
            if (saved) setUserData((prev) => prev ? { ...prev, ...saved } : prev);
          }}
          initial={{ phone: userData?.phone, experienceLevel: userData?.experienceLevel, city: userData?.city, referralSource: userData?.referralSource }}
        />
      )}

      {showSuccessBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="glass-heavy rounded-xl p-4 border border-green-500/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">✓</div>
            <div>
              <div className="font-semibold text-white">Welcome to {planConfig.name}! 🎉</div>
              <div className="text-sm text-slate-400">Your account has been upgraded successfully.</div>
            </div>
          </div>
        </div>
      )}

      <section className="pt-20 pb-12 min-h-screen">
        <div className="max-w-6xl mx-auto px-6">

          {/* ==================== HERO + PLAN ==================== */}
          <div className="grid lg:grid-cols-3 gap-4 mb-4">
            {/* Download Hero */}
            <div className="lg:col-span-2 card card-glow bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10">
              <div className="badge text-xs mb-3">🚀 Get Started</div>
              <h1 className="text-xl md:text-2xl font-black mb-1.5">
                Download <span className="text-gradient">JavihAI</span> Desktop
              </h1>
              <p className="text-slate-400 text-sm mb-4 max-w-lg">
                The AI interview coach that listens, thinks, and answers for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button onClick={() => handleDownload('windows')} className="btn btn-primary">
                  ⬇ Windows {appVersion ? `(${appVersion})` : ''}
                </button>
                <button onClick={() => handleDownload('mac')} className="btn btn-primary">
                  ⬇ Mac {appVersion ? `(${appVersion})` : ''}
                </button>
              </div>
            </div>

            {/* Plan Card */}
            <div className="card">
              {!dataReady.user || !dataReady.sub ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/5 rounded w-16"></div>
                  <div className="h-6 bg-white/5 rounded w-24"></div>
                  <div className="h-10 bg-white/5 rounded-lg"></div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-slate-400 mb-2">Current Plan</div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{planConfig.emoji}</span>
                    <div>
                      <div className="text-lg font-black text-white leading-tight">{planConfig.name}</div>
                      <div className="text-xs text-slate-400">
                        {plan === 'free' ? 'Free tier' : 'Premium'}
                      </div>
                    </div>
                  </div>
                  {subData?.planType === 'one-time' && subData.hoursRemaining !== undefined && !planConfig.isUnlimited && (
                    <div className="text-sm text-indigo-300 mb-3">
                      {subData.hoursRemaining > 0 ? `${subData.hoursRemaining.toFixed(1)}h remaining` : 'Hours exhausted'}
                    </div>
                  )}
                  {subData?.planType === 'one-time' && planConfig.isUnlimited && subData.expiresAt && (
                    <div className="text-sm text-indigo-300 mb-3">
                      {Date.now() < subData.expiresAt ? `Expires ${new Date(subData.expiresAt).toLocaleDateString()}` : 'Expired'}
                    </div>
                  )}
                  {plan === 'free' ? (
                    <Link href="/pricing" className="btn btn-primary w-full">Upgrade →</Link>
                  ) : subData?.planType === 'one-time' && !planConfig.isUnlimited && (subData.hoursRemaining ?? 0) <= 0 ? (
                    <Link href="/pricing" className="btn btn-primary w-full">Buy Hours →</Link>
                  ) : (
                    <Link href="/pricing" className="btn btn-secondary w-full">Manage Plan</Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ==================== STATS ==================== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {!dataReady.user || !dataReady.activity ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              [
                { icon: '🧠', value: activity.totalQuestions, label: 'Questions Practiced' },
                { icon: '🎯', value: activity.totalSessions, label: 'Interview Sessions' },
                { icon: '📅', value: userData?.createdAt ? Math.max(1, Math.floor((Date.now() - userData.createdAt) / 86400000)) : 1, label: 'Days as Member' },
                { icon: planConfig.emoji, value: planConfig.name, label: 'Current Plan' },
              ].map((stat, i) => (
                <div key={i} className="card text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-black text-white leading-none mb-1">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))
            )}
          </div>

          {/* ==================== MAIN CONTENT ==================== */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Left: Onboarding / Usage / Benefits */}
            <div className="lg:col-span-2">
              {isNewUser ? (
                <div className="card border-indigo-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold">📋 Getting Started</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Complete these steps to unlock full potential</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-gradient">{onboardingProgress}/3</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Completed</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${onboardingPercent}%` }}></div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-xl border ${hasDownloaded ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasDownloaded ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-slate-400'}`}>
                          {hasDownloaded ? '✓' : '1'}
                        </div>
                        <span className="text-sm font-medium">{hasDownloaded ? 'Downloaded' : 'Download App'}</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${hasInstalled ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasInstalled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-slate-400'}`}>
                          {hasInstalled ? '✓' : '2'}
                        </div>
                        <span className="text-sm font-medium">{hasInstalled ? 'Installed' : 'Install & Sign In'}</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${hasSignedIn ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasSignedIn ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-slate-400'}`}>
                          {hasSignedIn ? '✓' : '3'}
                        </div>
                        <span className="text-sm font-medium">{hasSignedIn ? 'Signed In' : 'Start Practicing'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : plan === 'free' && usageData ? (
                <div className="card">
                  <h3 className="text-base font-bold mb-4">📊 Today&apos;s Usage</h3>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    {[
                      { label: 'AI Answers', used: Math.min(usageData.tokensUsed / 500, 3), total: 3 },
                      { label: 'Voice Minutes', used: usageData.voiceMinutes, total: 5 },
                      { label: 'Screenshots', used: usageData.screenshotsUsed, total: 2 },
                    ].map((stat, i) => {
                      const percent = Math.min((stat.used / stat.total) * 100, 100);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">{stat.label}</span>
                            <span className="text-xs text-slate-500">{Math.round(stat.used)}/{stat.total}</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h4 className="font-bold text-white mb-0.5">Need unlimited access?</h4>
                        <p className="text-sm text-slate-300">Upgrade for unlimited answers, voice mode, and screen analysis</p>
                      </div>
                      <Link href="/pricing" className="btn btn-primary">See Plans →</Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <h3 className="text-base font-bold mb-4">✨ Your Premium Benefits</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { icon: '🎯', label: 'Full AI Access', desc: 'No daily limits' },
                      { icon: '🎤', label: 'Voice Mode', desc: 'Interview practice' },
                      { icon: '💻', label: 'Screen Mode', desc: 'Invisible overlay' },
                       { icon: plan === 'power' ? '⚡' : '🚀', label: plan === 'power' ? 'Unlimited Power' : '7 Days Unlimited', desc: plan === 'power' ? 'Unlimited everything' : '7 days full access' },
                    ].map((b, i) => (
                      <div key={i} className="card text-center">
                        <div className="text-3xl mb-2">{b.icon}</div>
                        <div className="font-bold text-white text-sm mb-1">{b.label}</div>
                        <div className="text-xs text-slate-400">{b.desc}</div>
                      </div>
                    ))}
                  </div>
                  {subData && (
                    <div className="card">
                      <h3 className="font-bold mb-4">🧾 Subscription & Billing</h3>
                      {!dataReady.sub ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-white/5 rounded w-32"></div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="h-16 bg-white/5 rounded"></div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Status</div>
                              <div className="inline-flex items-center gap-2 text-green-400 font-semibold text-sm">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                {subData.status === 'active' ? 'Active' : subData.status}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Billing</div>
                              <div className="text-white font-semibold text-sm capitalize">{subData.billing || 'One-time'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Amount</div>
                              <div className="text-white font-semibold text-sm">{subData.amount ? `₹${subData.amount}` : '—'}</div>
                            </div>
                            {planConfig.billingType === 'subscription' && (
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Renews On</div>
                                <div className="text-white font-semibold text-sm">
                                  {subData.renewalDate ? new Date(subData.renewalDate).toLocaleDateString() : '—'}
                                </div>
                              </div>
                            )}
                            {planConfig.billingType === 'one_time' && !planConfig.isUnlimited && subData.hoursRemaining !== undefined && (
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Hours Left</div>
                                <div className="text-white font-semibold text-sm">{subData.hoursRemaining.toFixed(1)}h</div>
                              </div>
                            )}
                            {planConfig.billingType === 'one_time' && planConfig.isUnlimited && subData.expiresAt && (
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Expires On</div>
                                <div className="text-white font-semibold text-sm">{new Date(subData.expiresAt).toLocaleDateString()}</div>
                              </div>
                            )}
                          </div>
                          {subData.paymentId && (
                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                              <div className="text-xs text-slate-500 font-mono">Payment ID: {subData.paymentId}</div>
                              <Link href="/pricing" className="text-indigo-400 text-sm font-semibold">Change Plan →</Link>
                            </div>
                          )}
                          {planConfig.billingType === 'subscription' && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              {subData.cancelAtPeriodEnd ? (
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <p className="text-sm text-yellow-300">⏳ Won&apos;t renew. Access until {subData.renewalDate ? new Date(subData.renewalDate).toLocaleDateString() : 'period ends'}.</p>
                                  <button onClick={() => toggleCancel(false)} disabled={cancelBusy} className="text-indigo-400 text-sm font-semibold disabled:opacity-50">
                                    {cancelBusy ? 'Working…' : 'Resume plan'}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <p className="text-sm text-slate-500">Cancel anytime — access until renewal date.</p>
                                  <button onClick={() => toggleCancel(true)} disabled={cancelBusy} className="text-slate-400 hover:text-red-400 text-sm font-semibold disabled:opacity-50">
                                    {cancelBusy ? 'Working…' : 'Cancel'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Quick Actions */}
            <div className="space-y-4">
              <div className="card">
                <h3 className="text-sm font-bold mb-3">⚡ Quick Actions</h3>
                <div className="space-y-2.5">
                  <Link href="/resume" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl flex-shrink-0">📄</div>
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors">Resume Builder</div>
                      <div className="text-xs text-slate-400">ATS-ready in seconds</div>
                    </div>
                  </Link>
                  <Link href="/jobs" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-xl flex-shrink-0">💼</div>
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-green-300 transition-colors">Job Recommendations</div>
                      <div className="text-xs text-slate-400">Top tech jobs</div>
                    </div>
                  </Link>
                  <Link href="/install" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-xl flex-shrink-0">📖</div>
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-blue-300 transition-colors">Installation Guide</div>
                      <div className="text-xs text-slate-400">Step-by-step setup</div>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-bold mb-3">💬 Support</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => { setShowSupport(true); window.dispatchEvent(new Event('open-whatsapp-form')); }} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all text-center">
                    <div className="text-xl mb-1">💬</div>
                    <div className="text-xs font-semibold">WhatsApp</div>
                  </button>
                  <button onClick={() => { setShowSupport(true); setSupportTab('new'); setTicketCategory('technical'); }} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all text-center">
                    <div className="text-xl mb-1">🐛</div>
                    <div className="text-xs font-semibold">Report Bug</div>
                  </button>
                  <button onClick={() => { setShowSupport(true); setSupportTab('history'); loadMyTickets(); }} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all text-center">
                    <div className="text-xl mb-1">📋</div>
                    <div className="text-xs font-semibold">My Tickets</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== SUPPORT TICKETS ==================== */}
          {showSupport && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">💬 Support Tickets</h2>
                <button onClick={() => setShowSupport(false)} className="text-slate-400 hover:text-white text-xl px-2">✕</button>
              </div>
              <div className="flex gap-2 mb-5 border-b border-white/10 pb-3">
                <button onClick={() => setSupportTab('new')} className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${supportTab === 'new' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}>New Ticket</button>
                <button onClick={() => { setSupportTab('history'); loadMyTickets(); }} className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${supportTab === 'history' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}>My Tickets</button>
              </div>
              {supportTab === 'new' && (
                ticketStatus === 'sent' ? (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-green-400 font-semibold">Ticket submitted!</p>
                    <p className="text-slate-400 text-sm mt-1">We&apos;ll reply to {user?.email} within 24 hours.</p>
                    <button onClick={() => { setTicketStatus(''); setSupportTab('history'); loadMyTickets(); }} className="mt-4 text-indigo-400 text-sm hover:text-indigo-300">View my tickets →</button>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user || !ticketTitle.trim() || !ticketDesc.trim()) return;
                    setTicketSending(true);
                    try {
                      const idToken = await user.getIdToken();
                      const res = await fetch('/api/support/ticket', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken, title: ticketTitle.trim(), description: ticketDesc.trim(), category: ticketCategory }),
                      });
                      if (res.ok) { setTicketStatus('sent'); setTicketTitle(''); setTicketDesc(''); }
                      else setTicketStatus('error');
                    } catch { setTicketStatus('error'); }
                    setTicketSending(false);
                  }} className="space-y-4">
                    <input type="text" placeholder="Subject / Title" required value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                    <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing / Payment</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="other">Other</option>
                    </select>
                    <textarea placeholder="Describe your issue in detail…" required rows={4} value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
                    {ticketStatus === 'error' && <p className="text-red-400 text-sm">⚠ Failed to submit. Try again.</p>}
                    <button type="submit" disabled={ticketSending} className="w-full btn btn-primary disabled:opacity-50">{ticketSending ? 'Submitting…' : 'Submit Ticket →'}</button>
                  </form>
                )
              )}
              {supportTab === 'history' && (
                ticketsLoading ? <p className="text-slate-400 text-sm text-center py-6">Loading…</p> : myTickets.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm">No tickets yet.</p>
                    <button onClick={() => setSupportTab('new')} className="mt-2 text-indigo-400 text-sm hover:text-indigo-300">Submit your first ticket →</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTickets.map((t) => {
                      const hasAdminReply = t.messages.some(m => m.senderType === 'admin');
                      const isExpanded = expandedTicket === t.id;
                      const statusColor = t.status === 'resolved' ? 'text-green-400' : t.status === 'in-progress' ? 'text-yellow-400' : 'text-indigo-400';
                      return (
                        <div key={t.id} className="border border-white/10 rounded-xl overflow-hidden">
                          <button onClick={() => setExpandedTicket(isExpanded ? null : t.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left">
                            <div>
                              <span className="text-white text-sm font-semibold">{t.title}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs font-semibold ${statusColor}`}>{t.status.replace('-',' ')}</span>
                                {hasAdminReply && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Reply received</span>}
                              </div>
                            </div>
                            <span className="text-slate-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                              {t.messages.map((m, i) => (
                                <div key={i} className={`flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.senderType === 'admin' ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-100' : 'bg-white/5 border border-white/10 text-slate-300'}`}>
                                    <div className="text-xs text-slate-500 mb-1">{m.senderType === 'admin' ? '🛡 JavihAI Support' : '👤 You'} · {new Date(m.timestamp).toLocaleString()}</div>
                                    <p className="whitespace-pre-wrap">{m.message}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={loadMyTickets} className="text-slate-500 text-xs hover:text-slate-400 w-full text-center pt-1">↻ Refresh</button>
                  </div>
                )
              )}
            </div>
          )}

          {/* ==================== ACCOUNT ==================== */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">⚙️ Account Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Email', value: userData?.email || user?.email },
                { label: 'Name', value: userData?.name || 'Not set' },
                { label: 'Mobile', value: userData?.phone || 'Not set' },
                { label: 'Experience', value: userData?.experienceLevel || 'Not set' },
                { label: 'City', value: userData?.city || 'Not set' },
                { label: 'Member Since', value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '-' },
                { label: 'User ID', value: user?.uid?.slice(0, 16) + '...' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                  <div className="text-white text-sm font-medium">{item.value}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowProfilePrompt(true)} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold mt-4">
              {userData?.phone ? 'Edit details' : '+ Add phone & details'}
            </button>
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
