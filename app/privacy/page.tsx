import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy — JavihAI',
  description: 'How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="badge mb-4">🔒 Privacy</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Privacy Policy</h1>
          <p className="text-slate-400 mb-12">Last updated: June 14, 2026</p>

          <div className="prose-content space-y-8 text-slate-300 leading-relaxed">
            <p className="text-lg">
              We take your privacy seriously. This policy explains what we collect, how we use it, and the
              choices you have. Plain English — no dark patterns.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">What we collect</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong className="text-white">Account info</strong>: email address, display name, and a Firebase-generated user ID.</li>
                <li><strong className="text-white">Subscription</strong>: your current plan, billing cycle, renewal date, and the Razorpay payment/order IDs (we never see your full card number — Razorpay handles that).</li>
                <li><strong className="text-white">Usage metrics</strong>: monthly tallies of AI answers, voice minutes, and screenshots so we can enforce plan limits and show you your dashboard.</li>
                <li><strong className="text-white">Interview content</strong>: questions and AI-generated answers from your sessions, if you opt in to cloud sync. Stored in your Firestore namespace; only you and authorized admins can read them.</li>
                <li><strong className="text-white">Diagnostics</strong>: crash reports and error logs (no personal content), used to fix bugs.</li>
              </ul>
              <p className="mt-3">We do <strong className="text-white">not</strong> record or store live interview audio. Voice is processed in real time and discarded.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">How we use it</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Provide the service (authenticate you, run AI, sync your history across devices).</li>
                <li>Bill you for your plan and prevent abuse of free-tier limits.</li>
                <li>Improve product quality through aggregate, de-identified analytics.</li>
                <li>Send essential transactional emails (password reset, payment receipts, plan changes).</li>
              </ul>
              <p className="mt-3">We don&apos;t sell your data and we don&apos;t use it to train third-party AI models.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Third-party services</h2>
              <p className="mb-3">A handful of vendors process data on our behalf — each under a data-processing agreement:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong className="text-white">Google Firebase</strong> — auth and database (Firestore). EU/US data centers.</li>
                <li><strong className="text-white">Razorpay</strong> — payment processing. PCI-DSS compliant.</li>
                <li><strong className="text-white">Vercel</strong> — web hosting and CDN.</li>
                <li><strong className="text-white">Groq</strong> — AI inference for interview answers and mock interview scoring. Queries sent for processing are not stored by Groq.</li>
                <li><strong className="text-white">Google Analytics 4</strong> — anonymous page-view and event analytics. No personal data is sent; IP addresses are anonymized. You can opt out via your browser&apos;s Do Not Track setting or a GA opt-out extension.</li>
                <li><strong className="text-white">Resend</strong> — transactional email delivery (welcome email, onboarding tips). Your email address is sent to Resend solely to deliver emails on our behalf.</li>
                <li><strong className="text-white">Adzuna</strong> — job listing data for the Jobs page. We send your search query (role, location) to Adzuna&apos;s API; no personal account data is shared.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Security</h2>
              <p>
                All traffic is encrypted in transit (TLS 1.2+). Firestore Security Rules restrict your records to
                your own user ID. Admin actions require a custom claim verified server-side and are written to an
                immutable audit log. We rotate keys periodically and review access regularly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Your rights</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong className="text-white">Access</strong> — request a copy of everything we hold on you.</li>
                <li><strong className="text-white">Correction</strong> — fix anything inaccurate.</li>
                <li><strong className="text-white">Deletion</strong> — close your account and erase your data (some billing records retained for tax compliance, max 7 years).</li>
                <li><strong className="text-white">Export</strong> — get your interview history as JSON.</li>
                <li><strong className="text-white">Object/restrict</strong> — opt out of non-essential processing.</li>
              </ul>
              <p className="mt-3">Email <a href="mailto:privacy@javihai.in" className="text-indigo-400 hover:text-indigo-300">privacy@javihai.in</a> from your account address and we&apos;ll process the request within 30 days.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Cookies</h2>
              <p>
                We use session cookies to keep you signed in. No tracking cookies, no third-party advertising
                pixels, no cross-site tracking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Children</h2>
              <p>The service isn&apos;t intended for users under 16. If we discover an underage account, we&apos;ll close it.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Changes to this policy</h2>
              <p>
                If we materially change how we handle your data, we&apos;ll email you at least 30 days before the
                change takes effect. Minor edits (typos, clarifications) may happen without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Contact</h2>
              <p>
                Questions? Reach us at{' '}
                <a href="mailto:privacy@javihai.in" className="text-indigo-400 hover:text-indigo-300">privacy@javihai.in</a>.
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
