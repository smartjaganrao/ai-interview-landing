'use client';

import BrowserKeepFileGraphic from './BrowserKeepFileGraphic';
import SmartScreenGraphic from './SmartScreenGraphic';
import MacGatekeeperGraphic from './MacGatekeeperGraphic';

interface DownloadStepsModalProps {
  open: boolean;
  onClose: () => void;
  os: 'windows' | 'mac';
  onSwitchOS: (os: 'windows' | 'mac') => void;
  downloadUrl: string;
}

function ModalStep({ n, title, children, last }: { n: number; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex gap-3 ${!last ? 'pb-6 mb-6 border-b border-white/5' : ''}`}>
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-sm flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function DownloadStepsModal({ open, onClose, os, onSwitchOS, downloadUrl }: DownloadStepsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="How to install JavihAI">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card card-glow bg-slate-900">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="badge text-xs mb-2">🎉 Download started</div>
            <h2 className="text-xl font-black text-white">Get JavihAI running in 2 minutes</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl px-2 flex-shrink-0" aria-label="Close">✕</button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => onSwitchOS('windows')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${os === 'windows' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            🪟 Windows
          </button>
          <button
            onClick={() => onSwitchOS('mac')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${os === 'mac' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            🍎 Mac
          </button>
        </div>

        {os === 'windows' ? (
          <div>
            <ModalStep n={1} title="Your browser may block the download">
              <p className="text-sm text-slate-400 mb-3">
                Chrome or Edge might flag the file as unusual. If so, click the small arrow next to it and
                choose <strong className="text-white">Keep</strong>.
              </p>
              <BrowserKeepFileGraphic />
            </ModalStep>
            <ModalStep n={2} title="Run the file">
              <p className="text-sm text-slate-400 mb-3">
                Open the downloaded <code className="text-indigo-300">.exe</code>. If Windows shows a security
                warning, click <strong className="text-white">More info → Run anyway</strong>.
              </p>
              <SmartScreenGraphic />
            </ModalStep>
            <ModalStep n={3} title="Sign in and go" last>
              <p className="text-sm text-slate-400">
                Sign in with the same Google account you used here, allow microphone access when asked, and
                you&apos;re ready for your next interview.
              </p>
            </ModalStep>
          </div>
        ) : (
          <div>
            <ModalStep n={1} title="Open the .dmg">
              <p className="text-sm text-slate-400">
                Open the downloaded file and drag <strong className="text-white">JavihAI</strong> into
                your <strong className="text-white">Applications</strong> folder.
              </p>
            </ModalStep>
            <ModalStep n={2} title="Open it the first time">
              <p className="text-sm text-slate-400 mb-3">
                macOS blocks new apps by default. Right-click JavihAI in Applications and
                confirm <strong className="text-white">Open</strong> — only needed once.
              </p>
              <MacGatekeeperGraphic />
            </ModalStep>
            <ModalStep n={3} title="Sign in and go" last>
              <p className="text-sm text-slate-400">
                Sign in with the same Google account you used here, grant Screen Recording permission when
                asked, and you&apos;re ready for your next interview.
              </p>
            </ModalStep>
          </div>
        )}

        <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
          <a href={downloadUrl} target="_blank" rel="noopener" className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            Download didn&apos;t start? Try again →
          </a>
          <button onClick={onClose} className="btn btn-primary text-sm px-5 py-2">Got it</button>
        </div>
      </div>
    </div>
  );
}
