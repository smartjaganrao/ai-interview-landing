import { Resend } from 'resend';
import { PlanId } from './pricing-config';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'JavihAI <javihaiofficial@gmail.com>';

const PLAN_NAMES: Record<PlanId, string> = {
  free: 'Free',
  quick_pass: 'Quick Pass',
  pro: 'Pro',
  power: 'Power',
};
const PLAN_EMOJI: Record<PlanId, string> = {
  free: '🎯',
  quick_pass: '🎟️',
  pro: '🚀',
  power: '⚡',
};
const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: ['Limited AI usage', 'Explore core features', 'Limited trial experience'],
  quick_pass: ['Full AI Interview Assistant', 'Voice Mode', 'Screen Mode', 'Coding Interview Support', 'HR Interview Support'],
  pro: ['AI Interview Assistant', 'Voice Mode', 'Screen Mode', 'Coding Interview Support', 'HR Interview Support', 'Resume Analysis', 'Company-specific interview support'],
  power: ['Everything in Pro', 'Unlimited Usage', 'AI Mock Interview', 'AI Interview Evaluation', 'AI Interview Score', 'Performance Analytics', 'Personalized Improvement Plan', 'Priority Support', 'Early Access Features'],
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function sendPaymentConfirmation(params: {
  email: string;
  name: string;
  plan: PlanId;
  billing: 'monthly' | 'yearly' | 'one-time';
  amount: number;
  paymentId: string;
  renewalDate: number;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Email not configured' };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = params.name?.split(' ')[0] || 'there';
  const planName = PLAN_NAMES[params.plan] ?? params.plan;
  const emoji = PLAN_EMOJI[params.plan] ?? '✨';
  const features = PLAN_FEATURES[params.plan] ?? [];
  const billingLabel = params.billing === 'yearly' ? 'Yearly' : params.billing === 'one-time' ? 'One-time pass' : 'Monthly';

  const html = `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;margin:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">

  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:16px 24px;">
      <span style="color:white;font-size:24px;font-weight:800;">JavihAI</span>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#312e81,#4c1d95);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
    <div style="font-size:48px;margin-bottom:12px;">${emoji}</div>
    <h1 style="font-size:28px;font-weight:800;color:#fff;margin:0 0 8px;">Payment Confirmed!</h1>
    <p style="color:#c4b5fd;font-size:16px;margin:0;">Welcome to JavihAI ${planName}, ${firstName}.</p>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:24px;">
    <h2 style="font-size:16px;color:#94a3b8;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.05em;">Payment Details</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #334155;">
        <td style="padding:10px 0;color:#94a3b8;font-size:14px;">Plan</td>
        <td style="padding:10px 0;color:#e2e8f0;font-size:14px;text-align:right;font-weight:600;">${planName} (${billingLabel})</td>
      </tr>
      <tr style="border-bottom:1px solid #334155;">
        <td style="padding:10px 0;color:#94a3b8;font-size:14px;">Amount Paid</td>
        <td style="padding:10px 0;color:#4ade80;font-size:16px;text-align:right;font-weight:700;">₹${params.amount}</td>
      </tr>
      <tr style="border-bottom:1px solid #334155;">
        <td style="padding:10px 0;color:#94a3b8;font-size:14px;">Payment ID</td>
        <td style="padding:10px 0;color:#e2e8f0;font-size:12px;text-align:right;font-family:monospace;">${params.paymentId}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#94a3b8;font-size:14px;">Next Renewal</td>
        <td style="padding:10px 0;color:#e2e8f0;font-size:14px;text-align:right;">${formatDate(params.renewalDate)}</td>
      </tr>
    </table>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:24px;">
    <h2 style="font-size:16px;color:#fff;margin:0 0 16px;">What's now unlocked for you ${emoji}</h2>
    <ul style="padding-left:0;list-style:none;margin:0;">
      ${features.map(f => `<li style="padding:6px 0;color:#94a3b8;font-size:14px;display:flex;align-items:center;gap:8px;"><span style="color:#4ade80;font-weight:700;">✓</span> ${f}</li>`).join('')}
    </ul>
  </div>

  <div style="text-align:center;margin:32px 0;">
    <a href="https://www.javihai.in/dashboard?upgraded=true" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">
      Open Dashboard →
    </a>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
    <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Need to cancel or have questions?</p>
    <p style="color:#64748b;font-size:12px;margin:0;">Reply to this email or contact <a href="mailto:support@javihai.in" style="color:#6366f1;">support@javihai.in</a>. We offer a 7-day money-back guarantee.</p>
  </div>

  <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px;">
    JavihAI · <a href="https://www.javihai.in" style="color:#6366f1;">javihai.in</a> ·
    <a href="https://www.javihai.in/privacy" style="color:#475569;">Privacy</a>
  </p>
</div>
</body></html>`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: params.email,
    subject: `🎉 You're now on JavihAI ${planName} — payment confirmed`,
    html,
  });

  if (error) {
    console.error('[email/payment-confirmation] Resend error:', JSON.stringify(error));
    return { ok: false, error: error.message ?? JSON.stringify(error) };
  }
  console.log('[email/payment-confirmation] sent ok, id:', data?.id);
  return { ok: true, id: data?.id };
}

