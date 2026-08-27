'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Pages where an auto-popped chat widget does more harm than good — the
// homepage hero holds the primary download CTA, and /install holds the
// step-by-step guide; on mobile this widget covers nearly the full
// viewport, burying both. It's still one tap away via the bubble.
const AUTO_OPEN_EXCLUDED_PATHS = ['/', '/install'];

const RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
const NUMBER = RAW.replace(/[^\d]/g, '');

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I install JavihAI?',
    answer: 'To install JavihAI:\n\n1. Download it from the homepage or javihai.in/install\n2. Run the file — Windows/Mac will show a one-time security prompt, click "Run anyway" or "Open" (normal for a new app)\n3. Sign in with your account\n4. Grant microphone permission\n\nFull walkthrough with screenshots: javihai.in/install. Need more help? I can connect you to our support team.',
    keywords: ['install', 'setup', 'download', 'exe', 'dmg', 'setup', 'install'],
  },
  {
    id: 'faq-2',
    question: 'Is JavihAI free?',
    answer: 'Yes! We offer a free tier with daily limits. You get:\n\n• 3 AI answers per day\n• 5 voice minutes per day\n• 2 screenshots per day\n\nFor unlimited access, check out our Power plan on the pricing page.',
    keywords: ['free', 'price', 'cost', 'pricing', 'subscription', 'plan', 'payment', 'money', 'paid', 'purchase'],
  },
  {
    id: 'faq-3',
    question: 'How does the interview feature work?',
    answer: 'JavihAI works as an invisible overlay during your interview:\n\n1. Start a call on Zoom/Meet/Teams\n2. Open JavihAI and sign in\n3. Choose audio source: System (recommended) or Mic\n4. Click Start\n5. JavihAI listens and provides answers in real-time\n\nThe overlay is hidden from screen sharing and taskbar.',
    keywords: ['interview', 'how', 'work', 'feature', 'use', 'start', 'begin', 'call', 'zoom', 'meet', 'teams'],
  },
  {
    id: 'faq-4',
    question: 'How do I upgrade my plan?',
    answer: 'To upgrade your plan:\n\n1. Go to Dashboard → Current Plan section\n2. Click "Upgrade Plan" or "See Plans"\n3. Choose your preferred plan\n4. Complete payment via Razorpay\n\nYou\'ll get instant access to premium features after payment.',
    keywords: ['upgrade', 'plan', 'premium', 'power', 'pro', 'subscribe', 'purchase', 'buy', 'payment'],
  },
  {
    id: 'faq-5',
    question: 'Is my data safe and private?',
    answer: 'Yes, absolutely! Here\'s how we protect you:\n\n• All processing happens on your device\n• Your API keys never leave your computer\n• No data is stored on our servers\n• The overlay is excluded from screen sharing\n• Completely invisible during interviews\n\nWe take privacy seriously!',
    keywords: ['privacy', 'safe', 'secure', 'data', 'security', 'private', 'trust', 'confidential'],
  },
  {
    id: 'faq-6',
    question: 'The app is not working / crashing',
    answer: 'Here are quick fixes:\n\n1. Restart the app\n2. Check your internet connection\n3. Grant microphone permission\n4. Update to the latest version\n5. Reinstall if needed\n\nIf the issue persists, I\'ll connect you to our support team.',
    keywords: ['crash', 'bug', 'error', 'not working', 'broken', 'issue', 'problem', 'fix', 'troubleshoot', 'help', 'stuck'],
  },
  {
    id: 'faq-7',
    question: 'How do I get a refund?',
    answer: 'To request a refund:\n\n1. Email us at support@javihai.in\n2. Include your payment ID and reason\n3. We process refunds within 5-7 business days\n\nFor subscription cancellations, you can also cancel from your dashboard.',
    keywords: ['refund', 'cancel', 'money back', 'return', 'dispute', 'chargeback'],
  },
  {
    id: 'faq-8',
    question: 'Can I use JavihAI on multiple devices?',
    answer: 'Currently, JavihAI is available as a desktop app for:\n\n• Windows 10/11\n• macOS 12+ (Apple Silicon & Intel)\n\nYou can sign in with the same account on multiple computers. Mobile support is coming soon!',
    keywords: ['multiple', 'devices', 'phone', 'mobile', 'android', 'ios', 'laptop', 'computer', 'mac', 'windows'],
  },
];

const SUGGESTED_QUESTIONS = [
  'How do I install?',
  'Is it free?',
  'How does it work?',
  'Is my data safe?',
  'App not working',
];

function matchFAQ(input: string): FAQItem | null {
  const lower = input.toLowerCase();
  let bestMatch: FAQItem | null = null;
  let bestScore = 0;

  for (const faq of FAQS) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestScore >= 1 ? bestMatch : null;
}

