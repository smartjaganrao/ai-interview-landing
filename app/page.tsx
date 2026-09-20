import { getDynamicPricing } from '@/lib/firebase-admin';
import LandingClient from '@/components/LandingClient';
import { faqSchema, howToSchema } from '@/lib/homepage-schema';

export default async function Page() {
  const pricing = await getDynamicPricing();

  return (
    <>
      {/* Rendered here (a Server Component) instead of in LandingClient
          ('use client') so these ship in the server HTML — Googlebot's
          second-wave JS render isn't guaranteed/fast, and most AI
          answer-engine crawlers render JS worse than Googlebot or not at
          all, so client-only JSON-LD was effectively invisible to them. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema).replace(/</g, '\\u003c') }}
      />
      <LandingClient initialPricing={pricing} />
    </>
  );
}
