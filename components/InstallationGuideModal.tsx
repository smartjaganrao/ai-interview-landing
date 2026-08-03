'use client';

import { useEffect, useState } from 'react';

interface InstallationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (platform: 'windows' | 'mac') => void;
  appVersion?: string;
  initialOS?: 'windows' | 'mac' | null;
}

export default function InstallationGuideModal({ isOpen, onClose, onDownload, appVersion, initialOS }: InstallationGuideModalProps) {
  const [selectedOS, setSelectedOS] = useState<'windows' | 'mac' | null>(initialOS || null);

  useEffect(() => {
    if (isOpen) {
      setSelectedOS(initialOS || null);
    }
  }, [isOpen, initialOS]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadClick = (platform: 'windows' | 'mac') => {
    onDownload(platform);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl z-10">✕</button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-3xl font-black mb-2">Get Started with JavihAI</h2>
            <p className="text-slate-400">Download and install the desktop app in 2 minutes</p>
          </div>

          {/* OS Selection */}
          {!selectedOS ? (
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => setSelectedOS('windows')}
                className="card card-glow hover:border-indigo-500/50 transition-all text-left group"
              >
                <div className="text-5xl mb-4">🪟</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-300">Windows 10 / 11</h3>
                <p className="text-sm text-slate-400 mb-4">Download the .exe installer and run it</p>
                <div className="btn btn-primary w-full text-center">Select Windows →</div>
              </button>
              <button
                onClick={() => setSelectedOS('mac')}
                className="card card-glow hover:border-indigo-500/50 transition-all text-left group"
              >
                <div className="text-5xl mb-4">🍎</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-300">macOS</h3>
                <p className="text-sm text-slate-400 mb-4">Download the .dmg and drag to Applications</p>
                <div className="btn btn-primary w-full text-center">Select Mac →</div>
              </button>
            </div>
          ) : (
            <div>
              <button onClick={() => setSelectedOS(null)} className="text-indigo-400 text-sm font-semibold mb-4 hover:text-indigo-300">
                ← Back to OS selection
              </button>

              {selectedOS === 'windows' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-4xl">🪟</div>
                    <div>
                      <h3 className="text-2xl font-bold">Windows 10 / 11</h3>
                      <p className="text-sm text-slate-400">Follow these steps to install JavihAI</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="card border-indigo-500/30">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0">1</div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-2">Download the app</h4>
                          <p className="text-sm text-slate-400 mb-3">Click the button below to download the Windows installer.</p>
                          <button onClick={() => handleDownloadClick('windows')} className="btn btn-primary w-full">
                            ⬇ Download for Windows {appVersion ? `(${appVersion})` : ''}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0">2</div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-2">Run the installer</h4>
                          <p className="text-sm text-slate-400">
                            Open the downloaded <code className="text-indigo-300">.exe</code> file. If you see a blue <strong>&quot;Windows protected your PC&quot;</strong> box, click <strong className="text-slate-200">More info → Run anyway</strong>.
                          </p>
                          <p className="text-xs text-slate-500 mt-2">💡 It&apos;s safe — the app simply isn&apos;t code-signed yet.</p>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0">3</div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-2">Sign in and start</h4>
                          <p className="text-sm text-slate-400">
                            The app opens near the top of your screen. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">Alt</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">H</kbd> to show/hide it. Sign in with your account and click <strong>Start</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-4xl">🍎</div>
                    <div>
                      <h3 className="text-2xl font-bold">macOS</h3>
                      <p className="text-sm text-slate-400">Follow these steps to install JavihAI</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="card border-indigo-500/30">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0">1</div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-2">Download the app</h4>
                          <p className="text-sm text-slate-400 mb-3">Click the button below to download the macOS .dmg file.</p>
                          <button onClick={() => handleDownloadClick('mac')} className="btn btn-primary w-full">
                            ⬇ Download for Mac {appVersion ? `(${appVersion})` : ''}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0">2</div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-2">Install the app</h4>
                          <p className="text-sm text-slate-400">
                            Open the downloaded <code className="text-indigo-300">.dmg</code> and drag <strong className="text-slate-200">JavihAI</strong> into your <strong className="text-slate-200">Applications</strong> folder.
                          </p>
                          <p className="text-sm text-slate-400 mt-2">
                            In Applications, <strong className="text-slate-200">right-click JavihAI → Open → Open</strong>.
                          </p>
                          <p className="text-xs text-slate-500 mt-2">💡 Needed only the first time — the app isn&apos;t notarized yet.</p>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0">3</div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-2">Grant permissions</h4>
                          <p className="text-sm text-slate-400">
                            Grant <strong className="text-slate-200">Screen Recording</strong> permission when asked (System Settings → Privacy &amp; Security → Screen Recording). This is required to capture the interviewer&apos;s voice. Quit and reopen JavihAI after granting it.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0">4</div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-2">Sign in and start</h4>
                          <p className="text-sm text-slate-400">
                            Sign in with your account and press <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">⌥ Option</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">H</kbd> to show/hide the overlay. Click <strong>Start</strong> to begin.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
