'use client';

import { useAccount, useSwitchChain } from 'wagmi';
import { robinhoodTestnet } from '@/config/chain';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function NetworkAlert() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected) return null;

  const isWrongNetwork = chainId !== robinhoodTestnet.id;

  if (!isWrongNetwork) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-y border-amber-500/30 px-4 py-3 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Wrong Network Detected
            </p>
            <p className="text-xs text-amber-300/80">
              Your wallet is connected to Chain ID {chainId}. Please switch to {robinhoodTestnet.name} (Chain ID: {robinhoodTestnet.id}) to trade.
            </p>
          </div>
        </div>

        <button
          onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-[#08090C] text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Switching Network...</span>
            </>
          ) : (
            <>
              <span>Switch to Robinhood Testnet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
