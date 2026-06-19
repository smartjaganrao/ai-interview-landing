import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Refund & Cancellation Policy — JavihAI',
  description: 'Our 7-day money-back guarantee, cancellation terms, and how refunds are processed.',
};

export default function RefundPage() {
  return (
    <>
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="badge mb-4">💸 Refunds</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Refund &amp; Cancellation Policy</h1>
          <p className="text-slate-400 mb-12">Last updated: June 14, 2026</p>

          <div className="prose-content space-y-8 text-slate-300 leading-relaxed">
            <p className="text-lg">
              We want you to be happy with JavihAI. If it&apos;s not the right fit, here&apos;s exactly how
              refunds and cancellations work — in plain English, no fine-print traps.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">7-day money-back guarantee</h2>
              <p>
                If you&apos;re not satisfied, you can request a <strong className="text-white">full refund within 7 days
                of your first payment</strong> — no questions asked. Email{' '}
                <a href="mailto:support@javihai.in" className="text-indigo-400 hover:text-indigo-300">support@javihai.in</a>{' '}
                from your account address and we&apos;ll process it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">What&apos;s eligible</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Your <strong className="text-white">first paid subscription</strong> (Pro or Power), monthly or yearly.</li>
                <li>The refund request reaches us <strong className="text-white">within 7 days</strong> of the charge.</li>
                <li>The request comes from the email address on the account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">What&apos;s not refundable</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Requests made <strong className="text-white">more than 7 days</strong> after payment.</li>
                <li><strong className="text-white">Renewal charges</strong> — cancel before your renewal date to avoid the next cycle (see below).</li>
                <li>Accounts terminated for violating our <a href="/terms" className="text-indigo-400 hover:text-indigo-300">Terms of Service</a>.</li>
              </ul>
              <p className="mt-3">
                Outside these cases, partial refunds may be granted at our discretion — for example, an extended
                service outage. Just reach out and we&apos;ll be fair.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Cancelling your subscription</h2>
              <p>
                You can cancel anytime from your <a href="/dashboard" className="text-indigo-400 hover:text-indigo-300">dashboard</a>.
                Cancellation stops the next renewal — you keep full access until the end of the period you&apos;ve
                already paid for. We don&apos;t charge a cancellation fee.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">How refunds are processed</h2>
              <p>
                Approved refunds are issued through <strong className="text-white">Razorpay</strong> back to your
                original payment method (UPI, card, or net banking). It typically reaches your account within{' '}
                <strong className="text-white">5–7 business days</strong>, depending on your bank. We&apos;ll email you
                a confirmation once the refund is initiated.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Contact</h2>
              <p>
                Refund or billing questions? Email{' '}
                <a href="mailto:support@javihai.in" className="text-indigo-400 hover:text-indigo-300">support@javihai.in</a>{' '}
                and we&apos;ll get back to you within 1–2 business days.
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
