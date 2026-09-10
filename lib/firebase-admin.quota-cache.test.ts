import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mocks Firestore reads so this exercises the real checkAiQuota() caching
// logic without touching production data (this project has no dev/staging
// Firestore — see ../CLAUDE.md).
const usersGet = vi.fn();
const usageGet = vi.fn();
const subscriptionsGet = vi.fn();

vi.mock('firebase-admin', () => ({
  apps: [{}], // pretend already initialized so init() skips service-account parsing
  firestore: () => ({
    collection: (name: string) => {
      if (name === 'users') return { doc: () => ({ get: usersGet }) };
      if (name === 'usage_tracking') {
        return { doc: () => ({ collection: () => ({ doc: () => ({ get: usageGet }) }) }) };
      }
      if (name === 'subscriptions') return { doc: () => ({ get: subscriptionsGet }) };
      throw new Error(`unexpected collection: ${name}`);
    },
  }),
}));

vi.mock('./email', () => ({ sendQuotaUpgradeNudge: vi.fn() }));

const activeUser = (plan = 'free') => ({ exists: true, data: () => ({ status: 'active', plan }) });
const bannedUser = () => ({ exists: true, data: () => ({ status: 'banned', plan: 'free' }) });
// 'mic' is the feature exercised throughout this file (limit 10, same number
// the old single-bucket model used, to keep the test diff minimal).
const usage = (micUsed = 0) => ({ exists: true, data: () => ({ micUsed }) });
const noSubscription = { exists: false, data: () => undefined };

describe('checkAiQuota caching (banCache 10s / quotaCache 2min split)', () => {
  let now: number;

  beforeEach(() => {
    now = Date.parse('2026-01-01T00:00:00.000Z');
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    usersGet.mockReset();
    usageGet.mockReset();
    subscriptionsGet.mockReset().mockResolvedValue(noSubscription);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads users+usage once, then serves both from cache on an immediate repeat call', async () => {
    const { checkAiQuota } = await import('./firebase-admin');
    usersGet.mockResolvedValue(activeUser());
    usageGet.mockResolvedValue(usage(0));

    const first = await checkAiQuota('uid-fresh', 'mic');
    expect(first).toEqual({ allowed: true, plan: 'free', used: 0, limit: 10, feature: 'mic' });
    expect(usersGet).toHaveBeenCalledTimes(1);
    expect(usageGet).toHaveBeenCalledTimes(1);

    const second = await checkAiQuota('uid-fresh', 'mic');
    expect(second).toEqual(first);
    expect(usersGet).toHaveBeenCalledTimes(1); // still cached
    expect(usageGet).toHaveBeenCalledTimes(1); // still cached
  });

  it('re-checks ban after 10s but keeps serving usage from the 2-minute quota cache', async () => {
    const { checkAiQuota } = await import('./firebase-admin');
    usersGet.mockResolvedValue(activeUser());
    usageGet.mockResolvedValue(usage(1)); // 1 answer used

    await checkAiQuota('uid-split-ttl', 'mic');
    expect(usersGet).toHaveBeenCalledTimes(1);
    expect(usageGet).toHaveBeenCalledTimes(1);

    now += 15 * 1000; // past BAN_CACHE_TTL (10s), well before QUOTA_CACHE_TTL (2min)
    const result = await checkAiQuota('uid-split-ttl', 'mic');

    expect(usersGet).toHaveBeenCalledTimes(2); // ban re-checked
    expect(usageGet).toHaveBeenCalledTimes(1); // usage/quota still cached
    expect(result).toMatchObject({ allowed: true, used: 1, limit: 10 });
  });

  it('blocks a banned user immediately and re-verifies the ban within ~10s, not 2 minutes', async () => {
    const { checkAiQuota } = await import('./firebase-admin');
    usersGet.mockResolvedValue(bannedUser());

    const first = await checkAiQuota('uid-banned', 'mic');
    expect(first).toEqual({ allowed: false, plan: 'free', used: 0, limit: 0, feature: 'mic', banned: true });
    expect(usersGet).toHaveBeenCalledTimes(1);
    expect(usageGet).not.toHaveBeenCalled(); // never reached — banned short-circuits before it

    now += 5 * 1000; // still within the 10s ban cache
    await checkAiQuota('uid-banned', 'mic');
    expect(usersGet).toHaveBeenCalledTimes(1); // still cached

    now += 10 * 1000; // now past the 10s ban cache (15s total)
    await checkAiQuota('uid-banned', 'mic');
    expect(usersGet).toHaveBeenCalledTimes(2); // re-verified, not stuck for the full 2-minute window
  });
});
