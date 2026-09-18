'use client';

import { useState, useEffect, useRef } from 'react';

interface Scenario {
  id: string;
  category: string;
  role: string;
  question: string;
  answerBullets: string[];
  desiBullets: string[];
  latencyMs: number;
}

const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'sys-design',
    category: '🏗️ System Design',
    role: 'SDE-2 / Architect',
    question: 'How do you design a high-throughput notification engine handling 10M pushes/min?',
    latencyMs: 1240,
    answerBullets: [
      '1. Regional API Gateway — Route traffic across Mumbai & Delhi clusters to cut latency by 45%.',
      '2. Kafka Topic Partitioning — Partition by userId hash; fan out via worker pools to FCM & APNs.',
      '3. Redis Deduplication — 24h sliding window TTL to prevent duplicate sends during retries.',
      '4. Fallback Circuit Breaker — Fallback to WhatsApp / SMS gateway when push delivery drops below 95%.',
    ],
    desiBullets: [
      '1. Regional Edge Nodes — Deployed across AWS ap-south-1 (Mumbai) & GCP asia-south2 (Delhi).',
      '2. Kafka Partitioning — Shard topics by Indian phone numbers (+91) for regional priority queues.',
      '3. Surge Handling — Rate-limit token bucket tuned for IPL / Diwali traffic spikes (10M/min).',
      '4. WhatsApp Fallback — Auto-switch to Meta WhatsApp Business API for high-priority OTPs.',
    ],
  },
  {
    id: 'dsa-coding',
    category: '💻 Coding & DSA',
    role: 'Frontend / Backend Engineer',
    question: 'How do you optimize a 2-Sum array problem from O(N²) to O(N) time complexity?',
    latencyMs: 980,
    answerBullets: [
      '1. Hash Map Lookup — Store complement (target - num) as key and index as value in a single pass.',
      '2. Space-Time Tradeoff — O(N) time complexity with O(N) auxiliary space instead of O(N²) nested loops.',
      '3. Two-Pointer Alternative — If array is pre-sorted, use left/right pointers in O(N) time and O(1) space.',
      '4. Edge Cases — Check empty array, duplicates, integer overflow, and negative target values.',
    ],
    desiBullets: [
      '1. Hash Map Approach — Single pass algorithm using JavaScript Map / Python dict for O(1) lookup.',
      '2. O(N) Time Complexity — Avoids O(N²) nested loop timeouts common in LeetCode Medium rounds.',
      '3. Two-Pointer Variant — If sorted, place left pointer at 0 and right at array.length - 1.',
      '4. Production Guard — Handle array bounds & memory overhead for large datasets (100k+ elements).',
    ],
  },
  {
    id: 'hr-behavioral',
    category: '👔 HR & Behavioral',
    role: 'All Tech Roles',
    question: 'Tell me about a critical project deadline clash and how you managed stakeholder expectations.',
    latencyMs: 1150,
    answerBullets: [
      '1. Situation — Sprint release faced unexpected third-party API deprecation 3 days before launch.',
      '2. Action — Conducted immediate impact analysis, proposed MVP scope reduction, and communicated to PM.',
      '3. Implementation — Feature-flagged non-essential modules while team patched core auth flow.',
      '4. Result — Delivered core functionality on schedule with 0 downtime and 99.9% release stability.',
    ],
    desiBullets: [
      '1. Situation — Critical client release at a fast-growing Indian tech startup collided with API changes.',
      '2. Action — Aligned engineering lead & product managers on a revised P0 vs P1 milestone plan.',
      '3. Execution — Worked closely with cross-functional dev team; introduced feature toggles for safety.',
      '4. Outcome — Successfully deployed P0 scope on time; P1 follow-up shipped seamlessly in next sprint.',
    ],
  },
  {
    id: 'prod-management',
    category: '💼 Product & Management',
    role: 'Product Manager / Lead',
    question: 'How do you measure success and prioritize features for a new checkout payment flow?',
    latencyMs: 1310,
    answerBullets: [
      '1. North Star Metric — Payment Conversion Completion Rate (%) from cart to successful order confirmation.',
      '2. Secondary Metrics — Drop-off rate at payment method selection, payment retry success rate, and latency.',
      '3. Prioritization Framework — RICE score (Reach, Impact, Confidence, Effort) for UPI, Cards, and NetBanking.',
      '4. A/B Experimentation — Roll out 1-click UPI intent flow to 15% user cohort before full launch.',
    ],
    desiBullets: [
      '1. North Star Metric — Checkout Conversion Rate across UPI (Google Pay / PhonePe), Cards & NetBanking.',
      '2. Friction Reduction — 1-click UPI intent & auto-fill OTP to solve common drop-offs in India checkout.',
      '3. Prioritization — RICE framework weighted heavily on UPI success rate & mobile load times.',
      '4. Pilot Launch — Staggered rollout across tier-1 & tier-2 city user cohorts with real-time logging.',
    ],
  },
];