function shell(bodyHtml: string): string {
  return `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;margin:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:14px 22px;">
      <span style="color:white;font-size:22px;font-weight:800;">JavihAI</span>
    </div>
  </div>
  ${bodyHtml}
  <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px;">
    JavihAI · <a href="https://www.javihai.in" style="color:#6366f1;">javihai.in</a> ·
    <a href="https://www.javihai.in/refund" style="color:#475569;">Refund policy</a>
  </p>
</div></body></html>`;
}

/** Sent (from the webhook) when a payment fails. */
export async function sendPaymentFailed(params: { email: string; name: string; plan?: string }): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Email not configured' };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = params.name?.split(' ')[0] || 'there';
  const planName = params.plan ? (PLAN_NAMES[params.plan as PlanId] ?? params.plan) : 'your plan';

  const html = shell(`
  <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">Your payment didn't go through</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">
    Hi ${firstName}, we couldn't process your payment for <strong style="color:#e2e8f0;">${planName}</strong>.
    No charge was made. This usually happens with an expired card, insufficient balance, or a bank decline.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://www.javihai.in/pricing" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">Try again →</a>
  </div>
  <p style="color:#64748b;font-size:13px;">Need help? Reply to this email or contact <a href="mailto:support@javihai.in" style="color:#6366f1;">support@javihai.in</a>.</p>`);

  const { error } = await resend.emails.send({ from: FROM, to: params.email, subject: 'Your JavihAI payment didn’t go through', html });
  if (error) { console.error('[email/payment-failed] Resend error:', JSON.stringify(error)); return { ok: false, error: error.message }; }
  return { ok: true };
}

/** Sent by the daily cron a few days before a paid plan lapses (manual-renewal model). */
export async function sendRenewalReminder(params: { email: string; name: string; plan: 'pro' | 'power'; billing: 'monthly' | 'yearly'; renewalDate: number; amount: number }): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Email not configured' };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = params.name?.split(' ')[0] || 'there';
  const planName = PLAN_NAMES[params.plan] ?? params.plan;
  const emoji = PLAN_EMOJI[params.plan] ?? '✨';

  const html = shell(`
  <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">${emoji} Your ${planName} plan ends ${formatDate(params.renewalDate)}</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:20px;">
    Hi ${firstName}, your JavihAI <strong style="color:#e2e8f0;">${planName}</strong> access expires on
    <strong style="color:#e2e8f0;">${formatDate(params.renewalDate)}</strong>. Renew now to keep unlimited AI answers,
    voice, screenshots and Desi Mode without interruption.
  </p>
  <div style="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
    <span style="color:#94a3b8;font-size:14px;">Renew ${planName} (${params.billing})</span><br/>
    <span style="color:#fff;font-weight:800;font-size:22px;">₹${params.amount}</span>
  </div>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://www.javihai.in/checkout?plan=${params.plan}&billing=${params.billing}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">Renew now →</a>
  </div>
  <p style="color:#64748b;font-size:13px;">Don't want to renew? No action needed — your plan simply moves to Free.</p>`);

  const { error } = await resend.emails.send({ from: FROM, to: params.email, subject: `${emoji} Your JavihAI ${planName} plan ends ${formatDate(params.renewalDate)}`, html });
  if (error) { console.error('[email/renewal-reminder] Resend error:', JSON.stringify(error)); return { ok: false, error: error.message }; }
  return { ok: true };
}

