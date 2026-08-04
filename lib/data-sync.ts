import { db } from '@/lib/firebase';
import { doc, getDoc, getCountFromServer, query, collection, where } from 'firebase/firestore';
import { migratePlanId } from '@/lib/pricing-config';
import { store } from '@/lib/redux-store';
import { setUser, clearUser } from '@/lib/slices/userSlice';
import { setSubscription as setSubAction, clearSubscription } from '@/lib/slices/subscriptionSlice';
import { setUsage as setUsageAction, clearUsage } from '@/lib/slices/usageSlice';

export interface UserData {
  email: string;
  name: string;
  plan: string;
  createdAt: number;
  phone?: string;
  experienceLevel?: string;
  city?: string;
  referralSource?: string;
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
    const userData: UserData = {
      email: (data.email as string) || '',
      name: (data.name as string) || 'User',
      plan: migratePlanId((data.plan as string) || 'free'),
      createdAt: (data.createdAt as number) || Date.now(),
      phone: data.phone as string | undefined,
      experienceLevel: data.experienceLevel as string | undefined,
      city: data.city as string | undefined,
      referralSource: data.referralSource as string | undefined,
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
}> {
  const [user, subscription, usage, activity] = await Promise.all([
    syncUserData(uid),
    syncSubscriptionData(uid),
    syncUsageData(uid),
    syncActivityData(uid),
  ]);
  return { user, subscription, usage, activity };
}

export function clearAllData(): void {
  store.dispatch(clearUser());
  store.dispatch(clearSubscription());
  store.dispatch(clearUsage());
}
