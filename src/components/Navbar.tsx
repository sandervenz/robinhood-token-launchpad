'use client';

import { useState } from 'react';
import { useLaunchFee } from '@/hooks/useLaunchFee';
import { useTokens } from '@/context/TokenContext';
import { Sparkles, Activity, Rocket } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { LaunchTokenModal } from './LaunchTokenModal';

export function Navbar() {
  const { feeFormatted, isLoading, isError } = useLaunchFee();
  const { phaseFilter, setPhaseFilter } = useTokens();
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

  const handleNavClick = (phase: 'all' | '0' | '2') => {
    setPhaseFilter(phase);
    const targetElement = document.getElementById('tokens');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 pt-4 pb-2">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 justify-self-start">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c2333] to-[#0d111a] border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/10 flex-shrink-0">
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

        {/* Center: Perfectly Centered Floating Pill Navigation (No Collision) */}
        <nav className="hidden lg:flex items-center gap-1 glass-pill p-1 text-xs text-[#8F96A3] justify-self-center shadow-xl shadow-black/40 border border-white/10">
          <button
            onClick={() => handleNavClick('all')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
              phaseFilter === 'all'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-[#8F96A3] hover:text-white hover:bg-white/5'
            }`}
          >
            Explore Tokens
          </button>
          <button
            onClick={() => handleNavClick('0')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
              phaseFilter === '0'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-[#8F96A3] hover:text-white hover:bg-white/5'
            }`}
          >
            Bonding Curves
          </button>
          <button
            onClick={() => handleNavClick('2')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
              phaseFilter === '2'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-[#8F96A3] hover:text-white hover:bg-white/5'
            }`}
          >
            Graduation (v4)
          </button>
        </nav>

        {/* Right: Launch Token Button + Wallet Controls */}
        <div className="flex items-center gap-2.5 justify-self-end">
          {/* Bonus: Launch Token Button */}
          <button
            onClick={() => setIsLaunchModalOpen(true)}
            className="btn-primary-glow px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-all flex-shrink-0"
            title="Launch your own custom token (Bonus Feature)"
          >
            <Rocket className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Launch Token</span>
            <span className="sm:hidden">Launch</span>
          </button>

          {/* Connect / User Account Button */}
          <WalletButton />
        </div>
      </div>

      {/* Bonus Feature: Launch Token Modal */}
      <LaunchTokenModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
      />
    </header>
  );
}
