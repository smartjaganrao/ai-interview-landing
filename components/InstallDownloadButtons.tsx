'use client';

import { useEffect, useState } from 'react';
import DownloadStepsModal from './DownloadStepsModal';

function detectDesktopOS(): 'mac' | 'windows' | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) return 'mac';
  return null;
}

export default function InstallDownloadButtons({ winReady, macReady }: { winReady: boolean; macReady: boolean }) {
  const [detectedOS, setDetectedOS] = useState<'mac' | 'windows' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalOS, setModalOS] = useState<'windows' | 'mac'>('windows');

  useEffect(() => {
    setDetectedOS(detectDesktopOS());
  }, []);

  const openModal = (os: 'windows' | 'mac') => {
    setModalOS(os);
    setShowModal(true);
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {winReady && (
          <a
            href="/api/download/win"
            target="_blank"
            rel="noopener"
            onClick={() => openModal('windows')}
            className={`btn btn-lg flex-1 text-center ${detectedOS === 'mac' ? 'btn-secondary' : 'btn-primary'}`}
          >
            ⬇ Download for Windows
          </a>
        )}
        {macReady && (
          <a
            href="/api/download/mac"
            target="_blank"
            rel="noopener"
            onClick={() => openModal('mac')}
            className={`btn btn-lg flex-1 text-center ${detectedOS === 'mac' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ⬇ Download for Mac
          </a>
        )}
      </div>
      {macReady && (
        <p className="text-xs text-slate-500 mt-2">
          Mac button works on Apple Silicon and Intel. On an older Intel Mac?{' '}
          <a href="/api/download/mac?arch=x64" target="_blank" rel="noopener" onClick={() => openModal('mac')} className="text-indigo-300 hover:underline">Use the Intel-specific link</a>{' '}instead.
        </p>
      )}

      <DownloadStepsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        os={modalOS}
        onSwitchOS={setModalOS}
        downloadUrl={modalOS === 'windows' ? '/api/download/win' : '/api/download/mac'}
      />
    </div>
  );
}
