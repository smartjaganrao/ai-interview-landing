'use client';

import { useEffect } from 'react';

// Tawk.to live chat widget.
// To connect to YOUR account:
//   1. Go to https://tawk.to → sign up free
//   2. Create a property called "JavihAI"
//   3. Dashboard → Administration → Channels → Chat Widget → copy the widget code
//   4. Replace TAWK_PROPERTY_ID and TAWK_WIDGET_ID below with your values
//      (they look like: s1abc23def456789012345/1a2b3c4d5)

const TAWK_PROPERTY_ID = '6a359ea3a259a01d4cf75cbe';
const TAWK_WIDGET_ID   = '1jrgn7cle';

declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

export default function TawkChat() {
  useEffect(() => {
    // Don't load until the user has had a moment to interact with the page
    if (!TAWK_PROPERTY_ID) return;

    window.Tawk_API  = window.Tawk_API  || {};
    window.Tawk_LoadStart = new Date();

    const s = document.createElement('script');
    s.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    s.async = true;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);

    return () => {
      // Clean up on unmount (route change)
      document.head.removeChild(s);
    };
  }, []);

  return null;
}
