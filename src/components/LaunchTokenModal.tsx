'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useBalance } from 'wagmi';
import { robinhoodTestnet } from '@/config/chain';
import { useLaunchToken } from '@/hooks/useLaunchToken';
import { useLaunchFee } from '@/hooks/useLaunchFee';
import { 
  Rocket, 
  X, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ExternalLink, 
  Terminal,
  RotateCcw
} from 'lucide-react';

interface LaunchTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LaunchTokenModal({ isOpen, onClose }: LaunchTokenModalProps) {
  const { address, isConnected, chainId } = useAccount();
  const { data: balance } = useBalance({ address });
  const { feeWei, feeFormatted, isLoading: isFeeLoading } = useLaunchFee();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');

  const {
    state,
    txHash,
    result,
    parsedError,
    executeLaunch,
    reset,
    isIdle,
    isAwaitingWallet,
    isPendingTx,
    isSuccess,
    isRejected,
    isError,
  } = useLaunchToken(() => {
    // Reset form fields on successful launch
    setName('');
    setSymbol('');
    setDescription('');
  });

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPendingTx && !isAwaitingWallet) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPendingTx, isAwaitingWallet]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted) return null;

  const isWrongNetwork = isConnected && chainId !== robinhoodTestnet.id;
  const launchFeeWei = feeWei > 0n ? feeWei : BigInt(500000000000000); // Dynamic with 0.0005 ETH fallback
  const hasInsufficientBalance = balance ? balance.value < launchFeeWei : false;
  const isValidForm = name.trim().length >= 2 && symbol.trim().length >= 2;
  const displayFee = isFeeLoading ? '0.0005' : (feeFormatted || '0.0005');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidForm || !isConnected || isWrongNetwork || hasInsufficientBalance) return;

    executeLaunch({
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      description: description.trim(),
    });
  };

  const handleClose = () => {
    if (isPendingTx || isAwaitingWallet) return;
    reset();
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-token-title"
    >
      <div 
        className="w-full max-w-lg bg-[#111318] rounded-xl border border-[#1E222B] p-6 sm:p-7 relative shadow-2xl text-left max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E222B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#161922] border border-[#262C38] flex items-center justify-center text-[#C8F031] font-mono text-sm">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="launch-token-title" className="text-base font-bold text-[#EDEDEC] tracking-tight">
                  Launch New Token
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#C8F031]/10 text-[#C8F031] border border-[#C8F031]/25">
                  BONUS
                </span>
              </div>
              <p className="text-xs text-[#808593] font-mono">Deploy bonding curve on Robinhood Testnet</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isPendingTx || isAwaitingWallet}
            className="p-1 rounded-md text-[#808593] hover:text-[#EDEDEC] hover:bg-[#1A1E27] transition-colors cursor-pointer disabled:opacity-30"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SUCCESS STATE */}
        {isSuccess && result && (
          <div className="my-6 text-center py-4 space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-[#C8F031]/10 border border-[#C8F031]/30 text-[#C8F031] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-[#EDEDEC]">Token Successfully Launched</h4>
              <p className="text-xs text-[#808593] mt-1">
                Token <span className="text-[#EDEDEC] font-mono font-semibold">${result.symbol}</span> ({result.name}) is now live on Robinhood Testnet and indexed in the protocol registry.
              </p>
            </div>

            {/* Token & Curve Details Box */}
            <div className="p-3.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B] text-left space-y-2 text-xs font-mono">
              <div>
                <span className="text-[#808593] block text-[10px] uppercase tracking-wider">Token Address:</span>
                <span className="text-[#EDEDEC] truncate block select-all">{result.tokenAddress}</span>
              </div>
              <div>
                <span className="text-[#808593] block text-[10px] uppercase tracking-wider">Bonding Curve Contract:</span>
                <span className="text-[#C8F031] truncate block select-all">{result.curveAddress}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/tx/${result.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-lg bg-[#161922] hover:bg-[#1D212D] border border-[#262C38] text-xs font-mono text-[#EDEDEC] inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#808593]" />
              </a>

              <button
                onClick={handleClose}
                className="flex-1 py-2 px-3 rounded-lg bg-[#C8F031] hover:bg-[#D8FF42] text-[#0A0B0E] text-xs font-mono font-bold transition-all cursor-pointer"
              >
                View in Token Registry
              </button>
            </div>
          </div>
        )}

        {/* TRANSACTION IN PROGRESS STATES */}
        {(isAwaitingWallet || isPendingTx) && (
          <div className="my-8 text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-[#161922] border border-[#262C38] text-[#C8F031] mx-auto flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <h4 className="text-base font-bold text-[#EDEDEC]">
                {isAwaitingWallet ? 'Awaiting Wallet Approval...' : 'Broadcasting & Mining Contract...'}
              </h4>
              <p className="text-xs text-[#808593] mt-1 font-mono">
                {isAwaitingWallet
                  ? 'Please confirm the launch transaction in your MetaMask wallet extension.'
                  : 'Waiting for Robinhood Testnet block inclusion (~2-4s block time)...'}
              </p>
            </div>

            {txHash && (
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C8F031] hover:underline"
              >
                <span>Track transaction on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* ERROR OR REJECTED BANNER */}
        {(isRejected || isError) && (
          <div className="my-4 p-3.5 rounded-lg bg-[#1C1316] border border-[#3E1C22] text-xs text-rose-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#EDEDEC] font-semibold">
                    {isRejected ? 'Transaction Rejected by User' : 'Token Deployment Failed'}
                  </strong>
                  <p className="mt-0.5 text-rose-300/80 font-mono text-[11px]">
                    {parsedError?.message || 'An unexpected error occurred while processing transaction.'}
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="p-1 rounded text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                title="Retry launch"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* IDLE / FORM INPUT STATE */}
        {(isIdle || isRejected || isError) && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Token Name Input */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#808593] mb-1.5">
                Token Name <span className="text-[#C8F031]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sander Token, Sovereign Yield"
                maxLength={32}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B] text-[#EDEDEC] text-xs font-mono placeholder:text-[#4A5060] focus:outline-none focus:border-[#C8F031] transition-colors"
              />
            </div>

            {/* Token Symbol Input */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#808593] mb-1.5">
                Symbol / Ticker <span className="text-[#C8F031]">*</span>
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. SNDR, SVY, RHB"
                maxLength={8}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B] text-[#EDEDEC] text-xs font-mono uppercase placeholder:text-[#4A5060] focus:outline-none focus:border-[#C8F031] transition-colors"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#808593] mb-1.5">
                Description <span className="text-[#4A5060] lowercase">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of token utility or experiment..."
                rows={2}
                maxLength={140}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0A0B0E] border border-[#1E222B] text-[#EDEDEC] text-xs font-mono placeholder:text-[#4A5060] focus:outline-none focus:border-[#C8F031] transition-colors resize-none"
              />
            </div>

            {/* Protocol Economics Blueprint Info Box */}
            <div className="p-3.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B] space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-[#808593]">
                <span className="text-[11px]">Total Supply:</span>
                <span className="text-[#EDEDEC] font-bold">1,000,000,000 Tokens</span>
              </div>
              <div className="flex items-center justify-between text-[#808593]">
                <span className="text-[11px]">Starting Spot Price:</span>
                <span className="text-[#C8F031] font-bold">0.0₁₀1680 ETH</span>
              </div>
              <div className="flex items-center justify-between text-[#808593]">
                <span className="text-[11px]">Graduation Target:</span>
                <span className="text-[#808593] text-right font-bold">
                  <span className="text-[#EDEDEC]">0.042 ETH</span> → Uniswap v4
                </span>
              </div>
              <div className="pt-2 border-t border-[#1E222B] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#EDEDEC]">Required Launch Fee:</span>
                <span className="font-bold text-[#C8F031]">
                  {isFeeLoading ? 'Loading...' : `${displayFee} ETH`}
                </span>
              </div>
            </div>

            {/* Warning if insufficient balance */}
            {hasInsufficientBalance && (
              <div className="p-3 rounded-lg bg-[#241B0E] border border-[#443118] text-[11px] text-amber-300 font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Insufficient wallet balance to cover the launch fee ({displayFee} ETH).</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValidForm || !isConnected || isWrongNetwork || hasInsufficientBalance}
              className="w-full py-2.5 rounded-lg bg-[#C8F031] hover:bg-[#D8FF42] text-[#0A0B0E] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Token on Robinhood Chain ({displayFee} ETH)</span>
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
