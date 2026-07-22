'use client';

import { useState, useEffect } from 'react';

const RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
const NUMBER = RAW.replace(/[^\d]/g, '');

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener('open-whatsapp-form', handler);
    return () => window.removeEventListener('open-whatsapp-form', handler);
  }, []);

  if (!NUMBER) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lines = [
      'Hi JavihAI team!',
      '',
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      form.phone ? `Phone: ${form.phone}` : '',
      form.message ? `Message: ${form.message}` : '',
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${NUMBER}?text=${text}`;
    window.open(url, '_blank');
    setSubmitted(true);
  };

  return (
    <>
      {!submitted && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with us on WhatsApp"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 9998,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#25D366',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            cursor: 'pointer',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.781 1.13L.9 3.546l1.9 6.943a9.788 9.788 0 001.348 4.168 9.868 9.868 0 008.284 4.745h.005c5.048 0 9.28-4.073 9.797-9.126.629-6.289-4.844-11.745-11.255-11.745"/>
          </svg>
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Get Support on WhatsApp</h3>
                  <p className="text-sm text-slate-400 mt-1">Fill in your details and we&apos;ll open WhatsApp with your info.</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-lg px-2">✕</button>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Message</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 resize-none"
                      rows={3}
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition-colors">
                    Continue to WhatsApp →
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-white font-semibold text-lg mb-2">Opening WhatsApp</p>
                  <p className="text-slate-400 text-sm mb-6">If it didn&apos;t open, click the button below.</p>
                  <button
                    onClick={() => {
                      const lines = [
                        'Hi JavihAI team!',
                        '',
                        `Name: ${form.name}`,
                        `Email: ${form.email}`,
                        form.phone ? `Phone: ${form.phone}` : '',
                        form.message ? `Message: ${form.message}` : '',
                      ].filter(Boolean);

                      const text = encodeURIComponent(lines.join('\n'));
                      const url = `https://wa.me/${NUMBER}?text=${text}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 rounded-xl transition-colors"
                  >
                    Open WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
