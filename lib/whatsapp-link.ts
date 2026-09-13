// Client-safe helper for building a direct wa.me deep link. Separate from
// lib/whatsapp.ts, which wraps the server-side Twilio API and needs secrets
// that must never reach the browser — this only ever touches the public
// support number and runs in the browser.
const RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
const NUMBER = RAW.replace(/[^\d]/g, '');

/** Null when NEXT_PUBLIC_WHATSAPP_NUMBER isn't configured — callers should
 *  hide the link entirely rather than render a dead one. */
export function buildWhatsAppLink(message: string): string | null {
  if (!NUMBER) return null;
  return `https://wa.me/${NUMBER}?text=${encodeURIComponent(message)}`;
}
