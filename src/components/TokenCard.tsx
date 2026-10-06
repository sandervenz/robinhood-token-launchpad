'use client';

import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { TokenData } from '@/types/token';
import { StatusBadge } from './StatusBadge';
import { robinhoodTestnet } from '@/config/chain';
import { LAUNCHER_TOKEN_ABI } from '@/config/contracts';
import { 
  ArrowUpRight, 
  Copy, 
  Check, 
  Lock, 
  TrendingUp,
  Zap,
} from 'lucide-react';
import { formatEther, Address } from 'viem';

interface TokenCardProps {
  token: TokenData;
  isHighlighted?: boolean;
  onSelectBuy?: (token: TokenData) => void;
}

export function TokenCard({ token, isHighlighted = false, onSelectBuy }: TokenCardProps) {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Read user token balance for real-time reactive feedback on the list
  const { data: userBalance } = useReadContract({
    address: token.token as Address,
    abi: LAUNCHER_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: robinhoodTestnet.id,
    query: {
      enabled: !!address,
    },
  });

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isBuyDisabled = token.phase !== 0;

  const hasHoldings = typeof userBalance === 'bigint' && userBalance > BigInt(0);
  const userBalanceFormatted = hasHoldings
    ? parseFloat(formatEther(userBalance)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '0';

  const progressPercent = token.graduationProgressPercent;
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));

  return (
    <div 
      className={`group terminal-card p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-200 ${
        isHighlighted 
          ? 'border-[#C8F031] ring-1 ring-[#C8F031]/40 shadow-lg shadow-[#C8F031]/10' 
          : 'hover:border-[#2E3442]'
      }`}
    >
      {/* Top Notification Badge if just purchased */}
      {isHighlighted && (
        <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C8F031]/20 text-[#C8F031] border border-[#C8F031]/40 animate-pulse z-10">
          <Zap className="w-3 h-3 text-[#C8F031]" />
          <span>UPDATED</span>
        </div>
      )}

      {/* Top Section */}
      <div>
        {/* Token Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Square Terminal Avatar */}
            <div className="w-11 h-11 rounded-lg bg-[#181B22] border border-[#242934] flex items-center justify-center flex-shrink-0 overflow-hidden text-white font-mono font-bold text-sm tracking-wider">
              {token.logo && token.logo.startsWith('http') && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={token.logo} 
                  alt={token.symbol} 
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>{token.symbol.slice(0, 3)}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-base tracking-tight truncate max-w-[150px]">
                  {token.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-[#C8F031] font-bold">
                  ${token.symbol}
                </span>
                <span className="text-white/20">•</span>
                <button
                  onClick={handleCopy}
                  className="font-mono text-[11px] text-[#808593] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy contract address"
                >
                  <span>{truncate(token.token)}</span>
                  {copied ? <Check className="w-3 h-3 text-[#C8F031]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <StatusBadge phase={token.phase} />
        </div>

        {/* User Holdings Ribbon */}
        {hasHoldings && (
          <div className="mb-3.5 px-3 py-1.5 rounded-md bg-[#161B14] border border-[#C8F031]/25 flex items-center justify-between text-[11px]">
            <span className="text-[#C8F031] font-mono font-semibold">Your Holdings:</span>
            <span className="font-mono font-bold text-white">
              {userBalanceFormatted} ${token.symbol}
            </span>
          </div>
        )}

        {/* Spot Price Display */}
        <div className="my-3 p-3.5 rounded-lg bg-[#0A0B0E] border border-[#1C2028]">
          <div className="flex items-center justify-between text-xs text-[#808593] mb-1 font-mono">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#808593]" />
              <span>Spot Price</span>
            </span>
            <span className="text-[10px]">ETH / Token</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">
            {token.phase === 2 ? (
              <span className="text-purple-300 text-base">Graduated to Uniswap v4</span>
            ) : (
              `${token.spotPriceEth} ETH`
            )}
          </div>
        </div>

        {/* Bonding Curve Graduation Metric */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#808593]">Graduation Progress</span>
            <span className="font-bold text-white">
              {progressPercent.toFixed(1)}%
            </span>
          </div>

          {/* Precision Ruler Progress Bar */}
          <div className="w-full bg-[#181B22] rounded h-1.5 overflow-hidden border border-[#202530]">
            <div 
              className={`h-full rounded transition-all duration-500 ${
                token.phase === 2
                  ? 'bg-purple-500'
                  : clampedProgress > 60
                  ? 'bg-[#C8F031]'
                  : 'bg-white'
              }`}
              style={{ width: `${clampedProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#808593] font-mono">
            <span>
              Raised: <strong className="text-white">{parseFloat(formatEther(token.realQuoteReserve)).toFixed(4)} ETH</strong>
            </span>
            <span>
              Target: <strong className="text-white">{parseFloat(formatEther(token.graduationThreshold)).toFixed(3)} ETH</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#1C2028] flex items-center justify-between gap-3">
        <a
          href={`${robinhoodTestnet.blockExplorers.default.url}/address/${token.curve}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#808593] hover:text-white transition-colors inline-flex items-center gap-1 font-mono"
        >
          <span>Curve</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>

        {isBuyDisabled ? (
          <button
            disabled
            className="px-4 py-1.5 rounded text-xs font-mono font-medium bg-[#16181F] text-[#636875] border border-[#20242E] cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3" />
            <span>{token.phase === 2 ? 'Graduated' : 'Curve Closed'}</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectBuy?.(token)}
            className="btn-terminal-primary px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Buy ${token.symbol}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
