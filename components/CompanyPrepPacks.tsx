'use client';

import { useState } from 'react';

interface QuestionItem {
  id: string;
  question: string;
  category: string;
  focus: string;
  sampleBullet: string;
}

interface CompanyPack {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  icon: string;
  description: string;
  interviewStyle: string;
  recommendedMode: string;
  questions: QuestionItem[];
}

const COMPANY_PACKS: CompanyPack[] = [
  {
    id: 'product',
    name: 'Flipkart · Swiggy · Zomato',
    badge: 'Tier 1 Product',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    icon: '⚡',
    description: 'High-concurrency distributed systems, flash sales, low latency matching, and resilient caching.',
    interviewStyle: 'System Design (HLD + LLD), Kafka, Redis, Distributed Locking, Concurrency',
    recommendedMode: 'Deep Architect + Desi Mode (Indian Scale)',
    questions: [
      {
        id: 'flipkart-flash-sale',
        question: 'Design a Flash-Sale inventory reservation engine handling 250,000 QPS with strictly zero overselling.',
        category: 'System Design (HLD)',
        focus: 'Redis Lua scripts, Distributed locks, DB sharding, Async queue',
        sampleBullet: 'Decouple checkout with Redis decrby atomic decrements + Kafka order queue; reconcile to PostgreSQL asynchronously.',
      },
      {
        id: 'swiggy-dispatch',
        question: 'How do you design a delivery partner matching & dispatch algorithm with under 500ms P99 latency?',
        category: 'Low-Level Design',
        focus: 'Geohash spatial indexing, Quadtrees, Driver state machine',
        sampleBullet: 'Index driver coordinates using Uber H3 / Geohash level 7; use sliding-window candidate scoring for ETA & batching.',
      },
      {
        id: 'zomato-cache-stampede',
        question: 'How do you prevent Cache Stampede (Thundering Herd) when restaurant menu cache expires during dinner peak?',
        category: 'Backend Architecture',
        focus: 'Probabilistic early expiration (XFetch), Mutex locking, Background refresh',
        sampleBullet: 'Implement probabilistic early expiration (XFetch) + Redis Redlock mutex so only 1 worker regenerates the cache.',
      },
      {
        id: 'kafka-idempotency',
        question: 'How do you guarantee strictly once processing with Kafka consumers across network partitions?',
        category: 'Distributed Systems',
        focus: 'Idempotency keys, Outbox pattern, Read committed isolation',
        sampleBullet: 'Store unique messageId in database unique constraint with Transactional Outbox pattern before acknowledging offset.',
      },
    ],
  },
  {
    id: 'faang',
    name: 'Amazon India · Microsoft · Google',
    badge: 'Big Tech / FAANG',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    icon: '🚀',
    description: 'Bar Raiser behavioral scenarios, Leadership Principles, deep algorithmic rigor, and scalable design.',
    interviewStyle: 'STAR Method, Consistent Hashing, Distributed Consensus, Tail Latency debugging',
    recommendedMode: 'Fast Mode + STAR Teleprompter',
    questions: [
      {
        id: 'amzn-customer-obsession',
        question: 'Tell me about a time you pushed back against leadership or product timelines to protect system reliability.',
        category: 'Leadership Principles',
        focus: 'Customer Obsession, Have Backbone; Disagree & Commit',
        sampleBullet: 'STAR format: Situation with 10M user API launch; Task to meet deadline; Action of demonstrating data loss risks; Result of 99.99% uptime.',
      },
      {
        id: 'rate-limiter',
        question: 'Design a distributed API Rate Limiter supporting tiered tenant quotas (Token Bucket vs Sliding Window).',
        category: 'System Design',
        focus: 'Redis Sliding Window Log, Token Bucket, Local memory fallback',
        sampleBullet: 'Use Redis sorted sets with timestamp scores for exact sliding window; fallback to in-memory bucket if Redis times out.',
      },
      {
        id: 'debug-p99',
        question: 'Your service P99 latency spiked from 35ms to 1,200ms after a deployment. Walk me through how you isolate the root cause.',
        category: 'Production Engineering',
        focus: 'Distributed tracing, GC pauses, Connection pool starvation',
        sampleBullet: 'Trace Jaeger/Zipkin spans, inspect JVM GC pause telemetry, verify DB connection pool saturation, and review rollback triggers.',
      },
      {
        id: 'consistent-hashing',
        question: 'Explain Consistent Hashing and how virtual nodes prevent hotspot skew when cluster nodes fail.',
        category: 'Algorithms & Architecture',
        focus: 'Hash ring, Virtual nodes (vnodes), MD5 / MurmurHash',
        sampleBullet: 'Map each physical node to 256 virtual positions on the 0 to 2^32-1 ring to evenly distribute key re-allocation during churn.',
      },
    ],
  },
  {
    id: 'fintech',
    name: 'PhonePe · CRED · Razorpay',
    badge: 'FinTech & Payments',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    icon: '💳',
    description: 'Financial ledger consistency, ACID transactions, UPI payment states, and zero-loss idempotent architectures.',
    interviewStyle: 'Saga Pattern, Double-Entry Ledger, Idempotency, Fraud Rules',
    recommendedMode: 'Deep Architect + Financial Guardrails',
    questions: [
      {
        id: 'phonepe-ledger',
        question: 'How do you design a double-entry bookkeeping ledger where transactions can never be edited or lost?',
        category: 'Core FinTech Design',
        focus: 'Immutable append-only tables, Debit/Credit balancing constraint',
        sampleBullet: 'Ensure every transfer writes matching DEBIT and CREDIT lines with strict database balance invariants and audit trails.',
      },
      {
        id: 'upi-timeouts',
        question: 'A UPI payment gateway times out without returning SUCCESS or FAILED. How do you handle customer state and callback reconciliation?',
        category: 'Payments Architecture',
        focus: 'PENDING state machine, Webhook polling, Idempotency key',
        sampleBullet: 'Mark order as PENDING; client polls with backoff; run async webhook verification job before initiating auto-refund.',
      },
      {
        id: 'optimistic-locking',
        question: 'Compare Optimistic vs Pessimistic locking for wallet deduction in high-frequency payment apps.',
        category: 'Databases & Concurrency',
        focus: 'SELECT FOR UPDATE vs version column, deadlocks',
        sampleBullet: 'Use versioned optimistic locking for low-contention reads; pessimistic SELECT FOR UPDATE with short timeouts for user balance deductions.',
      },
    ],
  },
  {
    id: 'services',
    name: 'TCS · Infosys · Wipro · Cognizant',
    badge: 'Enterprise & IT Services',
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    icon: '🏢',
    description: 'Core Java/OOPs foundations, Spring Boot microservices, SQL joins, and client communication scenarios.',
    interviewStyle: 'Core Java 8-21, Spring Annotations, SQL Query Optimization, Scenario Handling',
    recommendedMode: 'Desi Mode (Standard Technical)',
    questions: [
      {
        id: 'java-hashmap',
        question: 'Explain how HashMap works internally in Java 8, including hash collisions and bucket treeification.',
        category: 'Core Java',
        focus: 'hashCode(), equals(), Node array, Red-Black Tree threshold (TREEIFY_THRESHOLD = 8)',
        sampleBullet: 'Array of Nodes; hash index = (n - 1) & hash; collision converts linked list to balanced Red-Black tree when chain exceeds 8 elements.',
      },
      {
        id: 'spring-annotations',
        question: 'What is the precise difference between @Component, @Service, and @Repository in Spring Boot?',
        category: 'Spring Boot Framework',
        focus: 'Stereotype annotations, PersistenceExceptionTranslationPostProcessor',
        sampleBullet: '@Component is generic bean; @Service is business logic layer; @Repository adds automatic SQL exception translation to Spring Data exceptions.',
      },
      {
        id: 'sql-optimization',
        question: 'How would you optimize a slow running SQL query with multiple JOINs and 5 million rows?',
        category: 'Database & SQL',
        focus: 'EXPLAIN query plan, Composite indexes, Avoiding SELECT *',
        sampleBullet: 'Run EXPLAIN ANALYZE, replace full table scans with B-Tree indexes on foreign keys, and filter early in WHERE clauses before JOIN.',
      },
      {
        id: 'client-escalation',
        question: 'Describe how you handle a client escalation when a production deployment introduces an unexpected defect.',
        category: 'Client Delivery & Agile',
        focus: 'Transparency, Root cause analysis (RCA), Hotfix SOP',
        sampleBullet: 'Acknowledge immediately with ETA, trigger hotfix rollback protocol, draft transparent RCA within 24 hours, and implement regression test.',
      },
    ],
  },
];

