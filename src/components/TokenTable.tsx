'use client';

import { useState } from 'react';
import { TokenData } from '@/types/token';
import { StatusBadge } from './StatusBadge';
import { robinhoodTestnet } from '@/config/chain';
import { ArrowUpRight, Copy, Check, Lock } from 'lucide-react';
import { formatEther } from 'viem';

interface TokenTableProps {
  tokens: TokenData[];
  onSelectBuy?: (token: TokenData) => void;
  lastPurchasedAddress?: string | null;
}

export function TokenTable({ tokens, onSelectBuy, lastPurchasedAddress }: TokenTableProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#1E222B] bg-[#111318]">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-[#1E222B] bg-[#0E1015] text-[#808593] font-mono uppercase text-[11px]">
            <th className="py-3 px-4">#</th>
            <th className="py-3 px-4">Token</th>
            <th className="py-3 px-4">Current Spot Price</th>
            <th className="py-3 px-4">Graduation Progress</th>
            <th className="py-3 px-4">Raised / Target</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Trade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1D24] font-mono">
          {tokens.map((token, index) => {
            const isHighlighted = lastPurchasedAddress === token.token.toLowerCase();
            const progress = Math.min(100, Math.max(0, token.graduationProgressPercent));
            const isBuyDisabled = token.phase !== 0;

            return (
              <tr 
                key={token.token} 
                className={`hover:bg-[#151821] transition-colors ${
                  isHighlighted ? 'bg-[#C8F031]/5 border-l-2 border-l-[#C8F031]' : ''
                }`}
              >
                {/* Index */}
                <td className="py-3.5 px-4 text-[#808593]">{index + 1}</td>

                {/* Token Identity */}
                <td className="py-3.5 px-4 font-sans">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1C202A] border border-[#262B38] flex items-center justify-center font-mono font-bold text-xs text-white flex-shrink-0">
                      {token.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{token.name}</span>
                        <span className="text-[#C8F031] font-mono text-[11px] font-semibold">${token.symbol}</span>
                      </div>
                      <button
                        onClick={(e) => handleCopy(token.token, e)}
                        className="font-mono text-[10px] text-[#808593] hover:text-white inline-flex items-center gap-1 cursor-pointer"
                        title="Copy address"
                      >
                        <span>{truncate(token.token)}</span>
                        {copiedAddress === token.token ? (
                          <Check className="w-2.5 h-2.5 text-[#C8F031]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </td>

                {/* Spot Price */}
                <td className="py-3.5 px-4 font-bold text-white text-sm">
                  {token.phase === 2 ? (
                    <span className="text-purple-300 text-xs">Graduated</span>
                  ) : (
                    `${token.spotPriceEth} ETH`
                  )}
                </td>

                {/* Progress */}
                <td className="py-3.5 px-4">
                  <div className="w-32">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-white font-bold">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#1A1D25] h-1.5 rounded overflow-hidden">
                      <div 
                        className={`h-full rounded transition-all ${
                          token.phase === 2 ? 'bg-purple-500' : progress > 50 ? 'bg-[#C8F031]' : 'bg-white'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Raised / Target */}
                <td className="py-3.5 px-4 text-[#808593] text-[11px]">
                  <span className="text-white font-medium">{parseFloat(formatEther(token.realQuoteReserve)).toFixed(4)}</span> / {parseFloat(formatEther(token.graduationThreshold)).toFixed(3)} ETH
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <StatusBadge phase={token.phase} />
                </td>

                {/* Action CTA */}
                <td className="py-3.5 px-4 text-right">
                  {isBuyDisabled ? (
                    <span className="text-[#636875] text-[11px] inline-flex items-center gap-1 font-sans">
                      <Lock className="w-3 h-3" />
                      <span>Closed</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectBuy?.(token)}
                      className="btn-terminal-primary px-3 py-1 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Buy</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
