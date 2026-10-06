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
    <div className="w-full bg-[#201013] border-b border-[#4E2128] px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#EDEDEC]">
              WRONG NETWORK DETECTED (CHAIN ID: {chainId})
            </p>
            <p className="text-[11px] text-rose-300/80">
              Please switch to {robinhoodTestnet.name} (Chain ID: {robinhoodTestnet.id}) to execute trades.
            </p>
          </div>
        </div>

        <button
          onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Switching...</span>
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
