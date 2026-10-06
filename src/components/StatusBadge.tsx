'use client';

import { TokenPhase } from '@/types/token';

interface StatusBadgeProps {
  phase: TokenPhase;
  className?: string;
}

export function StatusBadge({ phase, className = '' }: StatusBadgeProps) {
  switch (phase) {
    case 0:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Curve</span>
        </span>
      );
    case 1:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Threshold Reached</span>
        </span>
      );
    case 2:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/25 shadow-sm shadow-purple-500/5 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Graduated (v4)</span>
        </span>
      );
    case 3:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Cancelled</span>
        </span>
      );
  }
}
