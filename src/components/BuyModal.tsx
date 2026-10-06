'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi';
import { parseEther, formatEther, formatUnits, Address } from 'viem';
import { TokenData } from '@/types/token';
import { robinhoodTestnet } from '@/config/chain';
import { LAUNCHER_TOKEN_ABI } from '@/config/contracts';
import { calculateCurveBuyQuote } from '@/lib/math';
import { useBuyToken } from '@/hooks/useBuyToken';
import { StatusBadge } from './StatusBadge';
import { 
  X, 
  ArrowDown, 
  AlertCircle, 
  Sliders, 
  ArrowRight, 
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useTokens } from '@/context/TokenContext';

interface BuyModalProps {
  token: TokenData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessRefresh?: () => void;
}

export function BuyModal({ token, isOpen, onClose, onSuccessRefresh }: BuyModalProps) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({ address });
  const { handlePurchaseSuccess } = useTokens();

  // Read user's token balance
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

  // Buy hook with auto-refresh callback for Step 8
  const { state: txState, txHash, result: txResult, error: txError, executeBuy, resetState, isBusy } = useBuyToken(async () => {
    refetchEthBalance();
    refetchTokenBalance();
    if (token) {
      await handlePurchaseSuccess(token.token);
    }
    if (onSuccessRefresh) onSuccessRefresh();
  });

  const handleSelectSlippage = (pct: number) => {
    setSlippagePercent(pct);
    setSlippageBps(BigInt(Math.round(pct * 100)));
  };

  // Close on Escape key (if not busy with tx)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) {
        resetState();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isBusy, onClose, resetState]);

  // Calculations
  const calculation = useMemo(() => {
    if (!token) return null;

    let quoteIn = BigInt(0);
    let parseError = '';

    const cleanStr = amountStr.trim();
    if (cleanStr && cleanStr !== '.') {
      const parts = cleanStr.split('.');
      if (parts.length > 2) {
        parseError = 'Invalid numeric format';
      } else if (parts[1] && parts[1].length > 18) {
        parseError = 'Exceeds 18 decimals limit';
      } else {
        try {
          quoteIn = parseEther(cleanStr);
        } catch {
          parseError = 'Invalid numeric format';
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
    } = { disabled: false, text: `Buy $${token.symbol}`, action: 'buy' };

    if (!isConnected) {
      buttonState = { disabled: false, text: 'Connect Wallet to Buy', action: 'connect' };
    } else if (isWrongChain) {
      buttonState = { disabled: false, text: 'Switch to Robinhood Testnet', action: 'switch' };
    } else if (isPhaseInvalid) {
      buttonState = { disabled: true, text: 'Curve Not in Trading Phase' };
    } else if (parseError) {
      buttonState = { disabled: true, text: parseError };
    } else if (isZeroAmount) {
      buttonState = { disabled: true, text: 'Enter ETH Amount' };
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

  const handleModalClose = () => {
    if (!isBusy) {
      resetState();
      onClose();
    }
  };

  const handleConfirmBuy = async () => {
    if (!calculation || calculation.buttonState.disabled) return;
    await executeBuy({
      token,
      quoteIn: calculation.quoteIn,
      minTokensOut: calculation.quote.minTokensOut,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={handleModalClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Dialog Card */}
      <div 
        className="w-full max-w-lg terminal-card p-6 sm:p-7 relative border border-[#1E222B] bg-[#111318] shadow-2xl text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1E222B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#181B22] border border-[#242934] flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider">
              {token.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Buy ${token.symbol}</h3>
                <StatusBadge phase={token.phase} />
              </div>
              <p className="text-xs text-[#808593] font-mono">{token.name}</p>
            </div>
          </div>

          {!isBusy && (
            <button
              onClick={handleModalClose}
              className="p-1.5 rounded hover:bg-white/5 text-[#808593] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* STATE 2: PENDING MINING (Broadcasting on Robinhood)      */}
        {/* ======================================================== */}
        {txState === 'pending_tx' && txHash && (
          <div className="py-10 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-lg bg-[#C8F031]/10 border border-[#C8F031]/30 flex items-center justify-center mx-auto text-[#C8F031]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Broadcasting Transaction</h4>
              <p className="text-xs text-[#808593] mt-1 max-w-xs mx-auto font-mono">
                Awaiting block confirmation on Robinhood Chain (~2-4 seconds)...
              </p>
            </div>

            <div className="pt-2">
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181B22] border border-[#242934] text-xs font-mono text-[#808593] hover:text-white transition-all"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE 3: SUCCESS (Mined in Block)                        */}
        {/* ======================================================== */}
        {txState === 'success' && txResult && (
          <div className="py-6 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-lg bg-[#C8F031]/15 border border-[#C8F031]/40 flex items-center justify-center mx-auto text-[#C8F031]">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-[#C8F031] tracking-wider">
                Order Executed Successfully
              </span>
              <h4 className="text-2xl font-mono font-black text-white mt-1">
                +{parseFloat(formatEther(txResult.tokensReceived)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token.symbol}
              </h4>
              <p className="text-xs text-[#808593] mt-1 font-mono">
                Tokens credited to your wallet in block #{txResult.blockNumber.toString()}.
              </p>
            </div>

            {/* Receipt Box */}
            <div className="p-3.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B] text-left text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-[#808593]">
                <span>Transaction Hash:</span>
                <a
                  href={`${robinhoodTestnet.blockExplorers.default.url}/tx/${txResult.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#C8F031] hover:underline inline-flex items-center gap-1"
                >
                  <span>{`${txResult.txHash.slice(0, 10)}...${txResult.txHash.slice(-8)}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between text-[#808593]">
                <span>Status:</span>
                <span className="text-white font-bold">1 Confirmation</span>
              </div>
            </div>

            <button
              onClick={handleModalClose}
              className="w-full py-2.5 rounded btn-terminal-primary font-bold text-xs font-mono tracking-wider cursor-pointer uppercase"
            >
              Done & Return
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* FORM INPUT & STATES: IDLE, AWAITING, REJECTED, ERROR    */}
        {/* ======================================================== */}
        {txState !== 'pending_tx' && txState !== 'success' && (
          <>
            {/* User Token Holdings Banner */}
            <div className="py-2.5 px-3.5 my-3 rounded-lg bg-[#0A0B0E] border border-[#1E222B] flex items-center justify-between text-xs font-mono">
              <span className="text-[#808593]">Your ${token.symbol} Balance:</span>
              <span className="font-bold text-white">
                {userTokenBalanceFormatted} {token.symbol}
              </span>
            </div>

            {/* STATE 4: REJECTED ALERT */}
            {txState === 'rejected' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2 mb-3 font-mono animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{txError?.message || 'Transaction rejected by user in wallet.'}</span>
                </div>
                <button
                  onClick={resetState}
                  className="text-[11px] underline text-white hover:text-amber-200 cursor-pointer flex-shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* STATE 5: ERROR / REVERT ALERT */}
            {txState === 'error' && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start justify-between gap-2 mb-3 font-mono animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Execution Failed</span>
                    <span className="text-[11px] leading-relaxed text-rose-200">
                      {txError?.message || 'Transaction reverted on-chain.'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={resetState}
                  className="text-[11px] underline text-white hover:text-rose-200 cursor-pointer flex-shrink-0"
                >
                  Reset
                </button>
              </div>
            )}

            {/* ETH Input Container */}
            <div className="space-y-1.5 mb-3 font-mono">
              <div className="flex items-center justify-between text-xs text-[#808593]">
                <span>You Pay (ETH)</span>
                <div className="flex items-center gap-1.5">
                  <span>Balance:</span>
                  <span className="text-white font-bold">
                    {ethBalance ? `${parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)} ETH` : '0 ETH'}
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="0.0"
                  disabled={isBusy}
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value.replace(/,/g, '.'))}
                  className="w-full bg-[#0A0B0E] border border-[#1E222B] rounded-lg px-3.5 py-2.5 text-lg font-bold font-mono text-white placeholder-[#808593] focus:outline-none focus:border-[#C8F031]/60 disabled:opacity-50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-[#C8F031] bg-[#161B14] px-2 py-0.5 rounded border border-[#C8F031]/30">
                    ETH
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                {['0.001', '0.005', '0.01', '0.02'].map((preset) => (
                  <button
                    key={preset}
                    disabled={isBusy}
                    onClick={() => setAmountStr(preset)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all cursor-pointer disabled:opacity-50 ${
                      amountStr === preset
                        ? 'bg-[#C8F031]/15 text-[#C8F031] border border-[#C8F031]/40'
                        : 'bg-[#161820] text-[#808593] hover:text-white hover:bg-[#1E222C]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                {ethBalance && ethBalance.value > BigInt(0) && (
                  <button
                    disabled={isBusy}
                    title="Leaves 0.001 ETH for gas"
                    onClick={() => {
                      const safeMax = ethBalance.value > parseEther('0.001') 
                        ? ethBalance.value - parseEther('0.001') 
                        : ethBalance.value;
                      setAmountStr(formatEther(safeMax));
                    }}
                    className="px-2 py-1 rounded text-[11px] font-mono font-medium bg-[#161820] text-amber-300 hover:bg-[#1E222C] cursor-pointer ml-auto disabled:opacity-50"
                  >
                    Max (Safe)
                  </button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex justify-center -my-1 z-10 relative">
              <div className="w-6 h-6 rounded-full bg-[#181B22] border border-[#242934] flex items-center justify-center text-[#808593]">
                <ArrowDown className="w-3 h-3" />
              </div>
            </div>

            {/* Estimated Tokens Output */}
            <div className="p-3.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B] my-2 font-mono">
              <div className="flex items-center justify-between text-xs text-[#808593] mb-1">
                <span>Estimated Receive</span>
                <span className="text-[10px] text-[#C8F031]">Bonding Curve Quote</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-white tracking-tight">
                  {estimatedTokensFormatted}
                </span>
                <span className="text-xs font-bold text-[#C8F031]">
                  ${token.symbol}
                </span>
              </div>
            </div>

            {/* Slippage Selector */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0A0B0E] border border-[#1E222B] text-xs text-[#808593] font-mono mb-3">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-[#808593]" />
                <span>Slippage:</span>
              </div>

              <div className="flex items-center gap-1">
                {[0.5, 1, 2].map((pct) => (
                  <button
                    key={pct}
                    disabled={isBusy}
                    onClick={() => handleSelectSlippage(pct)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      slippagePercent === pct
                        ? 'bg-[#C8F031] text-[#0A0B0E]'
                        : 'bg-[#181B22] text-[#808593] hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Breakdown Accordion */}
            <div className="space-y-1 py-2.5 border-t border-[#1E222B] text-[11px] text-[#808593] font-mono">
              <div className="flex items-center justify-between">
                <span>Minimum Out:</span>
                <span className="text-white font-medium">{minTokensFormatted} ${token.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Protocol Fee ({Number(token.feeBps) / 100}%):</span>
                <span className="text-white">
                  {calculation ? formatEther(calculation.quote.fee) : '0'} ETH
                </span>
              </div>
              {token.creatorTaxBps > BigInt(0) && (
                <div className="flex items-center justify-between text-amber-300">
                  <span>Creator Tax ({Number(token.creatorTaxBps) / 100}%):</span>
                  <span>
                    {calculation ? formatEther(calculation.quote.creatorTax) : '0'} ETH
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Spot Price:</span>
                <span className="text-white">{token.spotPriceEth} ETH</span>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="mt-4">
              {txState === 'awaiting_wallet' ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded bg-[#1C202B] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-wait border border-[#2B313F]"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-[#C8F031]" />
                  <span>Confirm in Wallet...</span>
                </button>
              ) : calculation?.buttonState.action === 'switch' ? (
                <button
                  onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
                  className="w-full py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-[#0A0B0E] font-mono font-bold text-xs transition-all cursor-pointer"
                >
                  Switch to Robinhood Testnet
                </button>
              ) : (
                <button
                  onClick={handleConfirmBuy}
                  disabled={calculation?.buttonState.disabled || isBusy}
                  className="w-full py-2.5 rounded btn-terminal-primary font-mono font-bold text-xs tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 uppercase"
                >
                  <span>{calculation?.buttonState.text}</span>
                  {!calculation?.buttonState.disabled && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
