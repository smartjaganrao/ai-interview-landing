import Footer from '@/components/Footer';

export const metadata = {
  title: { absolute: 'Terms of Service — JavihAI' },
  description: 'JavihAI terms of service: acceptable use, subscriptions & billing, refunds, the referral program, AI disclaimer, and account termination — for the AI interview copilot.',
};

export default function TermsPage() {
  return (
    <>

      <section className="pt-12 sm:pt-16 md:pt-20 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="badge mb-4">📜 Terms</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Terms of Service</h1>
          <p className="text-[#78716C] mb-12">Last updated: September 11, 2026</p>

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
                <li>Notify us immediately at <a href="mailto:javihaiofficial@gmail.com" className="text-indigo-400 hover:text-indigo-300">javihaiofficial@gmail.com</a> if you suspect unauthorized access.</li>
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
              <h2 className="text-2xl font-bold text-white mb-3">5. AI training &amp; your data</h2>
              <p>
                We do not use the content of your interview questions, your spoken audio, or JavihAI&apos;s
                answers to train or fine-tune AI models — ours or any third party&apos;s. Audio is transcribed
                and discarded per our <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a>; a small sample of
                anonymized product-usage metrics (not interview content) may be used to improve product
                quality and reliability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">6. Interview conduct &amp; your responsibility</h2>
              <p>
                JavihAI is a preparation and assistance tool. You are solely responsible for complying with
                any policy, rule, or code of conduct set by an employer, recruiter, examination body, or
                platform regarding the use of AI assistance during an interview or assessment, and for any
                consequences of using JavihAI in a context where such assistance is not permitted. We do not
                represent or warrant that using JavihAI will comply with any specific employer&apos;s or
                platform&apos;s policies, and we are not liable for outcomes arising from your decision to use
                it in a given interview.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">7. Subscriptions &amp; billing</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Paid plans renew automatically until canceled. You can cancel anytime from your dashboard — changes take effect at the end of the current billing period.</li>
                <li>Prices are shown in INR and exclude applicable taxes unless stated otherwise.</li>
                <li>If a payment fails, we&apos;ll retry for up to 7 days before downgrading you to the free tier.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">8. Refunds</h2>
              <p>
                We offer a <strong className="text-white">7-day money-back guarantee</strong> on your first paid subscription. If you&apos;re not satisfied within 7 days of your first payment, email <a href="mailto:javihaiofficial@gmail.com" className="text-indigo-400 hover:text-indigo-300">javihaiofficial@gmail.com</a> for a full refund — no questions asked. After the 7 days, partial refunds may be granted at our discretion (e.g., extended service outages). See our full <a href="/refund" className="text-indigo-400 hover:text-indigo-300">Refund &amp; Cancellation Policy</a> for details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">9. Referral &amp; credit program</h2>
              <p>
                If you participate in our referral program, you and a person you refer each receive ₹100 in
                account credit once they complete their first paid purchase using your referral link. Credit
                has no cash value, cannot be transferred or redeemed for cash, expires 12 months after it is
                issued, and may be reversed if we determine it was obtained through fraud, self-referral, or
                abuse of the program. We may modify or discontinue the referral program, or the credit amount,
                at any time; credit already issued remains valid subject to the terms above.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">10. Intellectual property</h2>
              <p>
                The service, including the app, branding, and AI prompts, is ours and is protected by copyright
                and other laws. You may use the service for personal interview prep. Your interview content
                remains yours — we don&apos;t claim rights to your questions or answers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">11. AI disclaimer</h2>
              <p>
                AI-generated answers may be inaccurate, biased, or outdated. Treat them as drafts — not as
                professional advice. Verify any factual claims before relying on them in a real interview.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">12. Service availability</h2>
              <p>
                We aim for high uptime but don&apos;t guarantee it. We may temporarily suspend the service for
                maintenance or upgrades. If a paid plan is significantly disrupted, we&apos;ll credit your account
                proportionally on request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">13. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, our total liability for any claim is limited to the
                amount you paid us in the 12 months preceding the claim. We&apos;re not liable for indirect or
                consequential damages (lost income, missed opportunities, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">14. Indemnification</h2>
              <p>
                You agree to indemnify and hold us harmless from any claim, loss, or damage (including
                reasonable legal fees) arising from your violation of these terms, your misuse of the
                service, or your violation of any third party&apos;s rights, including an employer&apos;s or
                platform&apos;s interview-conduct policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">15. Termination</h2>
              <p>
                You can close your account anytime from your dashboard. We may suspend or terminate accounts that
                violate these terms after notice (immediate for severe violations). On termination, your right
                to use the service ends; we&apos;ll delete your data per the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">16. Force majeure</h2>
              <p>
                We&apos;re not liable for delays or failures caused by events beyond our reasonable control,
                including internet or power outages, third-party service or vendor failures, natural
                disasters, or government action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">17. General provisions</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>If any provision of these terms is found unenforceable, the rest remain in full effect.</li>
                <li>These terms, along with the Privacy Policy and Refund &amp; Cancellation Policy, are the entire agreement between you and us regarding the service.</li>
                <li>Our failure to enforce a provision isn&apos;t a waiver of our right to do so later.</li>
                <li>You may not assign these terms without our consent; we may assign them in connection with a merger, acquisition, or sale of assets.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">18. Changes to these terms</h2>
              <p>
                We may update these terms occasionally. Material changes will be notified by email at least 30
                days in advance. Continued use after the effective date constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">19. Dispute resolution &amp; governing law</h2>
              <p>
                These terms are governed by the laws of India. If a dispute isn&apos;t resolved informally
                within 30 days of written notice to <a href="mailto:javihaiofficial@gmail.com" className="text-indigo-400 hover:text-indigo-300">javihaiofficial@gmail.com</a>, it will be referred to
                and finally resolved by arbitration in Bengaluru, Karnataka under the Arbitration and
                Conciliation Act, 1996, by a sole arbitrator, in English. This doesn&apos;t limit either
                party&apos;s right to seek injunctive relief in the courts of Bengaluru, Karnataka for matters
                like unauthorized use of our intellectual property.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">20. Contact</h2>
              <p>
                Questions about these terms? Email{' '}
                <a href="mailto:javihaiofficial@gmail.com" className="text-indigo-400 hover:text-indigo-300">javihaiofficial@gmail.com</a>.
              </p>
            </section>

            <section className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-[#92650C] mb-2">
                ⚠️ <strong>Note:</strong> This template was drafted in plain English to be readable. Before going to a wide audience, have a lawyer in your jurisdiction review it.
              </p>
              <p className="text-sm text-[#92650C]/90">
                Sections 5, 6, 9, 14, 16, 17, and 19 are new drafting (added September 11, 2026) and haven&apos;t been reviewed at all yet — flag these to counsel specifically: the interview-conduct clause (§6) for enforceability and whether it needs employer-specific carve-outs; the arbitration clause (§19) for seat/venue and whether a sole arbitrator is appropriate at this scale; whether a designated Grievance Officer is required under India&apos;s IT Rules, 2021 given the volume of users; and whether the 16-year-old contract-capacity threshold in §1 is actually valid under the Indian Contract Act for a paid service.
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
