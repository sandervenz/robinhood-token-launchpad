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
  Check, 
  Sliders, 
  Coins, 
  Wallet, 
  ArrowRight, 
  ShieldCheck, 
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
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
        parseError = 'Format angka tidak valid';
      } else if (parts[1] && parts[1].length > 18) {
        parseError = 'Maksimal 18 desimal';
      } else {
        try {
          quoteIn = parseEther(cleanStr);
        } catch {
          parseError = 'Format angka tidak valid';
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
    } = { disabled: false, text: 'Beli Token Sekarang', action: 'buy' };

    if (!isConnected) {
      buttonState = { disabled: false, text: 'Connect Wallet untuk Beli', action: 'connect' };
    } else if (isWrongChain) {
      buttonState = { disabled: false, text: 'Pindah ke Robinhood Testnet', action: 'switch' };
    } else if (isPhaseInvalid) {
      buttonState = { disabled: true, text: 'Token Tidak di Phase 0 (Trading)' };
    } else if (parseError) {
      buttonState = { disabled: true, text: parseError };
    } else if (isZeroAmount) {
      buttonState = { disabled: true, text: 'Masukkan Jumlah ETH' };
    } else if (isInsufficientBalance) {
      buttonState = { disabled: true, text: 'Saldo ETH Tidak Cukup' };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Modal Dialog Card */}
      <div 
        className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 relative border border-white/15 shadow-2xl shadow-blue-500/10 text-left overflow-hidden"
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
                <h3 className="text-lg font-bold text-white tracking-tight">Beli ${token.symbol}</h3>
                <StatusBadge phase={token.phase} />
              </div>
              <p className="text-xs text-[#8F96A3]">{token.name}</p>
            </div>
          </div>

          {!isBusy && (
            <button
              onClick={handleModalClose}
              className="p-2 rounded-full hover:bg-white/10 text-[#8F96A3] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* STATE 2: PENDING MINING (Terkirim, Menunggu Masuk Blok)  */}
        {/* ======================================================== */}
        {txState === 'pending_tx' && txHash && (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Transaksi Terkirim</h4>
              <p className="text-xs text-[#8F96A3] mt-1 max-w-xs mx-auto">
                Menunggu konfirmasi blok di Robinhood Testnet...
              </p>
            </div>

            <div className="pt-2">
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono hover:bg-blue-500/20 transition-all"
              >
                <span>Lihat di Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE 3: SUCCESS (Berhasil Masuk Blok)                   */}
        {/* ======================================================== */}
        {txState === 'success' && txResult && (
          <div className="py-8 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                Pembelian Berhasil
              </span>
              <h4 className="text-2xl font-black text-white mt-1">
                +{parseFloat(formatEther(txResult.tokensReceived)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token.symbol}
              </h4>
              <p className="text-xs text-[#8F96A3] mt-1">
                Token telah ditransfer ke wallet Anda (tercatat di block #{txResult.blockNumber.toString()}).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#08090C] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-[#8F96A3]">Transaction Hash:</span>
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/tx/${txResult.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>{`${txResult.txHash.slice(0, 10)}...${txResult.txHash.slice(-8)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={handleModalClose}
              className="w-full py-3.5 rounded-full btn-primary-glow font-bold text-sm tracking-wide cursor-pointer"
            >
              Selesai & Tutup
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* FORM INPUT & STATES: IDLE, AWAITING, REJECTED, ERROR    */}
        {/* ======================================================== */}
        {txState !== 'pending_tx' && txState !== 'success' && (
          <>
            {/* User Balance Info Bar */}
            <div className="py-3 px-4 my-4 rounded-xl bg-[#08090C]/80 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-[#8F96A3]">Saldo ${token.symbol} Anda:</span>
              <span className="font-bold text-white font-mono">
                {userTokenBalanceFormatted} {token.symbol}
              </span>
            </div>

            {/* STATE 4: REJECTED ALERT */}
            {txState === 'rejected' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2 mb-4 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{txError?.message || 'Transaksi dibatalkan di wallet.'}</span>
                </div>
                <button
                  onClick={resetState}
                  className="text-[11px] underline text-white hover:text-amber-200 cursor-pointer flex-shrink-0"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* STATE 5: ERROR / REVERT ALERT */}
            {txState === 'error' && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start justify-between gap-2 mb-4 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Gagal Mengeksekusi Transaksi</span>
                    <span className="text-[11px] leading-relaxed text-rose-200">
                      {txError?.message || 'Transaksi gagal atau di-revert oleh kontrak.'}
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
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs text-[#8F96A3]">
                <span>Anda Bayar (ETH)</span>
                <div className="flex items-center gap-2">
                  <span>Saldo:</span>
                  <span className="font-mono text-white font-semibold">
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
                  className="w-full bg-[#08090C] border border-white/10 rounded-2xl px-4 py-3.5 text-xl font-bold font-mono text-white placeholder-[#8F96A3] focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
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
                    disabled={isBusy}
                    onClick={() => setAmountStr(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer disabled:opacity-50 ${
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
                    disabled={isBusy}
                    onClick={() => {
                      const safeMax = ethBalance.value > parseEther('0.002') 
                        ? ethBalance.value - parseEther('0.002') 
                        : ethBalance.value;
                      setAmountStr(formatEther(safeMax));
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white/5 text-amber-300 hover:bg-white/10 cursor-pointer ml-auto disabled:opacity-50"
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
                <span>Perkiraan Diterima</span>
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
                <span>Toleransi Slippage:</span>
              </div>

              <div className="flex items-center gap-1.5">
                {[0.5, 1, 2].map((pct) => (
                  <button
                    key={pct}
                    disabled={isBusy}
                    onClick={() => handleSelectSlippage(pct)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all cursor-pointer disabled:opacity-50 ${
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
                <span>Minimum Diterima (Guaranteed):</span>
                <span className="text-white font-semibold">{minTokensFormatted} ${token.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Protocol Fee ({Number(token.feeBps) / 100}%):</span>
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
                <span>Harga Spot:</span>
                <span className="text-white">{token.spotPriceEth} ETH</span>
              </div>
            </div>

            {/* STATE 1: AWAITING WALLET OR SUBMIT BUTTON */}
            <div className="mt-5">
              {txState === 'awaiting_wallet' ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-full bg-blue-600/50 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-wait"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Konfirmasi di wallet...</span>
                </button>
              ) : calculation?.buttonState.action === 'switch' ? (
                <button
                  onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
                  className="w-full py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-[#08090C] font-bold text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Pindah ke Robinhood Testnet
                </button>
              ) : (
                <button
                  onClick={handleConfirmBuy}
                  disabled={calculation?.buttonState.disabled || isBusy}
                  className="w-full py-3.5 rounded-full btn-primary-glow font-bold text-sm tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{calculation?.buttonState.text}</span>
                  {!calculation?.buttonState.disabled && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
