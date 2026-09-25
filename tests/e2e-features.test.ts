import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('E2E Verification: Growth & Positioning Enhancements', () => {
  const landingDir = path.resolve(__dirname, '..');
  const helperDir = path.resolve(landingDir, '../ai-interview-helper');

  describe('1. Homepage & Hero Messaging (LandingClient.tsx)', () => {
    const landingClientPath = path.join(landingDir, 'components/LandingClient.tsx');
    const content = fs.readFileSync(landingClientPath, 'utf8');

    it('displays the expanded H1 for Interviews, Coding & Exams', () => {
      expect(content).toContain('For Interviews, Coding &amp; Exams');
      expect(content).toContain('Unlimited AI Copilot');
    });

    it('contains the updated subtitle covering interview, coding round and certification exams', () => {
      expect(content).toContain('100% invisible live copilot for Zoom/Meet interviews, live coding rounds &amp; exam certifications');
      expect(content).toContain('zero hourly limits');
      expect(content).toContain('₹14/hr');
    });

    it('renders the 5 core value pills including all 3 pillars', () => {
      expect(content).toContain('💼 Live Interviews');
      expect(content).toContain('💻 Coding Rounds &amp; OAs');
      expect(content).toContain('📜 Exam Certifications');
      expect(content).toContain('🥷 100% Invisible');
      expect(content).toContain('♾️ 100% Unlimited');
    });

    it('positions LiveSocialProofTicker cleanly below the hero CTA buttons', () => {
      const ctaIndex = content.indexOf('Try for Free');
      const termsIndex = content.indexOf('Free forever for freshers');
      const tickerIndex = content.indexOf('<LiveSocialProofTicker />');
      expect(ctaIndex).toBeGreaterThan(0);
      expect(termsIndex).toBeGreaterThan(ctaIndex);
      expect(tickerIndex).toBeGreaterThan(termsIndex);
    });

    it('highlights all 3 pillars in the Global Disruption Value Proposition Banner', () => {
      expect(content).toContain('One Unlimited AI Copilot for Interviews, Coding &amp; Certifications');
      expect(content).toContain('job interviews, coding rounds, and certification exams with Desi Mode');
    });
  });

  describe('2. Pricing Page Messaging & Layout (PricingClient.tsx)', () => {
    const pricingClientPath = path.join(landingDir, 'components/PricingClient.tsx');
    const content = fs.readFileSync(pricingClientPath, 'utf8');

    it('updates top badge and header copy for interviews, coding and exams', () => {
      expect(content).toContain('🇮🇳 For Interviews, Coding Rounds &amp; Certification Exams');
      expect(content).toContain('India&apos;s 1st <span className="text-gradient">Unlimited Copilot Plan</span>');
      expect(content).toContain('Never cuts off mid-interview or mid-exam');
      expect(content).toContain('♾️ ZERO HOURLY CAPS · LIVE INTERVIEWS · CODING ROUNDS · EXAM CERTIFICATIONS');
    });

    it('positions LiveSocialProofTicker directly above the pricing plan cards with clean margins', () => {
      const tickerIndex = content.indexOf('<LiveSocialProofTicker />');
      const cardsIndex = content.indexOf('{/* Pricing cards */}');
      expect(tickerIndex).toBeGreaterThan(0);
      expect(cardsIndex).toBeGreaterThan(tickerIndex);
      // Verify no -mt-6 overlap trap
      expect(content).not.toContain('mb-4 -mt-6');
      expect(content).not.toContain('mb-10 -mt-6');
    });

    it('includes Campus Ambassador and TPO lead partner box', () => {
      expect(content).toContain('College Placement Coordinator (TPO) or Hostel Lead?');
      expect(content).toContain('25% recurring UPI commission');
    });

    it('includes zero-cash bonus answers referral box (+5 answers for 1 invite)', () => {
      expect(content).toContain('Need More Free Practice Today? Invite 1 Friend for +5 Bonus Answers');
      expect(content).toContain('Invite 1 Friend (+5 Answers)');
    });

    it('includes 7-day UPI refund assurance and WhatsApp founder button', () => {
      expect(content).toContain('7-Day No-Questions-Asked UPI Refund + Direct Founder WhatsApp');
      expect(content).toContain('WhatsApp Founder directly');
    });
  });

  describe('3. Live Social Proof Ticker (LiveSocialProofTicker.tsx)', () => {
    const tickerPath = path.join(landingDir, 'components/LiveSocialProofTicker.tsx');
    const content = fs.readFileSync(tickerPath, 'utf8');

    it('contains rotating activities across interviews, coding rounds and certification exams', () => {
      // Interviews
      expect(content).toContain('TCS Digital interview');
      expect(content).toContain('cracked Infosys DSE round');
      // Coding rounds
      expect(content).toContain('cleared Amazon SDE-1 OA');
      // Certification exams
      expect(content).toContain('cleared AWS Solutions Architect');
      expect(content).toContain('passed Azure Fundamentals (AZ-900)');
      // Split pack
      expect(content).toContain('split Hostel 5-Pack');
    });

    it('implements responsive width constraints and truncation to prevent overlapping', () => {
      expect(content).toContain('max-w-full overflow-hidden');
      expect(content).toContain('truncate');
      expect(content).toContain('shrink-0');
    });

    it('implements smooth fade transition and hover-to-pause', () => {
      expect(content).toContain('isFading');
      expect(content).toContain('isPaused');
      expect(content).toContain('onMouseEnter');
      expect(content).toContain('onMouseLeave');
    });
  });

  describe('4. Desktop App In-App Upgrade Modal (ai-interview-helper UpgradePrompt.tsx)', () => {
    const helperPromptPath = path.join(helperDir, 'src/features/billing/UpgradePrompt.tsx');
    const content = fs.readFileSync(helperPromptPath, 'utf8');

    it('features the Quick Pass Swiggy Biryani value anchor', () => {
      expect(content).toContain('Quick Pass is ₹349 (~₹14/hr) — cheaper than 1 Swiggy Biryani');
    });

    it('specifies instant UPI and Indian payment methods', () => {
      expect(content).toContain('Razorpay (UPI, GPay, PhonePe, Cards)');
    });

    it('includes zero-cash referral sharing for +5 free bonus answers', () => {
      expect(content).toContain('Need 5 more free answers today?');
      expect(content).toContain('Share on WhatsApp');
    });

    it('includes 7-day 100% UPI money-back guarantee assurance', () => {
      expect(content).toContain('7-Day 100% UPI Money-Back Guarantee');
    });
  });

  describe('5. SEO & OpenGraph Metadata (app/layout.tsx)', () => {
    const layoutPath = path.join(landingDir, 'app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');

    it('has updated title and description matching the expanded 3-pillar positioning', () => {
      expect(content).toContain('JavihAI — Unlimited AI Copilot for Interviews, Coding & Exam Certifications');
      expect(content).toContain('unlimited AI copilot for interviews, coding rounds & exam certifications');
    });
  });
});
