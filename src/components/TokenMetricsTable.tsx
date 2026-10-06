'use client';

import { useTokens } from '@/context/TokenContext';
import { robinhoodTestnet } from '@/config/chain';
import { TokenPhase } from '@/types/token';
import { 
  BarChart3, 
  RefreshCw, 
  ExternalLink, 
  Coins, 
  AlertCircle 
} from 'lucide-react';
import { formatEther } from 'viem';

export function TokenMetricsTable() {
  const { tokens, isLoading, isRefreshing, isError, error, refetchTokens: refetch } = useTokens();

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  const getPhaseBadge = (phase: TokenPhase) => {
    switch (phase) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C8F031]/10 text-[#C8F031] border border-[#C8F031]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8F031] animate-pulse" />
            PHASE 0: TRADING
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            PHASE 1: THRESHOLD MET
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            PHASE 2: GRADUATED (V4)
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            PHASE 3: CANCELLED
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl bg-[#111318] border border-[#1E222B] rounded-xl p-5 sm:p-6 text-left mb-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E222B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#161922] border border-[#262C38] flex items-center justify-center text-[#C8F031]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#EDEDEC] font-mono uppercase tracking-wider">
                Aggregated Token Metrics (Multicall3)
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161922] text-[#808593] border border-[#222734]">
                Step 4 Complete
              </span>
            </div>
            <p className="text-[11px] text-[#808593] font-mono">
              Executed via Multicall3 (<code className="text-[#EDEDEC]">0xcA11...CA11</code>) — 7 on-chain calls batched per token
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-[#161922] hover:bg-[#1C202B] border border-[#262C38] text-xs font-mono text-[#808593] hover:text-[#EDEDEC] transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing || isLoading ? 'animate-spin text-[#C8F031]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-8 space-y-3 font-mono">
          <div className="flex items-center justify-center gap-2 text-xs text-[#C8F031]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Executing Multicall3 aggregate3 RPC call across token contracts...</span>
          </div>
          <div className="w-full h-20 bg-[#161922] rounded-lg animate-pulse" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="my-4 p-3 rounded-lg bg-[#2B1418] border border-[#4E2128] flex items-center justify-between gap-3 text-xs text-rose-300 font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Failed to read metrics: {error?.message}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-2.5 py-1 bg-rose-500 text-white rounded hover:bg-rose-400 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table view */}
      {!isLoading && tokens.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E222B] text-[#606575] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Token Asset</th>
                <th className="py-2.5 px-3">Spot Price</th>
                <th className="py-2.5 px-3">ETH Raised / Target</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Phase Status</th>
                <th className="py-2.5 px-3 text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222B]">
              {tokens.map((t) => (
                <tr key={t.token} className="hover:bg-[#161922]/50 transition-colors">
                  {/* Token Asset (Logo + Name + Symbol) */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] rounded-md bg-[#161922] border border-[#262C38] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {t.logo && t.logo.startsWith('http') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={t.logo} 
                            alt={t.symbol} 
                            className="w-7 h-7 max-w-[28px] max-h-[28px] object-cover flex-shrink-0"
                            onError={(e) => {
                              // Fallback on image error
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Coins className="w-3.5 h-3.5 text-[#808593]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#EDEDEC] text-xs">{t.name}</span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-[#161922] text-[#808593]">
                            ${t.symbol}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#606575] block">
                          {truncate(t.token)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Spot Price */}
                  <td className="py-2.5 px-3 font-semibold text-[#EDEDEC]">
                    {t.phase === 2 ? (
                      <span className="text-purple-300">Graduated</span>
                    ) : (
                      `${t.spotPriceEth} ETH`
                    )}
                  </td>

                  {/* ETH Raised vs Target */}
                  <td className="py-2.5 px-3">
                    <span className="text-[#EDEDEC] font-semibold">
                      {parseFloat(formatEther(t.realQuoteReserve)).toFixed(4)} ETH
                    </span>
                    <span className="text-[#606575] block text-[10px]">
                      / {parseFloat(formatEther(t.graduationThreshold)).toFixed(3)} ETH
                    </span>
                  </td>

                  {/* Graduation Progress Bar */}
                  <td className="py-2.5 px-3 min-w-[130px]">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-[#EDEDEC] font-semibold">
                        {t.graduationProgressPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#0A0B0E] rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          t.phase === 2
                            ? 'bg-purple-500'
                            : 'bg-[#C8F031]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, t.graduationProgressPercent))}%` }}
                      />
                    </div>
                  </td>

                  {/* Phase Status */}
                  <td className="py-2.5 px-3">
                    {getPhaseBadge(t.phase)}
                  </td>

                  {/* Explorer Link */}
                  <td className="py-2.5 px-3 text-right">
                    <a
                      href={`${robinhoodTestnet.blockExplorers.default.url}/address/${t.curve}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#C8F031] hover:underline"
                      title="View Curve Contract"
                    >
                      <span>Curve</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
