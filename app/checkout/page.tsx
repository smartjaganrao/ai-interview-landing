'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, power: 2 };

// Razorpay Checkout is loaded from CDN at runtime; type the global for safety.
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

const planDetails = {
  pro: { name: 'Pro', monthly: 499, yearly: 4990, emoji: '🚀' },
  power: { name: 'Power', monthly: 999, yearly: 9990, emoji: '⚡' },
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const plan = (searchParams.get('plan') || 'pro') as 'pro' | 'power';
  const billing = (searchParams.get('billing') || 'monthly') as 'monthly' | 'yearly';
  const price = billing === 'yearly' ? planDetails[plan].yearly : planDetails[plan].monthly;

  const [step, setStep] = useState<'ready' | 'processing' | 'success' | 'error'>('ready');
  const [errorMsg, setErrorMsg] = useState('');
  const [billingConfigured, setBillingConfigured] = useState<boolean | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subCheckDone, setSubCheckDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/auth/signup?plan=${plan}`);
    }
  }, [user, loading, router, plan]);

  // Guard: check existing subscription before showing pay button
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'subscriptions', user.uid)).then((snap) => {
      const existing = snap.exists() ? (snap.data().plan as string) : 'free';
      const existingStatus = snap.exists() ? snap.data().status : null;
      const activePaid = existingStatus === 'active' && existing !== 'free';
      setCurrentPlan(activePaid ? existing : 'free');
      setSubCheckDone(true);
    }).catch(() => { setCurrentPlan('free'); setSubCheckDone(true); });
  }, [user]);

  /** Lightweight check: is Razorpay configured on the server? */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/razorpay/status')
      .then((res) => res.json())
      .then((data: { configured: boolean }) => {
        if (!cancelled) setBillingConfigured(data.configured);
      })
      .catch(() => { if (!cancelled) setBillingConfigured(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  const handlePay = async () => {
    if (!user) return;
    setStep('processing');
    setErrorMsg('');

    try {
      // 1) Create order on the server (amount is set server-side from PLAN_CATALOG).
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing, userId: user.uid }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Could not create order');
      }
      const order = await orderRes.json();

      // 2) Load Razorpay Checkout script.
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) throw new Error('Razorpay SDK failed to load');

      // 3) Open Razorpay modal.
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'JavihAI',
        description: `${planDetails[plan].name} plan (${billing})`,
        order_id: order.orderId,
        prefill: { email: user.email || '', name: user.displayName || '' },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => setStep('ready'),
        },
        handler: async (response) => {
          // 4) Verify signature on the server.
          try {
            // 4a) Verify signature AND persist server-side in one call.
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                // Context for server-side Firestore write
                userId: user.uid,
                plan,
                billing,
              }),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');

            // 5) Belt-and-suspenders: also write from client in case Admin SDK
            //    is not configured on the server (FIREBASE_ADMIN_SDK_JSON missing).
            const verifyData = await verifyRes.json();
            if (!verifyData.savedToFirestore) {
              const renewalDate = Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000;
              await setDoc(
                doc(db, 'subscriptions', user.uid),
                {
                  plan, status: 'active', billing, amount: price,
                  startedAt: Date.now(), renewalDate,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                },
                { merge: true }
              );
              await setDoc(doc(db, 'users', user.uid), { plan, updatedAt: Date.now() }, { merge: true });
            }

            setStep('success');
            setTimeout(() => router.push('/dashboard?upgraded=true'), 2500);
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
            setStep('error');
          }
        },
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Payment failed');
      setStep('error');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <section className="pt-32 pb-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">🔒 Secure Checkout</div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Complete Your <span className="text-gradient">Upgrade</span>
            </h1>
            <p className="text-slate-400">Razorpay-powered checkout. Cards, UPI, net banking — all supported.</p>
          </div>

          {step === 'success' && (
            <div className="max-w-2xl mx-auto card text-center animate-scale-in">
              <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center text-5xl mb-6 animate-pulse-glow">✓</div>
              <h2 className="text-3xl font-black mb-4">Payment Successful! 🎉</h2>
              <p className="text-slate-300 text-lg mb-6">
                Welcome to <span className="text-gradient font-bold">{planDetails[plan].name}</span>. Your account is upgrading…
              </p>
              <Link href="/dashboard?upgraded=true" className="btn btn-primary btn-lg">Go to Dashboard →</Link>
            </div>
          )}

          {step === 'processing' && (
            <div className="max-w-2xl mx-auto card text-center">
              <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center mb-6 animate-pulse-glow">
                <div className="animate-spin h-10 w-10 rounded-full border-4 border-white border-t-transparent"></div>
              </div>
              <h2 className="text-2xl font-black mb-2">Connecting to Razorpay…</h2>
              <p className="text-slate-400">Don&apos;t close this window.</p>
            </div>
          )}

          {step === 'error' && (
            <div className="max-w-2xl mx-auto card text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-black mb-2">Payment didn&apos;t complete</h2>
              <p className="text-slate-400 mb-6">{errorMsg || 'Please try again.'}</p>
              <button onClick={() => setStep('ready')} className="btn btn-primary">Try again</button>
            </div>
          )}

          {/* Already on same plan */}
          {step === 'ready' && subCheckDone && currentPlan === plan && (
            <div className="max-w-2xl mx-auto card text-center">
              <div className="text-5xl mb-4">{planDetails[plan].emoji}</div>
              <h2 className="text-2xl font-black mb-2">You&apos;re already on {planDetails[plan].name}</h2>
              <p className="text-slate-400 mb-6">Your subscription is active. No need to pay again.</p>
              <Link href="/dashboard" className="btn btn-primary">Go to Dashboard →</Link>
            </div>
          )}

          {/* Downgrade attempt */}
          {step === 'ready' && subCheckDone && currentPlan !== null && currentPlan !== plan &&
           (PLAN_RANK[plan] ?? 0) < (PLAN_RANK[currentPlan] ?? 0) && (
            <div className="max-w-2xl mx-auto card text-center">
              <div className="text-5xl mb-4">⬇️</div>
              <h2 className="text-2xl font-black mb-2">This is a downgrade</h2>
              <p className="text-slate-400 mb-2">
                You&apos;re currently on <strong className="text-white">{currentPlan.toUpperCase()}</strong>.
                Switching to <strong className="text-white">{plan.toUpperCase()}</strong> gives you fewer features.
              </p>
              <p className="text-slate-500 text-sm mb-6">Contact support to downgrade — we&apos;ll handle it manually and prorate your billing.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard" className="btn btn-secondary">Keep {currentPlan.toUpperCase()} →</Link>
                <button onClick={() => setStep('ready')} className="btn btn-primary"
                  style={{ display: 'none' }}>hidden</button>
              </div>
            </div>
          )}

          {step === 'ready' && (!subCheckDone || (currentPlan !== plan && (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[currentPlan ?? 'free'] ?? 0))) && (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Order Summary */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="card sticky top-32">
                  <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-2xl">
                        {planDetails[plan].emoji}
                      </div>
                      <div>
                        <div className="font-bold text-white">{planDetails[plan].name} Plan</div>
                        <div className="text-sm text-slate-400 capitalize">{billing} subscription</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹{price}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Tax (GST)</span><span>Included</span></div>
                    {billing === 'yearly' && (
                      <div className="flex justify-between text-green-400"><span>Yearly discount</span><span>-17%</span></div>
                    )}
                  </div>
                  <div className="flex justify-between items-baseline pt-4 border-t border-white/10">
                    <span className="text-lg font-semibold">Total</span>
                    <div>
                      <div className="text-3xl font-black text-gradient">₹{price}</div>
                      <div className="text-xs text-slate-400 text-right">Charged {billing}</div>
                    </div>
                  </div>
                  <div className="mt-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-300">
                    🛡️ 7-day money-back guarantee
                  </div>
                </div>
              </div>

              {/* Payment Action */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Payment</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-green-400">🔒</span> Secured by Razorpay
                    </div>
                  </div>

                  {billingConfigured === false ? (
                    <div className="p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-4">
                      <div className="text-yellow-300">
                        <strong>⏳ Real billing not yet enabled.</strong>
                        <p className="text-sm mt-2 text-yellow-200">
                          Razorpay credentials haven&apos;t been configured on the server. Your plan won&apos;t be charged or upgraded right now — please check back soon.
                        </p>
                      </div>
                      <Link href="/pricing" className="btn btn-secondary mt-4">
                        ← Back to pricing
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-sm text-indigo-200">
                        ✨ Click below to open the secure Razorpay checkout. You can pay via Visa, Mastercard, UPI, or net banking.
                      </div>

                      <button
                        onClick={handlePay}
                        disabled={billingConfigured === null}
                        className="w-full btn btn-primary btn-lg"
                        style={{ opacity: billingConfigured === null ? 0.6 : 1 }}
                      >
                        {billingConfigured === null ? 'Loading…' : `Pay ₹${price} with Razorpay →`}
                      </button>

                      <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-6">
                        <span>🔒 256-bit encryption</span>
                        <span>•</span>
                        <span>PCI-DSS compliant</span>
                        <span>•</span>
                        <span>Razorpay verified</span>
                      </div>
                      <div className="flex justify-center gap-3 text-2xl pt-2">
                        <span title="Visa">💳</span>
                        <span title="Mastercard">💳</span>
                        <span title="UPI">📱</span>
                        <span title="Net Banking">🏦</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
