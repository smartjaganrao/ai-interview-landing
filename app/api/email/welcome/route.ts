import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Use verified domain once javihai.in DNS is confirmed in Resend dashboard.
// Until then Resend's shared domain works for testing.
const FROM = process.env.RESEND_FROM_EMAIL ?? 'JavihAI <onboarding@resend.dev>';

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'Email not configured' }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { email, name, type } = await req.json() as { email: string; name: string; type: 'welcome' | 'day2' | 'day5' };

  const firstName = name?.split(' ')[0] || 'there';

  const templates = {
    welcome: {
      subject: `Welcome to JavihAI, ${firstName}! 🎉 Here's how to get started`,
      html: `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;margin:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:16px 24px;">
      <span style="color:white;font-size:24px;font-weight:800;">JavihAI</span>
    </div>
  </div>
  <h1 style="font-size:28px;font-weight:800;margin-bottom:8px;">Welcome aboard, ${firstName}! 🎉</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:32px;">
    You've just unlocked India's most affordable real-time AI interview coach. Here's how to get the most out of JavihAI in your first 5 minutes.
  </p>

  <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:24px;">
    <h2 style="font-size:18px;margin:0 0 16px;color:#fff;">🚀 3 steps to your first session</h2>
    <div style="margin-bottom:12px;padding-left:8px;border-left:3px solid #6366f1;">
      <strong style="color:#e2e8f0;">Step 1</strong><br/>
      <span style="color:#94a3b8;">Go to your <a href="https://javihai.in/dashboard" style="color:#818cf8;">Dashboard</a> and download the desktop app (Mac or Windows)</span>
    </div>
    <div style="margin-bottom:12px;padding-left:8px;border-left:3px solid #6366f1;">
      <strong style="color:#e2e8f0;">Step 2</strong><br/>
      <span style="color:#94a3b8;">Sign in with the same Google account, fill in your target role and tech stack</span>
    </div>
    <div style="padding-left:8px;border-left:3px solid #6366f1;">
      <strong style="color:#e2e8f0;">Step 3</strong><br/>
      <span style="color:#94a3b8;">Press <kbd style="background:#334155;padding:2px 6px;border-radius:4px;font-size:12px;">⌥H</kbd> (Mac) or <kbd style="background:#334155;padding:2px 6px;border-radius:4px;font-size:12px;">Alt+H</kbd> (Windows) to show the overlay and start practicing</span>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#312e81,#4c1d95);border-radius:12px;padding:24px;margin-bottom:24px;">
    <h2 style="font-size:16px;color:#c4b5fd;margin:0 0 8px;">🇮🇳 New: Desi Mode</h2>
    <p style="color:#ddd6fe;margin:0;font-size:14px;line-height:1.6;">
      Answer in Hindi, Tamil, Telugu or 7 other Indian languages. Enable Desi Mode for answers with Indian company examples (Flipkart, Razorpay, Swiggy). Set it in Profile → AI Answer Style.
    </p>
  </div>

  <div style="text-align:center;margin:32px 0;">
    <a href="https://javihai.in/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">
      Open Dashboard →
    </a>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
    <h3 style="font-size:14px;color:#94a3b8;margin:0 0 12px;">Also available for you:</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <a href="https://javihai.in/resume" style="background:#334155;color:#e2e8f0;padding:8px 14px;border-radius:8px;font-size:13px;text-decoration:none;">📄 Resume Builder</a>
      <a href="https://javihai.in/jobs" style="background:#334155;color:#e2e8f0;padding:8px 14px;border-radius:8px;font-size:13px;text-decoration:none;">💼 Job Recommendations</a>
      <a href="https://javihai.in/mock-interview" style="background:#334155;color:#e2e8f0;padding:8px 14px;border-radius:8px;font-size:13px;text-decoration:none;">🎯 Mock Interview</a>
    </div>
  </div>

  <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px;">
    JavihAI · <a href="https://javihai.in" style="color:#6366f1;">javihai.in</a> ·
    <a href="https://javihai.in/privacy" style="color:#475569;">Privacy</a> ·
    Reply to this email for support
  </p>
</div>
</body></html>`,
    },

    day2: {
      subject: `${firstName}, have you tried Desi Mode yet? 🇮🇳`,
      html: `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;margin:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">Hi ${firstName}, quick tip 👋</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">
    Most users who enable <strong style="color:#e2e8f0;">Desi Mode</strong> say their answers sound more natural in Indian interviews.
  </p>
  <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:24px;">
    <h2 style="font-size:16px;color:#c4b5fd;margin:0 0 8px;">What Desi Mode does:</h2>
    <ul style="color:#94a3b8;padding-left:20px;line-height:2;">
      <li>Answers in natural Indian English (not textbook English)</li>
      <li>Uses Indian company examples: Flipkart, Razorpay, Swiggy, CRED</li>
      <li>IIT/NIT references, product vs service company context</li>
      <li>Optional: full Hindi, Tamil, Telugu answers</li>
    </ul>
    <p style="color:#64748b;font-size:13px;margin:12px 0 0;">
      Enable it: Open desktop app → Profile (👤) → AI Answer Style → toggle Desi Mode ON
    </p>
  </div>
  <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:24px;">
    <h2 style="font-size:16px;color:#fff;margin:0 0 8px;">🎯 Also try: Mock Interview</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 12px;">
      Practice with a full AI-powered mock interview — pick your role, get asked real questions, get scored.
    </p>
    <a href="https://javihai.in/mock-interview" style="display:inline-block;background:#6366f1;color:white;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;">Start Mock Interview →</a>
  </div>
  <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px;">
    Reply to this email if you need help · <a href="https://javihai.in" style="color:#6366f1;">javihai.in</a>
  </p>
</div>
</body></html>`,
    },

    day5: {
      subject: `${firstName}, you're leaving ₹499/month of value on the table 💡`,
      html: `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;margin:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;">Ready to go unlimited, ${firstName}?</h1>
  <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">
    You've been using JavihAI for a few days. Here's what Pro unlocks for just <strong style="color:#e2e8f0;">₹499/month</strong> — that's less than a coffee at Starbucks.
  </p>

  <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #334155;">
        <th style="text-align:left;padding:8px;color:#94a3b8;font-size:13px;">Feature</th>
        <th style="text-align:center;padding:8px;color:#94a3b8;font-size:13px;">Free</th>
        <th style="text-align:center;padding:8px;color:#818cf8;font-size:13px;">Pro ₹499/mo</th>
      </tr>
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:10px 8px;color:#e2e8f0;font-size:14px;">AI answers</td>
        <td style="text-align:center;padding:10px;color:#94a3b8;font-size:14px;">10/day</td>
        <td style="text-align:center;padding:10px;color:#4ade80;font-size:14px;">Unlimited</td>
      </tr>
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:10px 8px;color:#e2e8f0;font-size:14px;">Voice minutes</td>
        <td style="text-align:center;padding:10px;color:#94a3b8;font-size:14px;">20/day</td>
        <td style="text-align:center;padding:10px;color:#4ade80;font-size:14px;">Unlimited</td>
      </tr>
      <tr>
        <td style="padding:10px 8px;color:#e2e8f0;font-size:14px;">Screenshots</td>
        <td style="text-align:center;padding:10px;color:#94a3b8;font-size:14px;">3/day</td>
        <td style="text-align:center;padding:10px;color:#4ade80;font-size:14px;">Unlimited</td>
      </tr>
    </table>
  </div>

  <div style="background:#312e81;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
    <p style="color:#c4b5fd;margin:0 0 4px;font-size:13px;">vs Final Round AI: ₹7,695/month | vs Chiku AI: ₹3,499/month</p>
    <p style="color:#fff;font-weight:800;font-size:20px;margin:0;">JavihAI Pro = ₹499/month. Same features. 15× cheaper.</p>
  </div>

  <div style="text-align:center;">
    <a href="https://javihai.in/pricing" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;">
      Upgrade to Pro →
    </a>
    <p style="color:#475569;font-size:12px;margin-top:12px;">30-day money-back guarantee. Cancel anytime.</p>
  </div>

  <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px;">
    <a href="https://javihai.in" style="color:#6366f1;">javihai.in</a> · Reply if you have any questions
  </p>
</div>
</body></html>`,
    },
  };

  const t = templates[type];
  if (!t) return NextResponse.json({ ok: false, error: 'Unknown type' }, { status: 400 });

  const { data, error } = await resend.emails.send({ from: FROM, to: email, subject: t.subject, html: t.html });
  if (error) {
    console.error('[email/welcome] Resend error:', JSON.stringify(error));
    return NextResponse.json({ ok: false, error: error.message ?? JSON.stringify(error) }, { status: 500 });
  }
  console.log('[email/welcome] sent ok, id:', data?.id);
  return NextResponse.json({ ok: true, id: data?.id });
}
