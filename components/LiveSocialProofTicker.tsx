'use client';

import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  name: string;
  city: string;
  action: string;
  detail: string;
  timeAgo: string;
  tag: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    name: 'Priya S.',
    city: 'Bengaluru',
    action: 'unlocked Quick Pass',
    detail: 'for tomorrow’s TCS Digital interview',
    timeAgo: '3 mins ago',
    tag: '⚡ Quick Pass',
  },
  {
    id: '2',
    name: 'Rahul K.',
    city: 'Hyderabad',
    action: 'cracked Infosys DSE round',
    detail: 'using Pro Pass real-time copilot',
    timeAgo: '9 mins ago',
    tag: '🎯 Offer Cracked',
  },
  {
    id: '3',
    name: 'Amit M.',
    city: 'Pune',
    action: 'unlocked Quick Pass (₹249)',
    detail: 'applied coupon CAMPUS100 in college group',
    timeAgo: '16 mins ago',
    tag: '🎟️ CAMPUS100',
  },
  {
    id: '4',
    name: 'Ananya D.',
    city: 'Gurugram',
    action: 'upgraded to Power Plan',
    detail: 'unlimited monthly practice for FAANG prep',
    timeAgo: '22 mins ago',
    tag: '⭐ Power Plan',
  },
  {
    id: '5',
    name: 'Karthik V.',
    city: 'Chennai',
    action: 'cleared Amazon SDE-1 OA',
    detail: 'solved DP & graph questions in sub-2s',
    timeAgo: '31 mins ago',
    tag: '💻 Coding Round',
  },
  {
    id: '6',
    name: 'Sneha P.',
    city: 'Noida',
    action: 'split Hostel 5-Pack',
    detail: 'saved 43% with 4 hostel roommates',
    timeAgo: '42 mins ago',
    tag: '👥 Hostel Pack',
  },
  {
    id: '7',
    name: 'Vikram R.',
    city: 'Pune',
    action: 'cleared AWS Solutions Architect',
    detail: 'scored 890/1000 on browser exam',
    timeAgo: '48 mins ago',
    tag: '📜 AWS Certified',
  },
  {
    id: '8',
    name: 'Meera N.',
    city: 'Hyderabad',
    action: 'passed Azure Fundamentals (AZ-900)',
    detail: 'real-time hints for cloud architecture',
    timeAgo: '55 mins ago',
    tag: '☁️ Azure Exam',
  },
];

export default function LiveSocialProofTicker({ className = '' }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsFading(false);
      }, 250);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const item = ACTIVITIES[currentIndex];

  return (
    <div
      className={`inline-flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/90 dark:bg-slate-900/90 border border-blue-500/20 backdrop-blur-md shadow-sm max-w-full overflow-hidden transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      title="Live candidate activity across India"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Live
        </span>
      </div>

      <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

      <div
        className={`min-w-0 flex-1 flex items-center gap-1.5 text-xs text-[#1A1512] dark:text-slate-200 transition-opacity duration-200 ${
          isFading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">
          {item.name} ({item.city})
        </span>
        <span className="font-medium shrink-0">{item.action}</span>
        <span className="hidden sm:inline text-[#78716C] dark:text-slate-400 truncate max-w-[160px] md:max-w-[240px] lg:max-w-[340px]">
          · {item.detail}
        </span>
      </div>

      <div className="ml-auto hidden md:flex items-center gap-2 shrink-0">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
          {item.tag}
        </span>
        <span className="text-[10px] text-[#78716C] dark:text-slate-400 whitespace-nowrap">{item.timeAgo}</span>
      </div>
    </div>
  );
}
