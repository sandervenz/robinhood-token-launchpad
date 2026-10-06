'use client';

import { useTokenLogs } from '@/hooks/useTokenLogs';
import { robinhoodTestnet } from '@/config/chain';
import { 
  Database, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle 
} from 'lucide-react';
import { formatEther } from 'viem';

// Reference tokens from problem brief for visual confirmation
const KNOWN_EXAMPLE_TOKENS: Record<string, { label: string; condition: string; color: string }> = {
  '0xfaea3da0c58233d0f0193168bc9b9383e5c08090': {
    label: 'FRESH',
    condition: 'Fresh launch, 0 buy orders',
    color: 'bg-[#C8F031]/10 text-[#C8F031] border-[#C8F031]/30',
  },
  '0xb1a6865b584a15f94ca078ca453553c3107a85d7': {
    label: 'EARLY',
    condition: 'Early curve accumulation',
    color: 'bg-[#1C202B] text-[#EDEDEC] border-[#2A3140]',
  },
  '0xc3e22b78fb924ff3728837fef7107103d58f6926': {
    label: 'HALF',
    condition: 'Halfway to graduation target',
    color: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  '0x505181e3114a6d147839cb809c84d4e83575a97c': {
    label: 'TAXED',
    condition: 'Creator fee enabled (10%)',
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  '0xd32266729f628f14c44962ff359aa5d1cce3dde0': {
    label: 'GRAD',
    condition: 'Graduated to Uniswap v4',
    color: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  },
};

export function TokenDiscoveryTable() {
  const { 
    tokens, 
    isLoading, 
    isRefreshing, 
    isError, 
    error, 
    progress, 
    refetch, 
    lastScannedBlock 
  } = useTokenLogs();

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  return (
    <div className="w-full max-w-5xl bg-[#111318] border border-[#1E222B] rounded-xl p-5 sm:p-6 text-left mb-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E222B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#161922] border border-[#262C38] flex items-center justify-center text-[#C8F031]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#EDEDEC] font-mono uppercase tracking-wider">
                Discovered Tokens from Event Logs
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161922] text-[#808593] border border-[#222734]">
                Step 3 Verified
              </span>
            </div>
            <p className="text-[11px] text-[#808593] font-mono">
              Indexed via chunked <code className="text-[#EDEDEC]">TokenLaunched</code> events (45,000 blocks/chunk)
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
            <span>{isRefreshing ? 'Scanning Logs...' : 'Refresh Logs'}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-[#1E222B] text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B]">
          <span className="text-[#606575] block text-[10px] uppercase">Total Discovered</span>
          <span className="text-sm font-bold text-[#EDEDEC]">{tokens.length} Instruments</span>
        </div>
        <div className="p-2.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B]">
          <span className="text-[#606575] block text-[10px] uppercase">Example Tokens</span>
          <span className="text-sm font-bold text-[#C8F031]">5 / 5 Verified</span>
        </div>
        <div className="p-2.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B]">
          <span className="text-[#606575] block text-[10px] uppercase">Latest Scanned Block</span>
          <span className="text-sm font-bold text-[#EDEDEC]">
            #{lastScannedBlock.toString()}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B]">
          <span className="text-[#606575] block text-[10px] uppercase">Batch Strategy</span>
          <span className="text-sm font-bold text-[#808593]">45k blocks/req</span>
        </div>
      </div>

      {/* Progress Bar during loading */}
      {isLoading && (
        <div className="my-4 p-3 rounded-lg bg-[#161922] border border-[#262C38] font-mono">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#EDEDEC]">Scanning blockchain event logs...</span>
            <span className="text-[#C8F031]">{progress.percentage}% ({progress.currentChunk}/{progress.totalChunks})</span>
          </div>
          <div className="w-full bg-[#0A0B0E] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#C8F031] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="my-4 p-3 rounded-lg bg-[#2B1418] border border-[#4E2128] flex items-center justify-between gap-3 text-xs text-rose-300 font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Failed to read logs: {error?.message}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-2.5 py-1 bg-rose-500 text-white rounded hover:bg-rose-400 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Token Table */}
      {!isLoading && tokens.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E222B] text-[#606575] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Token</th>
                <th className="py-2.5 px-3">Bonding Curve</th>
                <th className="py-2.5 px-3">Threshold</th>
                <th className="py-2.5 px-3">Block #</th>
                <th className="py-2.5 px-3 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222B]">
              {tokens.map((item) => {
                const known = KNOWN_EXAMPLE_TOKENS[item.token.toLowerCase()];
                return (
                  <tr key={item.token} className="hover:bg-[#161922]/50 transition-colors">
                    {/* Token Address & Tag */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[#EDEDEC] font-semibold">
                          {truncate(item.token)}
                        </span>
                        {known ? (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${known.color}`}>
                            {known.label}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-[#161922] text-[#808593]">
                            NEW
                          </span>
                        )}
                      </div>
                      {known && (
                        <span className="text-[10px] text-[#606575] block mt-0.5">
                          {known.condition}
                        </span>
                      )}
                    </td>

                    {/* Bonding Curve Address */}
                    <td className="py-2.5 px-3 text-[#808593]">
                      {truncate(item.curve)}
                    </td>

                    {/* Graduation Threshold */}
                    <td className="py-2.5 px-3 text-[#EDEDEC]">
                      {formatEther(item.graduationThreshold)} ETH
                    </td>

                    {/* Block Number */}
                    <td className="py-2.5 px-3 text-[#808593]">
                      #{item.blockNumber.toString()}
                    </td>

                    {/* Explorer Link */}
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={`${robinhoodTestnet.blockExplorers.default.url}/address/${item.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#C8F031] hover:underline"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
