import { NextResponse } from 'next/server';
import { isRazorpayConfigured } from '@/lib/razorpay-server';

export const dynamic = 'force-dynamic';

/** GET — lightweight check: is Razorpay configured? No order creation. */
export async function GET() {
  return NextResponse.json({ configured: isRazorpayConfigured() });
}