/** Notify admin (support@javihai.in) when a customer submits a new ticket. */
export async function sendNewTicketAlert(params: {
  ticketId: string; title: string; category: string;
  userEmail: string; message: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Email not configured' };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = shell(`
  <h1 style="font-size:22px;font-weight:800;margin-bottom:4px;">🎫 New Support Ticket</h1>
  <p style="color:#94a3b8;font-size:14px;margin-bottom:20px;">Ticket #${params.ticketId}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
    <tr><td style="padding:8px 0;color:#64748b;width:100px;">From</td><td style="color:#e2e8f0;font-weight:600;">${params.userEmail}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;">Category</td><td style="color:#e2e8f0;">${params.category}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;">Subject</td><td style="color:#e2e8f0;font-weight:600;">${params.title}</td></tr>
  </table>
  <div style="background:#1e293b;border-radius:10px;padding:16px;margin-bottom:20px;">
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">${params.message.replace(/\n/g, '<br>')}</p>
  </div>
  <div style="text-align:center;">
    <a href="https://admin.javihai.in/support" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">View in Admin Panel →</a>
  </div>`);

  const { error } = await resend.emails.send({
    from: FROM, to: 'support@javihai.in',
    subject: `[Support] ${params.title} — from ${params.userEmail}`, html,
  });
  if (error) { console.error('[email/new-ticket-alert]', JSON.stringify(error)); return { ok: false, error: error.message }; }
  return { ok: true };
}

/** Notify customer when admin replies to their ticket. */
export async function sendTicketReply(params: {
  customerEmail: string; customerName: string;
  ticketTitle: string; ticketId: string; replyMessage: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Email not configured' };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = params.customerName?.split(' ')[0] || 'there';
  const html = shell(`
  <h1 style="font-size:22px;font-weight:800;margin-bottom:4px;">💬 Reply to your support ticket</h1>
  <p style="color:#94a3b8;font-size:14px;margin-bottom:20px;">Hi ${firstName}, we replied to: <strong style="color:#e2e8f0;">${params.ticketTitle}</strong></p>
  <div style="background:#1e293b;border-left:3px solid #6366f1;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:20px;">
    <p style="color:#a5b4fc;font-size:12px;font-weight:600;margin:0 0 8px;">JavihAI Support</p>
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">${params.replyMessage.replace(/\n/g, '<br>')}</p>
  </div>
  <p style="color:#94a3b8;font-size:14px;margin-bottom:20px;">You can view the full conversation and reply from your dashboard.</p>
  <div style="text-align:center;">
    <a href="https://www.javihai.in/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">View in Dashboard →</a>
  </div>`);

  const { error } = await resend.emails.send({
    from: FROM, to: params.customerEmail,
    subject: `Re: ${params.ticketTitle} — JavihAI Support`, html,
  });
  if (error) { console.error('[email/ticket-reply]', JSON.stringify(error)); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function sendFreeTrialVoucher(params: {
  email: string;
  name: string;
  voucherCode: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Email not configured' };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = params.name?.split(' ')[0] || 'there';

  const html = shell(`
  <h1 style="font-size:32px;font-weight:800;margin-bottom:8px;text-align:center;">🎁 Claim Your 7-Day Free Trial</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;text-align:center;margin-bottom:32px;">
    Hi ${firstName}, your exclusive free trial voucher is ready!
  </p>

  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
    <p style="color:#e0e7ff;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:600;">Your Voucher Code</p>
    <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#fff;font-size:28px;font-weight:800;font-family:monospace;margin:0;letter-spacing:2px;">${params.voucherCode}</p>
    </div>
    <p style="color:#e0e7ff;font-size:13px;margin:0;">Valid for 7 days from today</p>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:24px;border-left:4px solid #4f46e5;">
    <h2 style="font-size:18px;color:#fff;margin:0 0 16px;">What's Included in Your Free Trial</h2>
    <ul style="padding-left:0;list-style:none;margin:0;space-y:8px;">
      <li style="padding:8px 0;color:#cbd5e1;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-size:18px;">✓</span> Unlimited AI answers for 7 days</li>
      <li style="padding:8px 0;color:#cbd5e1;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-size:18px;">✓</span> System Audio & Screenshot Solve</li>
      <li style="padding:8px 0;color:#cbd5e1;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-size:18px;">✓</span> All premium features unlocked</li>
      <li style="padding:8px 0;color:#cbd5e1;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-size:18px;">✓</span> Desi Mode + Hindi/English support</li>
      <li style="padding:8px 0;color:#cbd5e1;display:flex;align-items:center;gap:10px;"><span style="color:#4ade80;font-size:18px;">✓</span> No credit card required</li>
    </ul>
  </div>

  <div style="text-align:center;margin:32px 0;">
    <a href="https://www.javihai.in/auth/signup" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:16px 40px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">Start Your Free Trial →</a>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
    <h3 style="color:#fff;font-size:14px;margin:0 0 8px;">How to use your voucher:</h3>
    <ol style="color:#94a3b8;font-size:13px;text-align:left;max-width:300px;margin:0 auto;padding-left:20px;">
      <li>Sign up free on JavihAI.in</li>
      <li>Go to Settings → Redeem Voucher</li>
      <li>Enter code: <strong style="color:#4ade80;font-family:monospace;">${params.voucherCode}</strong></li>
      <li>Enjoy 7 days of unlimited access!</li>
    </ol>
  </div>

  <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
    Questions? Reply to this email or contact <a href="mailto:support@javihai.in" style="color:#6366f1;">support@javihai.in</a>
  </p>`);

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.email,
    subject: `🎁 Your exclusive 7-day free trial is ready — Voucher code inside`,
    html,
  });

  if (error) {
    console.error('[email/free-trial-voucher] Resend error:', JSON.stringify(error));
    return { ok: false, error: error.message ?? JSON.stringify(error) };
  }
  console.log('[email/free-trial-voucher] sent ok');
  return { ok: true };
}

/** Sent (at most once/day) when a free-plan user hits their daily AI quota — the highest-intent upgrade moment. */
export async function sendQuotaUpgradeNudge(params: { email: string; name: string }): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Email not configured' };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = params.name?.split(' ')[0] || 'there';

  const html = shell(`
  <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">You've hit today's free AI limit 🎯</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">
    Hi ${firstName}, you've used all your free AI answers for today — nice work practicing!
    Upgrade to <strong style="color:#e2e8f0;">Pro</strong> for unlimited AI answers, Voice Mode, Screen Mode,
    and full coding + HR interview support, so you're never cut off mid-interview.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://www.javihai.in/pricing" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">Upgrade to Pro →</a>
  </div>
  <p style="color:#64748b;font-size:13px;">Your free quota resets tomorrow. Questions? Reply to this email or contact <a href="mailto:support@javihai.in" style="color:#6366f1;">support@javihai.in</a>.</p>`);

  const { error } = await resend.emails.send({
    from: FROM, to: params.email,
    subject: "You've hit today's free limit — go unlimited with Pro",
    html,
  });
  if (error) { console.error('[email/quota-upgrade-nudge] Resend error:', JSON.stringify(error)); return { ok: false, error: error.message }; }
  return { ok: true };
}

/** Sent (at most once per order) when a checkout was started but never completed. */
export async function sendCheckoutAbandonedReminder(params: { email: string; name: string; plan: PlanId; amount: number }): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Email not configured' };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = params.name?.split(' ')[0] || 'there';
  const planName = PLAN_NAMES[params.plan] ?? params.plan;

  const html = shell(`
  <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">You left ${planName} in your cart 🛒</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">
    Hi ${firstName}, looks like your JavihAI <strong style="color:#e2e8f0;">${planName}</strong> checkout didn't go through.
    No charge was made — your spot at ₹${params.amount} is still here whenever you're ready.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://www.javihai.in/checkout?plan=${params.plan}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">Finish checkout →</a>
  </div>
  <p style="color:#64748b;font-size:13px;">Ran into an issue paying? Reply to this email or contact <a href="mailto:support@javihai.in" style="color:#6366f1;">support@javihai.in</a>.</p>`);

  const { error } = await resend.emails.send({
    from: FROM, to: params.email,
    subject: `You left ${planName} in your cart`,
    html,
  });
  if (error) { console.error('[email/checkout-abandoned] Resend error:', JSON.stringify(error)); return { ok: false, error: error.message }; }
  return { ok: true };
}
