'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi';
import { parseEther, formatEther, formatUnits, Address } from 'viem';
import { TokenData } from '@/types/token';
import { robinhoodTestnet } from '@/config/chain';
import { LAUNCHER_TOKEN_ABI } from '@/config/contracts';
import { calculateCurveBuyQuote } from '@/lib/math';
import { StatusBadge } from './StatusBadge';
import { 
  X, 
  ArrowDown, 
  AlertCircle, 
  Check, 
  Sliders, 
  Coins, 
  Wallet, 
  ArrowRight, 
  ShieldCheck, 
  Percent,
  Sparkles,
  Info
} from 'lucide-react';

interface BuyModalProps {
  token: TokenData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBuy?: (params: {
    token: TokenData;
    quoteIn: bigint;
    minTokensOut: bigint;
  }) => void;
}

export function BuyModal({ token, isOpen, onClose, onConfirmBuy }: BuyModalProps) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: ethBalance } = useBalance({ address });

  // Read user's balance of this specific launcher token
  const { data: userTokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: token?.token as Address,
    abi: LAUNCHER_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: robinhoodTestnet.id,
    query: {
      enabled: !!address && !!token?.token,
    },
  });

  const [amountStr, setAmountStr] = useState<string>('0.001');
  const [slippagePercent, setSlippagePercent] = useState<number>(1); // 1% default
  const [slippageBps, setSlippageBps] = useState<bigint>(BigInt(100)); // 100 bps

  // Update slippage bps when percent changes
  const handleSelectSlippage = (pct: number) => {
    setSlippagePercent(pct);
    setSlippageBps(BigInt(Math.round(pct * 100)));
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Validation & Quote Calculation
  const calculation = useMemo(() => {
    if (!token) return null;

    let quoteIn = BigInt(0);
    let parseError = '';

    // Validate decimals (max 18)
    const cleanStr = amountStr.trim();
    if (cleanStr && cleanStr !== '.') {
      const parts = cleanStr.split('.');
      if (parts.length > 2) {
        parseError = 'Invalid number format';
      } else if (parts[1] && parts[1].length > 18) {
        parseError = 'Maximum 18 decimals allowed';
      } else {
        try {
          quoteIn = parseEther(cleanStr);
        } catch {
          parseError = 'Invalid number format';
        }
      }
    }

    const quote = calculateCurveBuyQuote({
      quoteIn,
      quoteReserve: token.quoteReserve,
      tokenReserve: token.tokenReserve,
      feeBps: token.feeBps,
      creatorTaxBps: token.creatorTaxBps,
      slippageBps,
    });

    const isWrongChain = isConnected && chainId !== robinhoodTestnet.id;
    const userEth = ethBalance?.value ?? BigInt(0);
    const isInsufficientBalance = isConnected && quoteIn > userEth;
    const isZeroAmount = quoteIn <= BigInt(0);
    const isPhaseInvalid = token.phase !== 0;

    let buttonState: {
      disabled: boolean;
      text: string;
      action?: 'connect' | 'switch' | 'buy';
    } = { disabled: false, text: 'Confirm Purchase', action: 'buy' };

    if (!isConnected) {
      buttonState = { disabled: false, text: 'Connect Wallet to Buy', action: 'connect' };
    } else if (isWrongChain) {
      buttonState = { disabled: false, text: 'Switch to Robinhood Testnet', action: 'switch' };
    } else if (isPhaseInvalid) {
      buttonState = { disabled: true, text: 'Token Not in Trading Phase' };
    } else if (parseError) {
      buttonState = { disabled: true, text: parseError };
    } else if (isZeroAmount) {
      buttonState = { disabled: true, text: 'Enter an ETH Amount' };
    } else if (isInsufficientBalance) {
      buttonState = { disabled: true, text: 'Insufficient ETH Balance' };
    }

    return {
      quoteIn,
      parseError,
      quote,
      buttonState,
      userEth,
    };
  }, [token, amountStr, slippageBps, isConnected, chainId, ethBalance]);

  if (!isOpen || !token) return null;

  const userTokenBalanceFormatted = typeof userTokenBalance === 'bigint' 
    ? parseFloat(formatEther(userTokenBalance)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '0';

  const estimatedTokensFormatted = calculation?.quote.tokensOut
    ? parseFloat(formatEther(calculation.quote.tokensOut)).toLocaleString(undefined, { maximumFractionDigits: 4 })
    : '0';

  const minTokensFormatted = calculation?.quote.minTokensOut
    ? parseFloat(formatEther(calculation.quote.minTokensOut)).toLocaleString(undefined, { maximumFractionDigits: 4 })
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Modal Dialog Card */}
      <div 
        className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 relative border border-white/15 shadow-2xl shadow-blue-500/10 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/10 border border-blue-400/20 flex items-center justify-center text-white font-extrabold text-base">
              {token.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Buy ${token.symbol}</h3>
                <StatusBadge phase={token.phase} />
              </div>
              <p className="text-xs text-[#8F96A3]">{token.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[#8F96A3] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance Info Bar */}
        <div className="py-3 px-4 my-4 rounded-xl bg-[#08090C]/80 border border-white/5 flex items-center justify-between text-xs">
          <span className="text-[#8F96A3]">Your ${token.symbol} Balance:</span>
          <span className="font-bold text-white font-mono">
            {userTokenBalanceFormatted} {token.symbol}
          </span>
        </div>

        {/* ETH Input Container */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-[#8F96A3]">
            <span>You Pay (ETH)</span>
            <div className="flex items-center gap-2">
              <span>Balance:</span>
              <span className="font-mono text-white font-semibold">
                {ethBalance ? `${parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)} ETH` : '0 ETH'}
              </span>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="0.0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/,/g, '.'))}
              className="w-full bg-[#08090C] border border-white/10 rounded-2xl px-4 py-3.5 text-xl font-bold font-mono text-white placeholder-[#8F96A3] focus:outline-none focus:border-blue-500/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                ETH
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {['0.001', '0.005', '0.01', '0.02'].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmountStr(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  amountStr === preset
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-white/5 text-[#8F96A3] hover:text-white hover:bg-white/10'
                }`}
              >
                {preset} ETH
              </button>
            ))}
            {ethBalance && ethBalance.value > BigInt(0) && (
              <button
                onClick={() => {
                  // Leave a little for gas (~0.002 ETH)
                  const safeMax = ethBalance.value > parseEther('0.002') 
                    ? ethBalance.value - parseEther('0.002') 
                    : ethBalance.value;
                  setAmountStr(formatEther(safeMax));
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white/5 text-amber-300 hover:bg-white/10 cursor-pointer ml-auto"
              >
                Max Safe
              </button>
            )}
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center -my-1 z-10 relative">
          <div className="w-8 h-8 rounded-full bg-[#0D0F16] border border-white/10 flex items-center justify-center text-blue-400">
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>

        {/* Estimated Tokens Output Card */}
        <div className="p-4 rounded-2xl bg-[#08090C]/80 border border-white/5 my-3">
          <div className="flex items-center justify-between text-xs text-[#8F96A3] mb-1">
            <span>You Receive (Estimated)</span>
            <span className="text-[11px] text-emerald-400 font-semibold">Bonding Curve Quote</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-white">
              {estimatedTokensFormatted}
            </span>
            <span className="font-mono text-sm font-bold text-blue-400">
              ${token.symbol}
            </span>
          </div>
        </div>

        {/* Slippage Selector */}
        <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/5 text-xs text-[#8F96A3] mb-4">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Slippage Tolerance:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0.5, 1, 2].map((pct) => (
              <button
                key={pct}
                onClick={() => handleSelectSlippage(pct)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                  slippagePercent === pct
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-[#8F96A3] hover:text-white'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Breakdown Accordion/Details */}
        <div className="space-y-1.5 py-3 border-t border-white/5 text-[11px] text-[#8F96A3] font-mono">
          <div className="flex items-center justify-between">
            <span>Minimum Received (Guaranteed):</span>
            <span className="text-white font-semibold">{minTokensFormatted} ${token.symbol}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Protocol Curve Fee ({Number(token.feeBps) / 100}%):</span>
            <span className="text-white">
              {calculation ? formatEther(calculation.quote.fee) : '0'} ETH
            </span>
          </div>
          {token.creatorTaxBps > BigInt(0) && (
            <div className="flex items-center justify-between text-amber-300/90">
              <span>Creator Tax ({Number(token.creatorTaxBps) / 100}%):</span>
              <span>
                {calculation ? formatEther(calculation.quote.creatorTax) : '0'} ETH
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Curve Rate:</span>
            <span className="text-white">{token.spotPriceEth} ETH</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-5">
          {calculation?.buttonState.action === 'switch' ? (
            <button
              onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
              className="w-full py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-[#08090C] font-bold text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Switch to Robinhood Chain Testnet
            </button>
          ) : (
            <button
              onClick={() => {
                if (calculation && onConfirmBuy) {
                  onConfirmBuy({
                    token,
                    quoteIn: calculation.quoteIn,
                    minTokensOut: calculation.quote.minTokensOut,
                  });
                }
              }}
              disabled={calculation?.buttonState.disabled}
              className="w-full py-3.5 rounded-full btn-primary-glow font-bold text-sm tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{calculation?.buttonState.text}</span>
              {!calculation?.buttonState.disabled && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