export default function WhatsAppButton() {
  const pathname = usePathname();
  const autoOpenDisabled = AUTO_OPEN_EXCLUDED_PATHS.includes(pathname);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [faqVisible, setFaqVisible] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [open, faqVisible]);

  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize();
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [open]);

  useEffect(() => {
    const handler = () => resetChat();
    window.addEventListener('open-whatsapp-form', handler);
    return () => window.removeEventListener('open-whatsapp-form', handler);
  }, []);

  useEffect(() => {
    if (!open && !hasAutoOpened && !autoOpenDisabled) {
      const timer = setTimeout(() => {
        setHasAutoOpened(true);
        setOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [open, hasAutoOpened, autoOpenDisabled]);

  const resetChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Hi there! 👋 Welcome to JavihAI Support. How can I help you today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
    setIsTyping(false);
    setFaqVisible(true);
  }, []);

  const closeModal = () => {
    setOpen(false);
    resetChat();
  };

  const playPopSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore audio errors
    }
  };

  const playMessageSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore audio errors
    }
  };

  useEffect(() => {
    if (open) {
      playPopSound();
    }
  }, [open]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const addMessage = (sender: 'user' | 'bot', text: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      sender,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
    if (sender === 'bot') {
      playMessageSound();
    }
  };

  const handleSuggestedClick = (question: string) => {
    setFaqVisible(false);
    handleSend(question);
  };

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    addMessage('user', trimmed);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const faqMatch = matchFAQ(trimmed);
      if (faqMatch) {
        addMessage('bot', faqMatch.answer);
      } else {
        addMessage('bot', "Thanks for your question! For detailed support, I'll connect you to our WhatsApp support team. Please share your email and we'll get back to you shortly.");
      }
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleWhatsAppRedirect = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
    const userText = lastUserMessage ? lastUserMessage.text : 'Support request';
    const faqMatch = matchFAQ(userText);
    const categoryLabel = faqMatch ? faqMatch.question : 'General Support';

    const lines = [
      'Hi JavihAI Support!',
      '',
      `Category: ${categoryLabel}`,
      `Question: ${userText}`,
      ...messages.filter(m => m.sender === 'user').slice(0, 3).map(m => `User: ${m.text}`),
    ];

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${NUMBER}?text=${text}`, '_blank');

    addMessage('bot', "I've opened WhatsApp with your conversation details. Our team will be with you shortly! 🚀");
  };

  if (!NUMBER) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-[9998]">
          <button
            onClick={() => setOpen(true)}
            className="group relative"
            aria-label="Chat with support"
          >
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">1</span>
            </div>

            {/* Main button */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 border-4 border-slate-900">
              {/* Chat bubble icon */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M12 2C6.48 2 2 5.58 2 10c0 1.85.86 3.55 2.28 4.77L3 20l4.5-1.5C8.54 19.58 10.26 20 12 20c5.52 0 10-3.58 10-8s-4.48-8-10-8zm0 14c-1.1 0-2.15-.2-3.1-.57l-.28-.11-2.76.92.93-2.68-.16-.28C5.72 12.26 5.2 11.15 5.2 10c0-3.31 3.58-6 8-6s8 2.69 8 6-3.58 6-8 6z"/>
              </svg>

              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-30"></div>
            </div>
          </button>
        </div>
      )}

      {/* Chat Widget Panel */}
      {open && (
        <div
          className="fixed right-6 z-[10000] w-[380px] max-w-[calc(100vw-48px]"
          style={{
            bottom: viewportHeight > 0 && viewportHeight < window.innerHeight - 100
              ? `${window.innerHeight - viewportHeight + 10}px`
              : '24px',
          }}
        >
          <div className="bg-slate-900 border border-green-500/30 rounded-2xl shadow-2xl animate-scale-in overflow-hidden flex flex-col h-[560px] max-h-[calc(100vh-96px)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.781 1.13L.9 3.546l1.9 6.943a9.788 9.788 0 001.348 4.168 9.868 9.868 0 008.284 4.745h.005c5.048 0 9.28-4.073 9.797-9.126.629-6.289-4.844-11.745-11.255-11.745"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-green-600 rounded-full"></div>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">JavihAI Support</div>
                  <div className="text-green-100 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-200 rounded-full animate-pulse"></span>
                    Online
                  </div>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white text-xl px-2">✕</button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.sender === 'user'
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-green-100' : 'text-slate-500'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start mb-3">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-900 border-t border-white/10 flex-shrink-0">
              {/* FAQ Section - Always visible until first interaction */}
              {faqVisible && messages.length <= 1 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <span>💡</span>{' '}Quick Help
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSuggestedClick(q)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-lg px-3 py-2 text-left text-xs text-slate-300 transition-all leading-snug"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[10px] text-slate-500">Or type your question below ↓</p>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 min-w-0"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
                  aria-label="Send message"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </form>

              {/* WhatsApp Redirect Button */}
              {messages.length >= 2 && (
                <button
                  onClick={handleWhatsAppRedirect}
                  className="w-full mt-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.781 1.13L.9 3.546l1.9 6.943a9.788 9.788 0 001.348 4.168 9.868 9.868 0 008.284 4.745h.005c5.048 0 9.28-4.073 9.797-9.126.629-6.289-4.844-11.745-11.255-11.745"/>
                  </svg>
                  {matchFAQ([...messages].reverse().find(m => m.sender === 'user')?.text || '') 
                    ? 'Still need help? Chat with us' 
                    : 'Connect to Support'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
