'use client';

import { useEffect, useState } from 'react';
import DownloadStepsModal from './DownloadStepsModal';
import GoogleSignInModal from './GoogleSignInModal';
import { useGatedDownload } from '@/hooks/useGatedDownload';

function detectDesktopOS(): 'mac' | 'windows' | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) return 'mac';
  return null;
}

export default function InstallDownloadButtons({ winReady, macReady, winPortableReady }: { winReady: boolean; macReady: boolean; winPortableReady: boolean }) {
  const [detectedOS, setDetectedOS] = useState<'mac' | 'windows' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalOS, setModalOS] = useState<'windows' | 'mac'>('windows');

  const openModal = (os: 'windows' | 'mac') => {
    setModalOS(os);
    setShowModal(true);
  };

  const { showSignIn, requestDownload, cancelSignIn, handleSignedIn, retryUrl } =
    useGatedDownload((platform) => openModal(platform));

  useEffect(() => {
    setDetectedOS(detectDesktopOS());
  }, []);

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {winReady && (
          <button
            type="button"
            onClick={() => requestDownload('windows')}
            className={`btn btn-lg flex-1 text-center ${detectedOS === 'mac' ? 'btn-secondary' : 'btn-primary'}`}
          >
            ⬇ Download for Windows
          </button>
        )}
        {macReady && (
          <button
            type="button"
            onClick={() => requestDownload('mac')}
            className={`btn btn-lg flex-1 text-center ${detectedOS === 'mac' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ⬇ Download for Mac
          </button>
        )}
      </div>
      {(winPortableReady || macReady) && (
        <p className="text-xs text-slate-500 mt-2 space-x-1">
          {winPortableReady && (
            <span>
              Prefer no install on Windows?{' '}
              <button type="button" onClick={() => requestDownload('windows', 'portable')} className="text-indigo-300 hover:underline">Get the portable .exe</button>{' '}
              (no auto-update — installer is recommended).
            </span>
          )}
          {macReady && (
            <span>
              Mac button works on Apple Silicon and Intel. On an older Intel Mac?{' '}
              <button type="button" onClick={() => requestDownload('mac', 'x64')} className="text-indigo-300 hover:underline">Use the Intel-specific link</button>{' '}instead.
            </span>
          )}
        </p>
      )}

      <GoogleSignInModal open={showSignIn} onClose={cancelSignIn} onSignedIn={handleSignedIn} />

      <DownloadStepsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        os={modalOS}
        onSwitchOS={setModalOS}
        downloadUrl={retryUrl(modalOS)}
      />
    </div>
  );
}
