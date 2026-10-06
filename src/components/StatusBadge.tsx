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
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#C8F031]/10 text-[#C8F031] border border-[#C8F031]/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8F031] animate-pulse" />
          <span>Trading</span>
        </span>
      );
    case 1:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Threshold Met</span>
        </span>
      );
    case 2:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Graduated (v4)</span>
        </span>
      );
    case 3:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Cancelled</span>
        </span>
      );
  }
}
