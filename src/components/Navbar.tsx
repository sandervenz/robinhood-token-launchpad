'use client';

import { useLaunchFee } from '@/hooks/useLaunchFee';
import { Sparkles, Activity, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const { feeFormatted, isLoading, isError } = useLaunchFee();

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 pt-4 pb-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c2333] to-[#0d111a] border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">COINTINENTAL</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Launchpad
              </span>
            </div>
            <p className="text-xs text-[#8F96A3]">Robinhood Testnet</p>
          </div>
        </div>

        {/* Center: Floating Pill Navigation */}
        <nav className="hidden md:flex items-center gap-6 glass-pill px-6 py-2 text-sm text-[#8F96A3]">
          <span className="text-white font-medium cursor-pointer transition-colors">
            Explore Tokens
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            Bonding Curves
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            Graduation (v4)
          </span>
        </nav>

        {/* Right: Network Status & Launch Fee Badge */}
        <div className="flex items-center gap-3">
          {/* Launch Fee Pill */}
          <div className="flex items-center gap-2 glass-pill px-3.5 py-1.5 text-xs text-[#8F96A3]">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Launch Fee:</span>
            {isLoading ? (
              <span className="text-gray-400 animate-pulse">Loading...</span>
            ) : isError ? (
              <span className="text-rose-400">Error</span>
            ) : (
              <span className="font-semibold text-white">
                {feeFormatted} ETH
              </span>
            )}
          </div>

          {/* Chain Badge */}
          <div className="hidden sm:flex items-center gap-1.5 glass-pill px-3 py-1.5 text-xs text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Robinhood 46630</span>
          </div>
        </div>
      </div>
    </header>
  );
}
