import { NextResponse } from 'next/server';
import { getDynamicPricing } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET — public plan prices + the active offer, for the pricing & checkout pages.
 * Reads settings/pricing server-side (Admin SDK); the doc itself stays locked to
 * clients in Firestore rules. Prices are public, so exposing them here is safe.
 */
export async function GET() {
  const pricing = await getDynamicPricing();
  return NextResponse.json(pricing, {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
  });
}
