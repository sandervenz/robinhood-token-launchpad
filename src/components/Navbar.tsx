'use client';

import { useLaunchFee } from '@/hooks/useLaunchFee';
import { useTokens } from '@/context/TokenContext';
import { Sparkles, Activity } from 'lucide-react';
import { WalletButton } from './WalletButton';

export function Navbar() {
  const { feeFormatted, isLoading, isError } = useLaunchFee();
  const { phaseFilter, setPhaseFilter } = useTokens();

  const handleNavClick = (phase: 'all' | '0' | '2') => {
    setPhaseFilter(phase);
    const targetElement = document.getElementById('tokens');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 pt-4 pb-2">
      <div className="max-w-7xl mx-auto relative flex items-center justify-between gap-4">
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

        {/* Center: Perfectly Centered Floating Pill Navigation */}
        <nav className="hidden lg:flex items-center gap-1 glass-pill p-1 text-xs text-[#8F96A3] absolute left-1/2 -translate-x-1/2 shadow-xl shadow-black/40 border border-white/10">
          <button
            onClick={() => handleNavClick('all')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              phaseFilter === 'all'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-[#8F96A3] hover:text-white hover:bg-white/5'
            }`}
          >
            Explore Tokens
          </button>
          <button
            onClick={() => handleNavClick('0')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              phaseFilter === '0'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-[#8F96A3] hover:text-white hover:bg-white/5'
            }`}
          >
            Bonding Curves
          </button>
          <button
            onClick={() => handleNavClick('2')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              phaseFilter === '2'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-[#8F96A3] hover:text-white hover:bg-white/5'
            }`}
          >
            Graduation (v4)
          </button>
        </nav>

        {/* Right: Launch Fee & Wallet Controls */}
        <div className="flex items-center gap-3">
          {/* Launch Fee Pill */}
          <div className="hidden md:flex items-center gap-2 glass-pill px-3.5 py-1.5 text-xs text-[#8F96A3]">
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

          {/* Connect / User Account Button */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
