'use client';

import { useEffect } from 'react';

/**
 * Site-wide capture of attribution params so they survive internal navigation
 * and the Google OAuth redirect:
 *   ?ref=CODE  → peer referral  (javihai_ref)
 *   ?via=CODE  → creator link   (javihai_via)
 * The signup flow reads these from localStorage after auth and calls the
 * claim / attribute endpoints. Renders nothing.
 */
export default function CaptureAttribution() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      const via = params.get('via');
      if (ref) localStorage.setItem('javihai_ref', ref);
      if (via) localStorage.setItem('javihai_via', via);
    } catch {
      /* localStorage unavailable (private mode) — attribution is best-effort */
    }
  }, []);
  return null;
}
