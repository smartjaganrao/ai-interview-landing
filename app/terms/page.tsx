import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service — JavihAI',
  description: 'The rules of using our service.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="badge mb-4">📜 Terms</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Terms of Service</h1>
          <p className="text-slate-400 mb-12">Last updated: May 28, 2026</p>

          <div className="prose-content space-y-8 text-slate-300 leading-relaxed">
            <p className="text-lg">
              These terms govern your use of JavihAI. Using the service means you agree to them.
              Read carefully — and ping us if anything is unclear.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">1. Who can use the service</h2>
              <p>You must be at least 16 years old and able to form a binding contract under the laws of your jurisdiction. You also agree to follow your local laws while using the service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">2. What the service does</h2>
              <p>
                We provide AI-assisted interview preparation: real-time answer suggestions, voice analysis, and
                practice tooling. We <strong className="text-white">do not</strong> guarantee employment outcomes — the AI is a coach,
                not a hiring manager.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">3. Your account</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Keep your credentials confidential. You&apos;re responsible for activity on your account.</li>
                <li>Don&apos;t share accounts. Each person needs their own.</li>
                <li>Notify us immediately at <a href="mailto:support@aiinterview.com" className="text-indigo-400 hover:text-indigo-300">support@aiinterview.com</a> if you suspect unauthorized access.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">4. Acceptable use</h2>
              <p className="mb-3">You won&apos;t:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Scrape, reverse-engineer, or attempt to extract our AI models or prompts.</li>
                <li>Use the service to harass, defraud, or impersonate anyone.</li>
                <li>Resell or sublicense access without our written permission.</li>
                <li>Probe or attack our infrastructure or that of our vendors.</li>
                <li>Bypass plan limits, e.g., by creating multiple free accounts.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">5. Subscriptions &amp; billing</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Paid plans renew automatically until canceled. You can cancel anytime from your dashboard — changes take effect at the end of the current billing period.</li>
                <li>Prices are shown in INR and exclude applicable taxes unless stated otherwise.</li>
                <li>If a payment fails, we&apos;ll retry for up to 7 days before downgrading you to the free tier.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">6. Refunds</h2>
              <p>
                We offer a <strong className="text-white">30-day money-back guarantee</strong> on your first paid month. If you&apos;re not satisfied within 30 days of your first payment, email <a href="mailto:billing@aiinterview.com" className="text-indigo-400 hover:text-indigo-300">billing@aiinterview.com</a> for a full refund — no questions asked. After the 30 days, partial refunds may be granted at our discretion (e.g., extended service outages).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">7. Intellectual property</h2>
              <p>
                The service, including the app, branding, and AI prompts, is ours and is protected by copyright
                and other laws. You may use the service for personal interview prep. Your interview content
                remains yours — we don&apos;t claim rights to your questions or answers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">8. AI disclaimer</h2>
              <p>
                AI-generated answers may be inaccurate, biased, or outdated. Treat them as drafts — not as
                professional advice. Verify any factual claims before relying on them in a real interview.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">9. Service availability</h2>
              <p>
                We aim for high uptime but don&apos;t guarantee it. We may temporarily suspend the service for
                maintenance or upgrades. If a paid plan is significantly disrupted, we&apos;ll credit your account
                proportionally on request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">10. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, our total liability for any claim is limited to the
                amount you paid us in the 12 months preceding the claim. We&apos;re not liable for indirect or
                consequential damages (lost income, missed opportunities, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">11. Termination</h2>
              <p>
                You can close your account anytime from your dashboard. We may suspend or terminate accounts that
                violate these terms after notice (immediate for severe violations). On termination, your right
                to use the service ends; we&apos;ll delete your data per the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">12. Changes to these terms</h2>
              <p>
                We may update these terms occasionally. Material changes will be notified by email at least 30
                days in advance. Continued use after the effective date constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">13. Governing law</h2>
              <p>
                These terms are governed by the laws of India. Disputes will be resolved in the courts of
                Bengaluru, Karnataka.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">14. Contact</h2>
              <p>
                Questions about these terms? Email{' '}
                <a href="mailto:legal@aiinterview.com" className="text-indigo-400 hover:text-indigo-300">legal@aiinterview.com</a>.
              </p>
            </section>

            <section className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-300">
                ⚠️ <strong>Note:</strong> This template was drafted in plain English to be readable. Before going to a wide audience, have a lawyer in your jurisdiction review it.
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
