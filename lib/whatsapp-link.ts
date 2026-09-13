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

/** Human-readable form of the support number for display (e.g. topbar) —
 *  "+91 98841 60332" for the 12-digit 91-prefixed number this project
 *  actually uses; falls back to a plain "+<digits>" for any other shape. */
export function getWhatsAppDisplayNumber(): string | null {
  if (!NUMBER) return null;
  if (NUMBER.length === 12 && NUMBER.startsWith('91')) {
    const local = NUMBER.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return `+${NUMBER}`;
}
