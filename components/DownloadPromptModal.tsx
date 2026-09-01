'use client';

interface DownloadPromptModalProps {
  open: boolean;
  onClose: () => void;
  os: 'mac' | 'windows' | null;
  appVersion: string;
  onDownload: (platform: 'windows' | 'mac') => void;
}

/**
 * Auto-shown once per login session (see app/dashboard/page.tsx) to nudge a
 * signed-in user toward actually downloading the desktop app — the hero card
 * further down the page is passive and easy to miss. Dismissible by design
 * (X, backdrop click, "Maybe later"): unlike CompleteProfileModal this isn't
 * blocking, since a hard block on a user who genuinely can't download right
 * now would bounce exactly the people we're trying to convert.
 */
export default function DownloadPromptModal({ open, onClose, os, appVersion, onDownload }: DownloadPromptModalProps) {
  if (!open) return null;

  const versionLabel = appVersion ? ` (${appVersion})` : '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-2xl max-w-md w-full border border-indigo-500/30 shadow-2xl animate-fade-in-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <span className="text-white font-black text-lg">🚀 You&apos;re In!</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <span className="text-white text-xl">✕</span>
          </button>
        </div>

        <div className="p-6 text-center">
          <p className="text-slate-300 mb-5">
            Get <span className="text-white font-bold">JavihAI Desktop</span> — the AI interview coach that
            listens, thinks, and answers for you in real time.
          </p>

          {os ? (
            <>
              <button
                onClick={() => onDownload(os)}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all mb-3"
              >
                ⬇ Download for {os === 'mac' ? 'Mac' : 'Windows'}{versionLabel}
              </button>
              <button
                onClick={() => onDownload(os === 'mac' ? 'windows' : 'mac')}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                On {os === 'mac' ? 'Windows' : 'Mac'} instead? Get that version
              </button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onDownload('windows')}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                ⬇ Windows{versionLabel}
              </button>
              <button
                onClick={() => onDownload('mac')}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                ⬇ Mac{versionLabel}
              </button>
            </div>
          )}

          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 mt-4">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
