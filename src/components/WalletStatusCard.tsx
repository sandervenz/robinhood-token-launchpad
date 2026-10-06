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
  const { address, isConnected, chainId } = useAccount();
  const { isPending: isConnecting } = useConnect();
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
      <div className="w-full max-w-3xl bg-[#111318] border border-[#1E222B] rounded-xl p-6 mb-8 animate-pulse">
        <div className="h-5 w-48 bg-[#1E222B] rounded mb-4" />
        <div className="h-16 bg-[#161922] rounded-lg" />
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
    <div className="w-full max-w-3xl bg-[#111318] border border-[#1E222B] rounded-xl p-5 sm:p-6 text-left mb-8 relative">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E222B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#161922] border border-[#262C38] flex items-center justify-center text-[#C8F031]">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#EDEDEC] font-mono uppercase tracking-wider">
              Wallet Connection & Balance State
            </h2>
            <p className="text-[11px] text-[#808593] font-mono">Step 2 — MetaMask Integration & Network Verification</p>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div>
          {!isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161922] border border-[#262C38] text-[#808593] text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
              <span>Disconnected</span>
            </span>
          ) : isWrongNetwork ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2B1418] border border-[#4E2128] text-rose-300 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Wrong Network (ID: {chainId})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161922] border border-[#C8F031]/30 text-[#C8F031] text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C8F031]" />
              <span>Connected (Robinhood Chain 46630)</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!isConnected ? (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div>
            <p className="text-xs font-bold text-[#EDEDEC] mb-0.5">
              No active Web3 session detected
            </p>
            <p className="text-[11px] text-[#808593] max-w-md">
              Connect your MetaMask wallet to view testnet balance, switch chains automatically, and execute bonding curve orders.
            </p>
          </div>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            disabled={isConnecting}
            className="px-4 py-2 rounded-lg bg-[#C8F031] hover:bg-[#D8FF42] text-[#0A0B0E] text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0 transition-all"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect MetaMask</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="pt-4 space-y-3 font-mono">
          {/* Wrong Network Banner */}
          {isWrongNetwork && (
            <div className="p-3 rounded-lg bg-[#2B1418] border border-[#4E2128] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="text-rose-200 text-[11px]">
                  Connected to Chain ID <strong>{chainId}</strong>. App requires Robinhood Testnet ({robinhoodTestnet.id}).
                </span>
              </div>
              <button
                onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
                disabled={isSwitching}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex-shrink-0 inline-flex items-center gap-1.5"
              >
                {isSwitching ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Switching...</span>
                  </>
                ) : (
                  <>
                    <span>Switch Network</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Connected Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Wallet Address */}
            <div className="p-3 rounded-lg bg-[#0A0B0E] border border-[#1E222B]">
              <span className="text-[10px] text-[#808593] uppercase tracking-wider block mb-1">
                Connected Address
              </span>
              <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-[#111318] border border-[#1E222B]">
                <span className="text-xs text-[#EDEDEC] truncate select-all">{address}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded text-[#808593] hover:text-[#EDEDEC] hover:bg-[#1A1E27] transition-colors cursor-pointer flex-shrink-0"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#C8F031]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* ETH Balance */}
            <div className="p-3 rounded-lg bg-[#0A0B0E] border border-[#1E222B] flex flex-col justify-between">
              <span className="text-[10px] text-[#808593] uppercase tracking-wider">
                Robinhood Testnet Balance
              </span>
              <div className="mt-1">
                <span className="text-xl font-bold text-[#EDEDEC]">
                  {isBalanceLoading ? (
                    <span className="text-gray-500 text-sm animate-pulse">Loading...</span>
                  ) : balance ? (
                    `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(5)} ${balance.symbol}`
                  ) : (
                    '0 ETH'
                  )}
                </span>
                <span className="block text-[10px] text-[#606575] mt-0.5">
                  Available for bonding curve purchases
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#1E222B]">
            <div className="flex items-center gap-4 text-[11px]">
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#808593] hover:text-[#EDEDEC] transition-colors"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3 text-[#606575]" />
              </a>
              <a
                href="https://faucet.testnet.chain.robinhood.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#C8F031] hover:underline"
              >
                <span>Get Faucet ETH</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={() => disconnect()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161922] hover:bg-rose-500/10 text-rose-400 transition-colors cursor-pointer text-xs"
            >
              <LogOut className="w-3 h-3" />
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
