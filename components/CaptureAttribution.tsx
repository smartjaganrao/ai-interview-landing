'use client';

import { useEffect } from 'react';

/**
 * Site-wide capture of attribution params so they survive internal navigation
 * and the Google OAuth redirect:
 *   ?ref=CODE  → peer referral  (javihai_ref)
 *   ?via=CODE  → creator link   (javihai_via)
 *   ?utm_*     → marketing attribution (javihai_attribution)
 *
 * The signup flow reads these from localStorage after auth and calls the
 * claim / attribute endpoints. Renders nothing.
 */
export default function CaptureAttribution() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      const via = params.get('via');

      // Backward compatibility: keep existing keys
      if (ref) localStorage.setItem('javihai_ref', ref);
      if (via) localStorage.setItem('javihai_via', via);

      // Build current touch attribution
      const currentTouch = {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
        content: params.get('utm_content') || undefined,
        term: params.get('utm_term') || undefined,
        referrer: document.referrer || undefined,
        landingPage: window.location.pathname,
        at: Date.now(),
      };

      // Get or create attribution record
      const raw = localStorage.getItem('javihai_attribution');
      let attribution: Record<string, unknown> = {};
      if (raw) {
        try {
          attribution = JSON.parse(raw);
        } catch {
          // ignore corrupt payload
        }
      }

      // Set first touch if not already set
      if (!attribution.firstTouch) {
        attribution.firstTouch = currentTouch;
      }

      // Always update last touch
      attribution.lastTouch = currentTouch;

      // Update ref/via if present
      if (ref) attribution.referralCode = ref;
      if (via) attribution.creatorCode = via;

      localStorage.setItem('javihai_attribution', JSON.stringify(attribution));
    } catch {
      /* localStorage unavailable (private mode) — attribution is best-effort */
    }
  }, []);
  return null;
}
