'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const plan = (searchParams.get('plan') || 'pro') as 'pro' | 'power';
  const billing = (searchParams.get('billing') || 'monthly') as 'monthly' | 'yearly';

  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [expiry, setExpiry] = useState('12/26');
  const [cvv, setCvv] = useState('123');
  const [cardName, setCardName] = useState('');

  const planDetails = {
    pro: { name: 'Pro', monthly: 499, yearly: 4990 },
    power: { name: 'Power', monthly: 999, yearly: 9990 },
  };

  const price = billing === 'yearly' ? planDetails[plan].yearly : planDetails[plan].monthly;

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/auth/signup?plan=${plan}`);
    }
  }, [user, loading, router, plan]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProcessing(true);
    setStep('processing');

    // Simulate Razorpay processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      // Update Firestore subscription
      await setDoc(
        doc(db, 'subscriptions', user.uid),
        {
          plan: plan,
          status: 'active',
          billing: billing,
          amount: price,
          startedAt: Date.now(),
          renewalDate: Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000,
          paymentId: `pay_simulated_${Date.now()}`,
          orderId: `order_simulated_${Date.now()}`,
        },
        { merge: true }
      );

      // Update user plan
      await setDoc(
        doc(db, 'users', user.uid),
        {
          plan: plan,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      setStep('success');

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard?upgraded=true');
      }, 3000);
    } catch (err) {
      console.error('Payment processing error:', err);
      setProcessing(false);
      setStep('form');
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
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
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="badge mb-4">🔒 Secure Checkout</div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Complete Your <span className="text-gradient">Upgrade</span>
            </h1>
            <p className="text-slate-400">You&apos;re moments away from unlocking your full potential</p>
          </div>

          {step === 'success' ? (
            <div className="max-w-2xl mx-auto card text-center animate-scale-in">
              <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center text-5xl mb-6 animate-pulse-glow">
                ✓
              </div>
              <h2 className="text-3xl font-black mb-4">Payment Successful! 🎉</h2>
              <p className="text-slate-300 text-lg mb-6">
                Welcome to <span className="text-gradient font-bold">{planDetails[plan].name}</span>!
                Your account has been upgraded.
              </p>
              <div className="card bg-green-500/10 border-green-500/30 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Plan</span>
                  <span className="text-white font-semibold">{planDetails[plan].name} ({billing})</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Amount Charged</span>
                  <span className="text-white font-semibold">₹{price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-green-400 font-semibold">✓ Active</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-6">Redirecting to dashboard...</p>
              <Link href="/dashboard?upgraded=true" className="btn btn-primary btn-lg">
                Go to Dashboard →
              </Link>
            </div>
          ) : step === 'processing' ? (
            <div className="max-w-2xl mx-auto card text-center">
              <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center mb-6 animate-pulse-glow">
                <div className="animate-spin h-10 w-10 rounded-full border-4 border-white border-t-transparent"></div>
              </div>
              <h2 className="text-2xl font-black mb-4">Processing Payment...</h2>
              <p className="text-slate-400 mb-8">Please don&apos;t close this window</p>
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-300">Card validated</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-300">Connecting to Razorpay</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="animate-spin h-3 w-3 rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  <span className="text-slate-300">Processing transaction...</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Order Summary */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="card sticky top-32">
                  <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-2xl`}>
                        {plan === 'pro' ? '🚀' : '⚡'}
                      </div>
                      <div>
                        <div className="font-bold text-white">{planDetails[plan].name} Plan</div>
                        <div className="text-sm text-slate-400">{billing === 'yearly' ? 'Yearly' : 'Monthly'} subscription</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {(plan === 'pro' ? [
                        'Unlimited AI answers',
                        'Unlimited voice minutes',
                        'Cloud history sync',
                        'Priority support',
                      ] : [
                        'Everything in Pro',
                        'Priority AI models',
                        'GPT-4 + Claude',
                        '1-on-1 coaching',
                      ]).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-300">
                          <span className="text-green-400">✓</span> {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>₹{price}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tax (GST)</span>
                      <span>Included</span>
                    </div>
                    {billing === 'yearly' && (
                      <div className="flex justify-between text-green-400">
                        <span>Yearly discount</span>
                        <span>-17%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline pt-4 border-t border-white/10">
                    <span className="text-lg font-semibold">Total</span>
                    <div>
                      <div className="text-3xl font-black text-gradient">₹{price}</div>
                      <div className="text-xs text-slate-400 text-right">
                        Charged {billing === 'yearly' ? 'yearly' : 'monthly'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-300">
                    🛡️ 30-day money-back guarantee
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Payment Details</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-green-400">🔒</span> Secured by Razorpay
                    </div>
                  </div>

                  {/* Demo notice */}
                  <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="text-sm text-yellow-300">
                      <strong>⚡ Demo Mode:</strong> This is a simulated payment. No real charges will be made.
                      Form is pre-filled with test card details.
                    </div>
                  </div>

                  <form onSubmit={handlePayment} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="As shown on card"
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="input pl-12"
                          maxLength={19}
                          required
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">💳</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Expiry</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="input"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">CVV</label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="123"
                          className="input"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Billing Email</label>
                      <input
                        type="email"
                        value={user.email || ''}
                        readOnly
                        className="input bg-slate-800/50 cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full btn btn-primary btn-lg disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : `Pay ₹${price} →`}
                    </button>

                    <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-4">
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
                  </form>
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
