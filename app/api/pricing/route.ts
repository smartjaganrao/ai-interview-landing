import { NextResponse } from 'next/server';
import { getDynamicPricing } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET — public plan prices + the active offer, for the pricing & checkout pages.
 * Reads settings/pricing server-side (Admin SDK); the doc itself stays locked to
 * clients in Firestore rules. Prices are public, so exposing them here is safe.
 *
 * Access-Control-Allow-Origin is required here: the desktop app's
 * useLivePricing.ts fetches this cross-origin (from a localhost origin, in
 * both dev and packaged builds — never the same origin as javihai.in), and a
 * fetch() without a CORS header on the response doesn't just miss a header,
 * it REJECTS with "Failed to fetch" — confirmed directly. Without this, the
 * desktop app's live-pricing fetch failed every time, in every environment,
 * silently falling back to the hardcoded (and stale) prices in
 * fallbackPricing(), which is the "mock data" users were actually seeing in
 * the upgrade prompt instead of real current prices. This is public,
 * non-sensitive, unauthenticated data — a wildcard origin is safe here.
 */
export async function GET() {
  const pricing = await getDynamicPricing();
  return NextResponse.json(pricing, {
    headers: {
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
