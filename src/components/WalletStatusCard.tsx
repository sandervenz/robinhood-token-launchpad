'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { robinhoodTestnet } from '@/config/chain';
import { formatUnits } from 'viem';
import { 
  Wallet, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  LogOut, 
  Loader2 
} from 'lucide-react';
import { ConnectModal } from './ConnectModal';

export function WalletStatusCard() {
  const { address, isConnected, chainId, status } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({ address });

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full max-w-3xl glass-card rounded-2xl p-6 sm:p-8 mb-10 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const isWrongNetwork = isConnected && chainId !== robinhoodTestnet.id;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl glass-card rounded-2xl p-6 sm:p-8 text-left mb-10 relative overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Wallet Connection & Balance</h2>
            <p className="text-xs text-[#8F96A3]">Step 2 — Interactive MetaMask Integration & Chain Switching</p>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div>
          {!isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#8F96A3] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span>Wallet Disconnected</span>
            </span>
          ) : isWrongNetwork ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Wrong Network (ID: {chainId})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connected to Robinhood Testnet</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!isConnected ? (
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">
              No wallet connected yet
            </p>
            <p className="text-xs text-[#8F96A3] max-w-md">
              Connect your MetaMask wallet to view testnet balance, switch chains automatically, and prepare for token trading.
            </p>
          </div>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            disabled={isConnecting}
            className="btn-primary-glow px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting MetaMask...</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span>Connect MetaMask</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="pt-6 space-y-4">
          {/* Wrong Network Banner within Card if applicable */}
          {isWrongNetwork && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="text-xs text-rose-200">
                  You are connected to Chain ID <strong className="font-mono">{chainId}</strong>. The app requires Robinhood Testnet (Chain ID {robinhoodTestnet.id}).
                </span>
              </div>
              <button
                onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
                disabled={isSwitching}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                {isSwitching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Switching...</span>
                  </>
                ) : (
                  <>
                    <span>Switch Network</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Connected Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wallet Address */}
            <div className="p-4 rounded-xl bg-[#0D0F16]/80 border border-white/5">
              <span className="text-xs text-[#8F96A3] font-medium block mb-2">
                Connected Address
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5">
                <span className="font-mono text-xs text-white truncate">{address}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-white/10 text-[#8F96A3] hover:text-white transition-colors cursor-pointer flex-shrink-0"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* ETH Balance */}
            <div className="p-4 rounded-xl bg-[#0D0F16]/80 border border-white/5 flex flex-col justify-between">
              <span className="text-xs text-[#8F96A3] font-medium">
                Robinhood Testnet Balance
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-white">
                    {isBalanceLoading ? (
                      <span className="text-gray-400 text-base animate-pulse">Loading...</span>
                    ) : balance ? (
                      `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(5)} ${balance.symbol}`
                    ) : (
                      '0 ETH'
                    )}
                  </span>
                  <span className="block text-[11px] text-[#8F96A3] mt-0.5">
                    Ready for bonding curve purchases
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>View Wallet on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://faucet.testnet.chain.robinhood.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Get Faucet ETH</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={() => disconnect()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-rose-500/10 text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
      />
    </div>
  );
}
