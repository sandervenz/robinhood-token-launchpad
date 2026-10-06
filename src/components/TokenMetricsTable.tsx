'use client';

import { useTokenData } from '@/hooks/useTokenData';
import { robinhoodTestnet } from '@/config/chain';
import { TokenPhase } from '@/types/token';
import { 
  BarChart3, 
  RefreshCw, 
  ExternalLink, 
  Coins, 
  CheckCircle2, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { formatEther } from 'viem';

export function TokenMetricsTable() {
  const { tokens, isLoading, isRefreshing, isError, error, refetch } = useTokenData();

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  const getPhaseBadge = (phase: TokenPhase) => {
    switch (phase) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Phase 0: Active Curve
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Phase 1: Threshold Reached
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Phase 2: Graduated (v4)
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Phase 3: Cancelled
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl glass-card rounded-2xl p-6 sm:p-8 text-left mb-10 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Aggregated Token Metrics (Multicall3)</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Step 4 Complete
              </span>
            </div>
            <p className="text-xs text-[#8F96A3]">
              Fetched via Multicall3 contract (`0xcA11...CA11`) — reserves, prices, thresholds & phase in 1 RPC batch
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[11px] text-[#8F96A3]">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>7 batch calls / token</span>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefreshing}
            className="glass-pill px-3.5 py-1.5 text-xs text-[#8F96A3] hover:text-white hover:border-white/20 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-12 space-y-4">
          <div className="flex items-center justify-center gap-3 text-sm text-purple-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Executing Multicall3 aggregate3 across all tokens...</span>
          </div>
          <div className="w-full h-24 bg-white/5 rounded-xl animate-pulse" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="my-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Failed to read metrics: {error?.message}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-rose-500 text-white rounded-lg hover:bg-rose-400 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table view */}
      {!isLoading && tokens.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[#8F96A3] font-medium">
                <th className="py-3 px-3">Token Asset</th>
                <th className="py-3 px-3">Spot Price</th>
                <th className="py-3 px-3">ETH Raised / Target</th>
                <th className="py-3 px-3">Graduation Progress</th>
                <th className="py-3 px-3">Phase Status</th>
                <th className="py-3 px-3 text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tokens.map((t) => (
                <tr key={t.token} className="hover:bg-white/[0.02] transition-colors">
                  {/* Token Asset (Logo + Name + Symbol) */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      {/* Logo or placeholder */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1b2333] to-[#0e121a] border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {t.logo && t.logo.startsWith('http') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={t.logo} 
                            alt={t.symbol} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback on image error
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Coins className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{t.name}</span>
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/10 text-blue-300 font-semibold">
                            ${t.symbol}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[#8F96A3] block mt-0.5">
                          {truncate(t.token)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Spot Price */}
                  <td className="py-3.5 px-3">
                    <div className="font-mono font-bold text-white text-sm">
                      {t.phase === 2 ? (
                        <span className="text-purple-300">Graduated</span>
                      ) : (
                        `${t.spotPriceEth} ETH`
                      )}
                    </div>
                    <span className="text-[10px] text-[#8F96A3] block">
                      Spot quote
                    </span>
                  </td>

                  {/* ETH Raised vs Target */}
                  <td className="py-3.5 px-3 font-mono">
                    <span className="text-white font-medium">
                      {parseFloat(formatEther(t.realQuoteReserve)).toFixed(4)} ETH
                    </span>
                    <span className="text-[#8F96A3] block text-[10px]">
                      Target: {parseFloat(formatEther(t.graduationThreshold)).toFixed(3)} ETH
                    </span>
                  </td>

                  {/* Graduation Progress Bar */}
                  <td className="py-3.5 px-3 min-w-[150px]">
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-white font-semibold">
                        {t.graduationProgressPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          t.phase === 2
                            ? 'bg-purple-500'
                            : t.graduationProgressPercent > 50
                            ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, t.graduationProgressPercent)}%` }}
                      />
                    </div>
                  </td>

                  {/* Phase Status */}
                  <td className="py-3.5 px-3">
                    {getPhaseBadge(t.phase)}
                  </td>

                  {/* Explorer Link */}
                  <td className="py-3.5 px-3 text-right">
                    <a
                      href={`${robinhoodTestnet.blockExplorers.default.url}/address/${t.curve}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                      title="View Bonding Curve Contract"
                    >
                      <span className="text-[11px]">Curve</span>
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
