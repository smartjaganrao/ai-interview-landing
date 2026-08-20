import { db } from '@/lib/firebase';
import { doc, getDoc, getCountFromServer, query, collection, where } from 'firebase/firestore';
import { migratePlanId } from '@/lib/pricing-config';
import { store } from '@/lib/redux-store';
import { setUser, clearUser, type UserData } from '@/lib/slices/userSlice';
import { setSubscription as setSubAction, clearSubscription } from '@/lib/slices/subscriptionSlice';
import { setUsage as setUsageAction, clearUsage } from '@/lib/slices/usageSlice';

const DASHBOARD_CACHE_KEY = 'dashboard_data_cache';
const DASHBOARD_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface CachedDashboardData {
  user: UserData | null;
  subscription: SubscriptionData | null;
  usage: UsageData | null;
  activity: ActivityData;
  ts: number;
}

function readDashboardCache(uid: string): CachedDashboardData | null {
  try {
    const raw = localStorage.getItem(`${DASHBOARD_CACHE_KEY}:${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDashboardData;
    if (Date.now() - parsed.ts > DASHBOARD_CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDashboardCache(uid: string, data: CachedDashboardData): void {
  try {
    localStorage.setItem(`${DASHBOARD_CACHE_KEY}:${uid}`, JSON.stringify(data));
  } catch {
    // quota / private mode — ignore
  }
}

export function clearDashboardCache(uid?: string): void {
  try {
    if (uid) {
      localStorage.removeItem(`${DASHBOARD_CACHE_KEY}:${uid}`);
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith(DASHBOARD_CACHE_KEY))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch {
    // ignore
  }
}

export interface SubscriptionData {
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

export interface UsageData {
  tokensUsed: number;
  voiceMinutes: number;
  screenshotsUsed: number;
}

export interface ActivityData {
  totalSessions: number;
  totalQuestions: number;
}

function getDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function syncUserData(uid: string): Promise<UserData | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    const profile = data.profile as Record<string, unknown> | undefined;
    const acquisition = data.acquisition as Record<string, unknown> | undefined;
    const userData: UserData = {
      email: (data.email as string) || '',
      name: (data.name as string) || 'User',
      plan: migratePlanId((data.plan as string) || 'free'),
      createdAt: (data.createdAt as number) || Date.now(),
      phone: (profile?.whatsapp as string) || (data.phone as string) || undefined,
      fullName: (profile?.fullName as string) || (data.fullName as string) || undefined,
      whatsapp: (profile?.whatsapp as string) || (data.whatsapp as string) || undefined,
      experienceLevel: (profile?.experienceLevel as string) || (data.experienceLevel as string) || undefined,
      jobRole: (profile?.jobRole as string) || (data.jobRole as string) || undefined,
      city: (profile?.city as string) || (data.city as string) || undefined,
      referralSource: (data.referralSource as string) || (acquisition?.customerSelectedSource as string) || undefined,
      profileCompleted: (profile?.profileCompleted as boolean) || false,
      acquisition: acquisition as UserData['acquisition'],
    };
    store.dispatch(setUser(userData));
    return userData;
  } catch (err) {
    console.error('[data-sync] failed to sync user:', err);
    return null;
  }
}

export async function syncSubscriptionData(uid: string): Promise<SubscriptionData | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'subscriptions', uid));
    if (!snap.exists()) {
      store.dispatch(setSubAction({
        plan: 'free',
        status: 'active',
        startedAt: Date.now(),
      }));
      return null;
    }
    const data = snap.data() as Record<string, unknown>;
    const subData: SubscriptionData = {
      plan: migratePlanId((data.plan as string) || 'free'),
      status: (data.status as string) || 'active',
      billing: data.billing as SubscriptionData['billing'],
      amount: data.amount as number | undefined,
      startedAt: data.startedAt as number | undefined,
      renewalDate: data.renewalDate as number | undefined,
      paymentId: data.paymentId as string | undefined,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd as boolean | undefined,
      planType: data.planType as SubscriptionData['planType'],
      hoursPurchased: data.hoursPurchased as number | undefined,
      hoursRemaining: data.hoursRemaining as number | undefined,
      expiresAt: data.expiresAt as number | undefined,
    };
    store.dispatch(setSubAction(subData));
    return subData;
  } catch (err) {
    console.error('[data-sync] failed to sync subscription:', err);
    return null;
  }
}

export async function syncUsageData(uid: string): Promise<UsageData | null> {
  if (!db) return null;
  try {
    const dateKey = getDayKey();
    const snap = await getDoc(doc(db, 'usage_tracking', uid, 'days', dateKey));
    const usageData: UsageData = snap.exists()
      ? (snap.data() as UsageData)
      : { tokensUsed: 0, voiceMinutes: 0, screenshotsUsed: 0 };
    store.dispatch(setUsageAction(usageData));
    return usageData;
  } catch (err) {
    console.error('[data-sync] failed to sync usage:', err);
    return null;
  }
}

export async function syncActivityData(uid: string): Promise<ActivityData> {
  if (!db) return { totalSessions: 0, totalQuestions: 0 };
  try {
    const [sessCount, msgCount] = await Promise.all([
      getCountFromServer(query(collection(db, 'interview_sessions'), where('userId', '==', uid))),
      getCountFromServer(query(collection(db, 'interview_messages'), where('userId', '==', uid))),
    ]);
    return {
      totalSessions: sessCount.data().count,
      totalQuestions: msgCount.data().count,
    };
  } catch {
    return { totalSessions: 0, totalQuestions: 0 };
  }
}

export async function refreshAllData(uid: string): Promise<{
  user: UserData | null;
  subscription: SubscriptionData | null;
  usage: UsageData | null;
  activity: ActivityData;
  ts: number;
}> {
  // Serve from localStorage cache if fresh (avoids Firestore reads on
  // dashboard re-navigation / tab switches).
  const cached = readDashboardCache(uid);
  if (cached) {
    if (cached.user) store.dispatch(setUser(cached.user));
    if (cached.subscription) store.dispatch(setSubAction(cached.subscription));
    if (cached.usage) store.dispatch(setUsageAction(cached.usage));
    return cached;
  }

  const [user, subscription, usage, activity] = await Promise.all([
    syncUserData(uid),
    syncSubscriptionData(uid),
    syncUsageData(uid),
    syncActivityData(uid),
  ]);
  const result = { user, subscription, usage, activity, ts: Date.now() };
  writeDashboardCache(uid, result);
  return result;
}

export function clearAllData(): void {
  store.dispatch(clearUser());
  store.dispatch(clearSubscription());
  store.dispatch(clearUsage());
  clearDashboardCache();
}
