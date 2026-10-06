'use client';

import { useState } from 'react';
import { useLaunchFee } from '@/hooks/useLaunchFee';
import { useTokens } from '@/context/TokenContext';
import { Terminal, Plus } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { LaunchTokenModal } from './LaunchTokenModal';

export function Navbar() {
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
    <header className="sticky top-0 z-40 w-full border-b border-[#1E222B] bg-[#0A0B0E]/90 backdrop-blur-md px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#161922] border border-[#262C38] flex items-center justify-center text-[#C8F031] font-mono text-sm font-bold shadow-sm">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tracking-wider text-[#EDEDEC]">
                COINTINENTAL
              </span>
              <span className="hidden sm:inline text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#161922] text-[#808593] border border-[#222734]">
                AMM TERMINAL
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#808593]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8F031] animate-pulse" />
              <span>CHAIN 46630 • ROBINHOOD</span>
            </div>
          </div>
        </div>

        {/* Center: Phase Segment Navigation (Desktop) */}
        <nav className="hidden md:flex items-center p-1 rounded-lg bg-[#111318] border border-[#1E222B] text-xs font-mono">
          <button
            onClick={() => handleNavClick('all')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              phaseFilter === 'all'
                ? 'bg-[#1C202B] text-[#EDEDEC] font-bold shadow-sm'
                : 'text-[#808593] hover:text-[#EDEDEC]'
            }`}
          >
            All Instruments
          </button>
          <button
            onClick={() => handleNavClick('0')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              phaseFilter === '0'
                ? 'bg-[#1C202B] text-[#C8F031] font-bold shadow-sm'
                : 'text-[#808593] hover:text-[#EDEDEC]'
            }`}
          >
            Bonding Curves
          </button>
          <button
            onClick={() => handleNavClick('2')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              phaseFilter === '2'
                ? 'bg-[#1C202B] text-purple-400 font-bold shadow-sm'
                : 'text-[#808593] hover:text-[#EDEDEC]'
            }`}
          >
            Graduated (v4)
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsLaunchModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#161922] hover:bg-[#1C202B] border border-[#262C38] hover:border-[#C8F031]/40 text-[#EDEDEC] hover:text-[#C8F031] font-mono text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            title="Launch a custom token bonding curve"
          >
            <Plus className="w-3.5 h-3.5 text-[#C8F031]" />
            <span className="hidden sm:inline">Launch Token</span>
            <span className="sm:hidden">Launch</span>
          </button>

          <WalletButton />
        </div>
      </div>

      {/* Launch Token Modal */}
      <LaunchTokenModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
      />
    </header>
  );
}
