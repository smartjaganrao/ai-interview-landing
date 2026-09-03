import { describe, it, expect } from 'vitest';
import { couponIsValid, applyCouponDiscount, nextIstMidnight, type CouponRecord } from './firebase-admin';

function makeCoupon(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    code: 'TEST10',
    label: 'Test coupon',
    discountType: 'percent',
    discountValue: 10,
    appliesTo: 'all',
    active: true,
    featured: false,
    popup: false,
    expiresAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('couponIsValid', () => {
  it('accepts an active, non-expired coupon that applies to all plans', () => {
    expect(couponIsValid(makeCoupon(), 'pro')).toBe(true);
  });

  it('rejects an inactive coupon', () => {
    expect(couponIsValid(makeCoupon({ active: false }), 'pro')).toBe(false);
  });

  it('rejects a coupon that has expired', () => {
    const expired = makeCoupon({ expiresAt: Date.now() - 1000 });
    expect(couponIsValid(expired, 'pro')).toBe(false);
  });

  it('accepts a coupon with a future expiry', () => {
    const notYetExpired = makeCoupon({ expiresAt: Date.now() + 60_000 });
    expect(couponIsValid(notYetExpired, 'pro')).toBe(true);
  });

  it('rejects a coupon scoped to a different plan', () => {
    const proOnly = makeCoupon({ appliesTo: 'pro' });
    expect(couponIsValid(proOnly, 'power')).toBe(false);
  });

  it('accepts a coupon scoped to the matching plan', () => {
    const proOnly = makeCoupon({ appliesTo: 'pro' });
    expect(couponIsValid(proOnly, 'pro')).toBe(true);
  });

  it('rejects undefined (no such coupon)', () => {
    expect(couponIsValid(undefined, 'pro')).toBe(false);
  });
});

describe('applyCouponDiscount', () => {
  it('applies a percent discount, rounded', () => {
    expect(applyCouponDiscount(999, makeCoupon({ discountType: 'percent', discountValue: 10 }))).toBe(899);
  });

  it('applies a flat discount', () => {
    expect(applyCouponDiscount(999, makeCoupon({ discountType: 'flat', discountValue: 100 }))).toBe(899);
  });

  it('never drops the price below ₹1, even with a discount larger than the base price', () => {
    expect(applyCouponDiscount(50, makeCoupon({ discountType: 'flat', discountValue: 500 }))).toBe(1);
    expect(applyCouponDiscount(50, makeCoupon({ discountType: 'percent', discountValue: 100 }))).toBe(1);
  });
});

describe('nextIstMidnight', () => {
  it('returns tonight\'s midnight IST when currently within the last hour before it', () => {
    // 2026-09-03T18:00:00Z = 2026-09-03 23:30 IST (11:30pm)
    const now = Date.parse('2026-09-03T18:00:00Z');
    const result = nextIstMidnight(now);
    expect(new Date(result).toISOString()).toBe('2026-09-03T18:30:00.000Z'); // midnight IST = 18:30 UTC
  });

  it('returns the *next* day\'s midnight IST just after midnight has passed', () => {
    // 2026-09-03T19:00:00Z = 2026-09-04 00:30 IST — just past midnight
    const now = Date.parse('2026-09-03T19:00:00Z');
    const result = nextIstMidnight(now);
    expect(new Date(result).toISOString()).toBe('2026-09-04T18:30:00.000Z');
  });

  it('is always in the future relative to now', () => {
    // Arbitrary mid-afternoon IST timestamp, far from any boundary.
    const now = Date.parse('2026-09-03T09:00:00Z'); // 2:30pm IST
    expect(nextIstMidnight(now)).toBeGreaterThan(now);
  });

  it('rolls over a month boundary correctly', () => {
    // 2026-08-31T20:00:00Z = 2026-09-01 01:30 IST
    const now = Date.parse('2026-08-31T20:00:00Z');
    const result = nextIstMidnight(now);
    expect(new Date(result).toISOString()).toBe('2026-09-01T18:30:00.000Z');
  });
});
