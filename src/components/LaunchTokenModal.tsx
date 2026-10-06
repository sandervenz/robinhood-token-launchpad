'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { robinhoodTestnet } from '@/config/chain';
import { useLaunchToken } from '@/hooks/useLaunchToken';
import { 
  Rocket, 
  X, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ExternalLink, 
  Coins, 
  TrendingUp, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface LaunchTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LaunchTokenModal({ isOpen, onClose }: LaunchTokenModalProps) {
  const { address, isConnected, chainId } = useAccount();
  const { data: balance } = useBalance({ address });

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

  if (!isOpen) return null;

  const isWrongNetwork = isConnected && chainId !== robinhoodTestnet.id;
  const launchFeeWei = BigInt(500000000000000); // 0.0005 ETH
  const hasInsufficientBalance = balance ? balance.value < launchFeeWei : true;
  const isValidForm = name.trim().length >= 2 && symbol.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidForm || !isConnected || isWrongNetwork || hasInsufficientBalance) return;

    executeLaunch({
      name: name.trim(),
      symbol: symbol.trim(),
      description: description.trim(),
    });
  };

  const handleClose = () => {
    if (isPendingTx || isAwaitingWallet) return;
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 relative border border-white/15 shadow-2xl shadow-blue-500/10 text-left max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Launch New Token</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Bonus Feature
                </span>
              </div>
              <p className="text-xs text-[#8F96A3]">Deploy instant bonding curve on Robinhood Testnet</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isPendingTx || isAwaitingWallet}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#8F96A3] hover:text-white transition-colors cursor-pointer disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUCCESS STATE */}
        {isSuccess && result && (
          <div className="my-6 text-center py-4 space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-white">Token Berhasil Di-Launch! 🎉</h4>
              <p className="text-xs text-[#8F96A3] mt-1">
                Token <strong className="text-white">${result.symbol}</strong> ({result.name}) telah aktif di Robinhood Testnet dan langsung muncul di daftar launchpad.
              </p>
            </div>

            {/* Token & Curve Details Box */}
            <div className="p-4 rounded-2xl bg-[#0D0F16] border border-white/10 text-left space-y-2.5 text-xs font-mono">
              <div>
                <span className="text-[#8F96A3] block text-[11px]">Token Address:</span>
                <span className="text-white truncate block">{result.tokenAddress}</span>
              </div>
              <div>
                <span className="text-[#8F96A3] block text-[11px]">Bonding Curve Contract:</span>
                <span className="text-blue-400 truncate block">{result.curveAddress}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/tx/${result.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8F96A3]" />
              </a>

              <button
                onClick={handleClose}
                className="flex-1 btn-primary-glow py-2.5 px-4 text-xs font-bold cursor-pointer"
              >
                Lihat di List Token
              </button>
            </div>
          </div>
        )}

        {/* TRANSACTION IN PROGRESS STATES */}
        {(isAwaitingWallet || isPendingTx) && (
          <div className="my-8 text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                {isAwaitingWallet ? 'Menunggu Konfirmasi di Wallet...' : 'Men-deploy Token ke Robinhood Chain...'}
              </h4>
              <p className="text-xs text-[#8F96A3] mt-1">
                {isAwaitingWallet
                  ? 'Silakan setujui transaksi di jendela ekstensi MetaMask Anda.'
                  : 'Sedang menunggu transaksi masuk ke blok Robinhood Testnet (~2-4 detik)...'}
              </p>
            </div>

            {txHash && (
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
              >
                <span>Lihat proses mining transaksi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* ERROR OR REJECTED BANNER */}
        {(isRejected || isError) && (
          <div className="my-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    {isRejected ? 'Transaksi Dibatalkan di Wallet' : 'Gagal Melakukan Launch Token'}
                  </strong>
                  <p className="mt-0.5 text-rose-200">
                    {parsedError?.message || 'Terjadi kesalahan saat memproses transaksi.'}
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                title="Coba lagi"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* IDLE / FORM INPUT STATE */}
        {(isIdle || isRejected || isError) && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Token Name Input */}
            <div>
              <label className="block text-xs font-semibold text-[#8F96A3] mb-1.5">
                Token Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Sander Token, Adatama Moon"
                maxLength={32}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#08090C] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors"
              />
            </div>

            {/* Token Symbol Input */}
            <div>
              <label className="block text-xs font-semibold text-[#8F96A3] mb-1.5">
                Symbol / Ticker <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="misal: SNDR, ADTM, ROBIN"
                maxLength={8}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#08090C] border border-white/10 text-white text-sm font-mono uppercase focus:outline-none focus:border-blue-400/50 transition-colors"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-semibold text-[#8F96A3] mb-1.5">
                Deskripsi Token <span className="text-[#8F96A3] font-normal">(opsional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan visi atau fungsi token uji Anda..."
                rows={2}
                maxLength={140}
                className="w-full px-4 py-2 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs focus:outline-none focus:border-blue-400/50 transition-colors resize-none"
              />
            </div>

            {/* Protocol Economics Blueprint Info Box */}
            <div className="p-4 rounded-2xl bg-[#0D0F16] border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#8F96A3]">
                <span>Total Token Supply:</span>
                <span className="font-semibold text-white font-mono">1,000,000,000 Tokens</span>
              </div>
              <div className="flex items-center justify-between text-[#8F96A3]">
                <span>Starting Spot Price:</span>
                <span className="font-semibold text-emerald-400 font-mono">0.0₁₀1680 ETH</span>
              </div>
              <div className="flex items-center justify-between text-[#8F96A3]">
                <span>Graduation Target:</span>
                <span className="font-semibold text-purple-400 font-mono">0.042 ETH → Uniswap v4</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Required Launch Fee:</span>
                <span className="font-bold text-blue-400 font-mono">0.0005 ETH</span>
              </div>
            </div>

            {/* Warning if insufficient balance */}
            {hasInsufficientBalance && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Saldo Anda tidak mencukupi untuk launch fee (0.0005 ETH).</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValidForm || !isConnected || isWrongNetwork || hasInsufficientBalance}
              className="w-full btn-primary-glow py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Token on Robinhood Chain (0.0005 ETH)</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
