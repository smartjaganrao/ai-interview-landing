'use client';

import { useEffect, useState } from 'react';
import { buildWhatsAppLink } from '@/lib/whatsapp-link';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

// Was an in-app FAQ-bot chat widget that only reached WhatsApp after a
// couple of scripted exchanges. Replaced with a direct wa.me link — the
// floating icon's whole job is getting someone to the real support team,
// not simulating a conversation first.
const CHAT_OPENED_KEY = 'javihai_chat_opened';

export default function WhatsAppButton() {
  // True until the visitor has actually clicked once, then persisted false
  // forever (this browser) via localStorage — an honest "you have an unread
  // welcome message" instead of a permanent fake badge.
  const [hasOpenedChat, setHasOpenedChat] = useState(true);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasOpenedChat(localStorage.getItem(CHAT_OPENED_KEY) === '1');
    } catch { /* ignore — badge just stays showing */ }
  }, []);

  const waLink = buildWhatsAppLink('Hi! I need help with JavihAI.');
  if (!waLink) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9998]">
      <a
        href={waLink}
        target="_blank"
        rel="noopener"
        onClick={() => {
          setHasOpenedChat(true);
          try { localStorage.setItem(CHAT_OPENED_KEY, '1'); } catch { /* ignore */ }
        }}
        className="group relative block"
        aria-label="Chat with JavihAI support on WhatsApp"
      >
        {/* Notification dot — see hasOpenedChat's own comment */}
        {!hasOpenedChat && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">1</span>
          </div>
        )}

        {/* Main button */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 group-hover:from-green-600 group-hover:to-emerald-700 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300 border-4 border-slate-900">
          <WhatsAppIcon glyphOnly className="w-8 h-8 text-white" />

          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-30"></div>
        </div>
      </a>
    </div>
  );
}