export default function LiveGuideModeDemo({ compact = false, appVersion = 'v1.18' }: { compact?: boolean; appVersion?: string }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'candidate' | 'interviewer'>('candidate');
  const [desiMode, setDesiMode] = useState(true);
  const [simStep, setSimStep] = useState<'listening' | 'processing' | 'answering'>('answering');
  const [typedQuestion, setTypedQuestion] = useState('');
  const [visibleBullets, setVisibleBullets] = useState<number>(4);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scenario = DEMO_SCENARIOS[selectedIdx];
  const bullets = desiMode ? scenario.desiBullets : scenario.answerBullets;

  // Run real-time simulation sequence when switching scenarios
  const runSimulation = (idx: number) => {
    setSelectedIdx(idx);
    setSimStep('listening');
    setTypedQuestion('');
    setVisibleBullets(0);

    if (timerRef.current) clearTimeout(timerRef.current);

    const q = DEMO_SCENARIOS[idx].question;
    let charIdx = 0;

    // Phase 1: Simulate live audio question detection
    const typeInterval = setInterval(() => {
      if (charIdx < q.length) {
        setTypedQuestion(q.slice(0, charIdx + 1));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setSimStep('processing');

        // Phase 2: AI processing (<1.4s)
        timerRef.current = setTimeout(() => {
          setSimStep('answering');
          // Phase 3: Stream answer bullets
          let bCount = 1;
          setVisibleBullets(1);
          const bulletInterval = setInterval(() => {
            bCount++;
            setVisibleBullets(bCount);
            if (bCount >= 4) {
              clearInterval(bulletInterval);
            }
          }, 350);
        }, scenario.latencyMs);
      }
    }, 20);
  };

  useEffect(() => {
    runSimulation(0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={`w-full bg-slate-950 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl ${compact ? 'text-xs' : 'text-sm'}`}>
      
      {/* Simulator Top Bar */}
      <div className="bg-slate-900/90 border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-2 font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
            ⚡ JavihAI Live Guide Mode Simulator
          </span>
          <span className="text-[10px] bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full font-mono border border-blue-500/30 hidden sm:inline-block">
            {appVersion}
          </span>
        </div>

        {/* Candidate vs Interviewer View Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('candidate')}
            className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'candidate'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👁️</span> Candidate View <span className="text-[10px] text-indigo-200 font-normal">(Stealth Teleprompter)</span>
          </button>
          <button
            onClick={() => setActiveTab('interviewer')}
            className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'interviewer'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📹</span> Interviewer Screen Share <span className="text-[10px] text-green-400 font-normal">(100% Invisible!)</span>
          </button>
        </div>
      </div>

      {/* Preset Scenario Selector Buttons */}
      <div className="bg-slate-900/50 border-b border-white/5 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-bold mr-1">Select Scenario:</span>
          {DEMO_SCENARIOS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => runSimulation(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedIdx === idx
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {s.category}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDesiMode(!desiMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              desiMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span>🇮🇳</span> Desi Mode: {desiMode ? 'ON (₹ LPA Context)' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      {activeTab === 'candidate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[300px]">
          
          {/* Left: Call Window & Live Audio Meter (5 cols) */}
          <div className="lg:col-span-5 p-5 border-r border-white/5 bg-slate-950/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Live Call: Google Meet / Zoom</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">System Audio Live</span>
              </div>

              {/* Simulated Interviewer Avatar & Speech Waveform */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                    INT
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Interviewer (Senior Hiring Manager)</div>
                    <div className="text-[11px] text-slate-400">{scenario.role} Round</div>
                  </div>
                </div>

                {/* Animated Audio Equalizer Waveform */}
                <div className="flex items-center gap-1 h-6 px-2 bg-slate-950/90 rounded-lg border border-white/5">
                  <span className="text-[10px] text-indigo-400 font-mono mr-2">AUDIO CAPTURE</span>
                  {[40, 75, 30, 90, 60, 100, 45, 80, 55, 95, 35, 70, 50, 85, 40].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full transition-all duration-150"
                      style={{ height: simStep === 'listening' ? `${Math.max(15, Math.round(h * Math.random()))}%` : '20%' }}
                    />
                  ))}
                </div>
              </div>

              {/* Detected Question Box */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Detected Question</span>
                  {simStep === 'listening' && <span className="text-indigo-400 animate-pulse text-[10px]">Capturing voice…</span>}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/20 text-xs sm:text-sm font-semibold text-white leading-relaxed min-h-[70px]">
                  {typedQuestion || scenario.question}
                  {simStep === 'listening' && <span className="animate-pulse text-indigo-400">|</span>}
                </div>
              </div>
            </div>

            {/* Response Status Indicator */}
            <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {simStep === 'processing' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                    <span className="font-bold text-yellow-300">AI Thinking… ({scenario.latencyMs}ms)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-emerald-400">Answer Ready (⚡ {(scenario.latencyMs / 1000).toFixed(2)}s)</span>
                  </>
                )}
              </div>
              <button
                onClick={() => runSimulation(selectedIdx)}
                className="text-[11px] text-indigo-300 hover:underline font-bold"
              >
                ↻ Re-run Demo
              </button>
            </div>
          </div>

          {/* Right: Stealth Teleprompter Overlay Output (7 cols) */}
          <div className="lg:col-span-7 p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 flex flex-col justify-between relative">
            
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                🛡️ Stealth Teleprompter Active
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <div>
                  <div className="text-xs font-bold text-white">JavihAI Answer Guidance</div>
                  <div className="text-[11px] text-slate-400">Read naturally &amp; elaborate in your own words</div>
                </div>
              </div>

              {simStep === 'processing' ? (
                <div className="p-8 text-center space-y-2">
                  <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                  <div className="text-xs font-bold text-indigo-300">Generating bullet points…</div>
                </div>
              ) : (
                <div className="space-y-2.5 my-2">
                  {bullets.map((bullet, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border transition-all duration-300 ${
                        i < visibleBullets
                          ? 'bg-slate-900/90 border-indigo-500/30 opacity-100 translate-y-0 shadow-md'
                          : 'opacity-0 translate-y-2 pointer-events-none'
                      }`}
                    >
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono">Alt+S</kbd> to toggle stealth</span>
              <span>Tailored for Indian Interview Standards</span>
            </div>
          </div>

        </div>
      ) : (
        /* Interviewer Screen Share View (Shows total invisibility) */
        <div className="p-8 bg-slate-950 text-center space-y-4 min-h-[300px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-3xl">
            🛡️
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Interviewer Sees Only Your Video &amp; Presentation</h3>
            <p className="text-xs text-slate-300 max-w-lg mx-auto mt-1 leading-relaxed">
              JavihAI runs as a native OS graphics overlay. During Zoom, Google Meet, or MS Teams screen sharing, the interviewer sees <strong className="text-green-400">zero windows or popups</strong>. Your answer guidance remains 100% invisible to everyone else.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-white/10 max-w-md w-full text-left text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between text-white font-bold pb-1 border-b border-white/10">
              <span>Screen Share Status</span>
              <span className="text-green-400">Protected</span>
            </div>
            <div>• Zoom Screen Share: <span className="text-white">Clean</span></div>
            <div>• Google Meet Screen Share: <span className="text-white">Clean</span></div>
            <div>• MS Teams Screen Share: <span className="text-white">Clean</span></div>
          </div>
        </div>
      )}

    </div>
  );
}
