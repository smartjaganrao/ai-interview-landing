'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioDiagnosticModal({ isOpen, onClose }: AudioDiagnosticModalProps) {
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
  const [speakerSuccess, setSpeakerSuccess] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'mic' | 'speaker' | 'troubleshooting'>('mic');
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop media stream & audio context
  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
  }, [micStream]);

  // Request Microphone Access & Setup Analyser
  const startMicTest = useCallback(async (deviceId?: string) => {
    stopAudio();
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMicStream(stream);
      setMicPermission('granted');

      // Setup Web Audio Analyser
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setVolumeLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();

      // Enumerate available input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === 'audioinput');
      setAudioDevices(inputs);
      if (inputs.length > 0 && !selectedDevice) {
        setSelectedDevice(inputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Microphone permission rejected or unavailable:', err);
      setMicPermission('denied');
      setMicStream(null);
    }
  }, [stopAudio, selectedDevice]);

  // Handle modal open / close
  useEffect(() => {
    if (isOpen) {
      startMicTest();
    } else {
      stopAudio();
    }
    return () => {
      stopAudio();
    };
  }, [isOpen, startMicTest, stopAudio]);

  // Test Speaker / Output with SpeechSynthesis or Chime Tone
  const playSpeakerTest = () => {
    setIsTestingSpeaker(true);
    setSpeakerSuccess(null);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        'Hello! This is a test interview question from JavihAI. Can you hear this voice clearly in your headphones?'
      );
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        setIsTestingSpeaker(false);
      };
      utterance.onerror = () => {
        playFallbackBeep();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      playFallbackBeep();
    }
  };

  const playFallbackBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
      setTimeout(() => setIsTestingSpeaker(false), 1200);
    } catch {
      setIsTestingSpeaker(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-lg">
              🎧
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Pre-Interview Audio &amp; Mic Check
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Diagnostics
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Verify your microphone and audio before entering live Zoom, Google Meet, or Teams calls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('mic')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mic'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎤</span>
            1. Microphone Check
          </button>
          <button
            onClick={() => setActiveTab('speaker')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'speaker'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔊</span>
            2. Interviewer Audio Output
          </button>
          <button
            onClick={() => setActiveTab('troubleshooting')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'troubleshooting'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚙️</span>
            3. OS Permission Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: MIC CHECK */}
          {activeTab === 'mic' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Microphone Input Status
                  </span>
                  {micPermission === 'granted' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      <span>✓</span> Mic Connected &amp; Active
                    </span>
                  ) : micPermission === 'denied' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                      <span>⚠️</span> Permission Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      <span className="animate-spin">↻</span> Requesting Mic Access...
                    </span>
                  )}
                </div>

                {/* Device Selector */}
                {audioDevices.length > 1 && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Select Audio Input Device:</label>
                    <select
                      value={selectedDevice}
                      onChange={(e) => {
                        setSelectedDevice(e.target.value);
                        startMicTest(e.target.value);
                      }}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      {audioDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Microphone ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Live Volume Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Real-time Volume Level:</span>
                    <span className={`font-mono font-bold ${
                      volumeLevel > 75 ? 'text-amber-400' : volumeLevel > 15 ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {volumeLevel > 0 ? `${volumeLevel}%` : 'Silent'}
                      {volumeLevel > 15 ? ' (Speaking Detected)' : ''}
                    </span>
                  </div>

                  {/* Visualizer bars */}
                  <div className="h-6 w-full bg-slate-900 rounded-lg overflow-hidden flex items-center px-1.5 gap-1 border border-slate-800">
                    {Array.from({ length: 28 }).map((_, idx) => {
                      const threshold = (idx / 28) * 100;
                      const isActive = volumeLevel >= threshold;
                      const isHigh = idx > 20;
                      const isMid = idx > 12;
                      return (
                        <div
                          key={idx}
                          className={`flex-1 rounded-sm transition-all duration-75 ${
                            isActive
                              ? isHigh
                                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : isMid
                                ? 'bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.5)]'
                                : 'bg-emerald-400'
                              : 'bg-slate-800/80'
                          }`}
                          style={{
                            height: isActive ? `${Math.max(25, (idx / 28) * 100)}%` : '20%',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  💡 Speak a sentence out loud (e.g. <em>&ldquo;I have 4 years of backend experience with Node.js and AWS&rdquo;</em>). The green bars should jump when you speak.
                </p>

                {micPermission === 'denied' && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                    <span className="text-base shrink-0">⚠️</span>
                    <div>
                      <strong>Microphone access was denied.</strong> Click the lock/settings icon in your browser URL bar, allow Microphone, and click &ldquo;Re-test Mic&rdquo;.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => startMicTest(selectedDevice)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <span>↻</span> Re-test Mic
                </button>

                <button
                  onClick={() => setActiveTab('speaker')}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
                >
                  Next: Test Output Audio &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SPEAKER / OUTPUT AUDIO CHECK */}
          {activeTab === 'speaker' && (
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Interviewer Audio Test</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify that you can clearly hear questions through your headphones or speakers.
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 text-xl">
                    🔊
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-3">
                  <div className="text-xs text-slate-300 italic">
                    &ldquo;Hello! This is a test interview question from JavihAI. Can you hear this voice clearly in your headphones?&rdquo;
                  </div>

                  <button
                    onClick={playSpeakerTest}
                    disabled={isTestingSpeaker}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50 cursor-pointer"
                  >
                    {isTestingSpeaker ? (
                      <>
                        <span className="animate-spin">↻</span> Playing Test Voice...
                      </>
                    ) : (
                      <>
                        <span>🔊</span> Click to Play Test Voice
                      </>
                    )}
                  </button>
                </div>

                {/* Did you hear it feedback */}
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-xs text-slate-400 mb-2">Did you hear the test voice clearly?</div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSpeakerSuccess(true)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                        speakerSuccess === true
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <span>✓</span> Yes, Sounds Great!
                    </button>
                    <button
                      onClick={() => {
                        setSpeakerSuccess(false);
                        setActiveTab('troubleshooting');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                        speakerSuccess === false
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <span>⚠️</span> No, I Hear Nothing
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveTab('mic')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  &larr; Back to Mic
                </button>
                <button
                  onClick={() => setActiveTab('troubleshooting')}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  View OS Settings &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: OS PERMISSION & TROUBLESHOOTING GUIDE */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider">
                  <span>🛡️</span>
                  Live Interview Call Permission Checklist
                </div>

                <div className="space-y-3 text-xs">
                  {/* macOS item */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-semibold text-white flex items-center gap-2">
                      🍎 For macOS Users (MacBook / Mac Mini)
                    </div>
                    <ul className="mt-2 space-y-1.5 text-slate-300 list-disc list-inside">
                      <li>
                        <strong>Microphone:</strong> System Settings &rarr; Privacy &amp; Security &rarr; Microphone &rarr; Toggle <strong>ON</strong> for JavihAI.
                      </li>
                      <li>
                        <strong>System Audio / Screen Capture:</strong> System Settings &rarr; Privacy &amp; Security &rarr; Screen Recording &rarr; Toggle <strong>ON</strong> for JavihAI (this enables reading the interviewer&apos;s audio from Zoom/Meet).
                      </li>
                      <li>
                        <strong>Headphones Note:</strong> If using AirPods or Bluetooth headsets, ensure your Mac&apos;s output stays set to your headset.
                      </li>
                    </ul>
                  </div>

                  {/* Windows item */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-semibold text-white flex items-center gap-2">
                      🪟 For Windows Users
                    </div>
                    <ul className="mt-2 space-y-1.5 text-slate-300 list-disc list-inside">
                      <li>
                        <strong>Microphone Access:</strong> Settings &rarr; Privacy &amp; Security &rarr; Microphone &rarr; Toggle <em>&ldquo;Let desktop apps access your microphone&rdquo;</em> to <strong>ON</strong>.
                      </li>
                      <li>
                        <strong>Audio Driver:</strong> Realtek or default speakers work out of the box with loopback capture.
                      </li>
                    </ul>
                  </div>

                  {/* Invisibility reminder */}
                  <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300">
                    <strong>🛡️ 100% Invisible on Screen Share:</strong> JavihAI uses native OS-level window exclusion (`setContentProtection`). Even if you share your entire screen on Zoom, Google Meet, or MS Teams, your interviewers will never see the overlay or this diagnostic.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveTab('speaker')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  &larr; Back to Output Test
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  All Set — Close Diagnostics ✅
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
