'use client';

import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { TokenData } from '@/types/token';
import { StatusBadge } from './StatusBadge';
import { robinhoodTestnet } from '@/config/chain';
import { LAUNCHER_TOKEN_ABI } from '@/config/contracts';
import { 
  ArrowUpRight, 
  ExternalLink, 
  Copy, 
  Check, 
  Lock, 
  TrendingUp,
  Coins,
  Zap,
  Sparkles
} from 'lucide-react';
import { formatEther, Address } from 'viem';

interface TokenCardProps {
  token: TokenData;
  isHighlighted?: boolean;
  onSelectBuy?: (token: TokenData) => void;
}

// Generate deterministic background color based on address
function getAvatarGradient(address: string) {
  const hash = address.slice(2, 8);
  const color1 = `#${hash.slice(0, 6)}`;
  return `linear-gradient(135deg, ${color1}40 0%, #0d111a 100%)`;
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

  return (
    <div 
      className={`group glass-card rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between relative overflow-hidden ${
        isHighlighted 
          ? 'border-emerald-400 shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-400/50' 
          : 'hover:border-blue-500/30'
      }`}
    >
      {/* Background radial glow */}
      <div 
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isHighlighted ? 'bg-emerald-500/25' : 'bg-blue-500/10 group-hover:bg-blue-500/15'
        }`} 
      />

      {/* Top Notification Badge if just purchased */}
      {isHighlighted && (
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 animate-pulse z-10">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>Metrics Updated!</span>
        </div>
      )}

      {/* Top Row: Avatar + Ticker & Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar / Logo */}
            <div 
              className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg transition-transform group-hover:scale-105"
              style={{ background: getAvatarGradient(token.token) }}
            >
              {token.logo && token.logo.startsWith('http') && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={token.logo} 
                  alt={token.symbol} 
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-extrabold text-base text-white tracking-wider">
                  {token.symbol.slice(0, 3)}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-base tracking-tight truncate max-w-[130px] sm:max-w-[160px]">
                  {token.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-blue-400 font-semibold">
                  ${token.symbol}
                </span>
                <span className="text-white/20">•</span>
                <button
                  onClick={handleCopy}
                  className="font-mono text-[11px] text-[#8F96A3] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy token address"
                >
                  <span>{truncate(token.token)}</span>
                  {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              </div>
            </div>
          </div>

          <StatusBadge phase={token.phase} />
        </div>

        {/* User holdings pill if owned */}
        {hasHoldings && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px]">
            <span className="text-emerald-300 font-medium">Your Holdings:</span>
            <span className="font-mono font-bold text-white">
              {userBalanceFormatted} ${token.symbol}
            </span>
          </div>
        )}

        {/* Spot Price Display */}
        <div className="my-3 p-3.5 rounded-xl bg-[#08090C]/80 border border-white/5">
          <div className="flex items-center justify-between text-xs text-[#8F96A3] mb-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              <span>Current Spot Price</span>
            </span>
            <span className="text-[10px]">ETH / Token</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-white tracking-tight">
            {token.phase === 2 ? (
              <span className="text-purple-300 text-lg">Graduated to Uniswap</span>
            ) : (
              `${token.spotPriceEth} ETH`
            )}
          </div>
        </div>

        {/* Graduation Progress Section */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#8F96A3]">Graduation Progress</span>
            <span className="font-bold text-white">
              {token.graduationProgressPercent.toFixed(1)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/5 rounded-full h-2 p-0.5 border border-white/5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                token.phase === 2
                  ? 'bg-purple-500'
                  : token.graduationProgressPercent > 50
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 shadow-sm shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm shadow-blue-500/30'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, token.graduationProgressPercent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8F96A3] font-mono">
            <span>
              Raised: <strong className="text-white">{parseFloat(formatEther(token.realQuoteReserve)).toFixed(4)} ETH</strong>
            </span>
            <span>
              Target: <strong className="text-white">{parseFloat(formatEther(token.graduationThreshold)).toFixed(3)} ETH</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA & Curve Link */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
        <a
          href={`${robinhoodTestnet.blockExplorers.default.url}/address/${token.curve}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#8F96A3] hover:text-white transition-colors inline-flex items-center gap-1 font-mono"
        >
          <span>Curve Contract</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>

        {isBuyDisabled ? (
          <button
            disabled
            className="px-4 py-2 rounded-full text-xs font-semibold bg-white/5 text-[#8F96A3] border border-white/5 cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3" />
            <span>{token.phase === 2 ? 'Graduated' : 'Curve Inactive'}</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectBuy?.(token)}
            className="btn-primary-glow px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Buy Token</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