interface CompanyPrepPacksProps {
  onSelectQuestion?: (question: string) => void;
}

export function CompanyPrepPacks({ onSelectQuestion }: CompanyPrepPacksProps) {
  const [selectedPackId, setSelectedPackId] = useState<string>('product');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentPack = COMPANY_PACKS.find((p) => p.id === selectedPackId) || COMPANY_PACKS[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 text-teal-300 mb-2">
            <span>✨</span>
            Top Indian Tech Company Prep Packs
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Targeted Interview Question Packs &amp; AI Teleprompter Cheatsheets
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Hand-curated high-yield questions for India&apos;s leading tech employers. Practice answering live or copy high-impact prompt templates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 shrink-0">
          <span className="text-emerald-400">🛡️</span>
          <span>Calibrated for 2026 Hiring Bar</span>
        </div>
      </div>

      {/* Company Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
        {COMPANY_PACKS.map((pack) => {
          const isSelected = pack.id === selectedPackId;
          return (
            <button
              key={pack.id}
              onClick={() => setSelectedPackId(pack.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-teal-500/60 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{pack.icon}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pack.badgeColor}`}>
                  {pack.badge}
                </span>
              </div>
              <div className="mt-3">
                <div className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-teal-300' : 'text-white'}`}>
                  {pack.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {pack.questions.length} Core Questions
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Company Detail Bar */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span>📚</span> Focus Area:
            </span>
            <span className="text-slate-300">{currentPack.interviewStyle}</span>
          </div>
          <div className="text-slate-400">{currentPack.description}</div>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700/60">
          <span className="text-amber-400">⚡</span>
          <span className="text-[11px] font-medium text-slate-300">
            Recommended Mode: <strong className="text-white">{currentPack.recommendedMode}</strong>
          </span>
        </div>
      </div>

      {/* Question Cards Grid */}
      <div className="mt-6 space-y-3.5">
        {currentPack.questions.map((q, index) => {
          const isCopied = copiedId === q.id;
          return (
            <div
              key={q.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700/80 transition-all duration-150 flex flex-col md:flex-row md:items-start justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                    Q{index + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                    {q.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Key concepts: <span className="text-slate-300">{q.focus}</span>
                  </span>
                </div>

                <div className="text-sm font-semibold text-white group-hover:text-teal-200 transition-colors">
                  &ldquo;{q.question}&rdquo;
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-teal-400 font-bold mt-0.5 shrink-0">AI Insight:</span>
                  <span className="leading-relaxed">{q.sampleBullet}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-row md:flex-col gap-2 shrink-0 self-end md:self-start">
                <button
                  onClick={() => handleCopy(q.id, q.question)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 min-w-[120px] cursor-pointer"
                  title="Copy question text"
                >
                  {isCopied ? (
                    <>
                      <span className="text-emerald-400">✓</span>
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Question</span>
                    </>
                  )}
                </button>

                {onSelectQuestion && (
                  <button
                    onClick={() => onSelectQuestion(q.question)}
                    className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/10 flex items-center justify-center gap-1.5 min-w-[120px] cursor-pointer"
                    title="Load question into live simulator"
                  >
                    <span>Practice in AI</span>
                    <span>&rarr;</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Banner */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-transparent border border-teal-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="text-amber-400 text-base shrink-0">🔥</span>
          <span>
            <strong>Pro Tip for Indian Candidates:</strong> In your desktop app, enable <strong>Desi Mode</strong> in Settings to automatically tailor compensation, Indian technology stacks, and enterprise project examples.
          </span>
        </div>
      </div>
    </div>
  );
}
