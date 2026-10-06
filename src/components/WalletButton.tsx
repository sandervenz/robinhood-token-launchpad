'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { robinhoodTestnet } from '@/config/chain';
import { formatUnits } from 'viem';
import { 
  Wallet, 
  LogOut, 
  Copy, 
  Check, 
  ChevronDown, 
  AlertCircle, 
  ExternalLink,
  Loader2 
} from 'lucide-react';
import { ConnectModal } from './ConnectModal';

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
  });

  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-28 rounded-md bg-[#161922] animate-pulse border border-[#1E222B]" />
    );
  }

  const isWrongNetwork = isConnected && chainId !== robinhoodTestnet.id;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setIsConnectModalOpen(true)}
          disabled={isConnecting}
          className="px-3.5 py-1.5 rounded-lg bg-[#C8F031] hover:bg-[#D8FF42] text-[#0A0B0E] font-mono text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>

        <ConnectModal 
          isOpen={isConnectModalOpen} 
          onClose={() => setIsConnectModalOpen(false)} 
        />
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {isWrongNetwork ? (
        <button
          onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
          disabled={isSwitching}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2B1418] border border-[#4E2128] text-rose-300 text-xs font-mono font-semibold hover:bg-[#381B20] transition-all cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Wrong Network</span>
          <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">Switch</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {/* Balance Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111318] border border-[#1E222B] text-xs font-mono text-[#808593]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8F031]" />
            <span className="text-[#EDEDEC] font-semibold">
              {isBalanceLoading ? (
                '...'
              ) : balance ? (
                `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
              ) : (
                '0 ETH'
              )}
            </span>
          </div>

          {/* Account Dropdown Trigger */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-3 py-1.5 rounded-lg bg-[#111318] hover:bg-[#161922] border border-[#1E222B] hover:border-[#2F3543] transition-all inline-flex items-center gap-2 cursor-pointer text-xs font-mono"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#C8F031]" />
            <span className="text-[#EDEDEC] font-semibold">{address && truncateAddress(address)}</span>
            <ChevronDown className="w-3 h-3 text-[#808593]" />
          </button>
        </div>
      )}

      {/* Account Details Dropdown */}
      {dropdownOpen && address && (
        <div className="absolute right-0 mt-2 w-72 bg-[#111318] rounded-xl p-4 shadow-2xl border border-[#1E222B] z-50">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E222B]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#808593]">Connected Account</span>
            <div className="flex items-center gap-1.5 text-[10px] text-[#C8F031] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8F031] animate-pulse" />
              <span>Chain 46630</span>
            </div>
          </div>

          {/* Address Display & Copy */}
          <div className="mt-3 p-2.5 rounded-lg bg-[#0A0B0E] border border-[#1E222B] flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-[#EDEDEC] truncate">{address}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-[#808593] hover:text-[#EDEDEC] hover:bg-[#1A1E27] transition-colors cursor-pointer"
              title="Copy Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#C8F031]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Balance Breakdown */}
          <div className="mt-3 py-2 px-3 rounded-lg bg-[#0A0B0E] border border-[#1E222B] flex items-center justify-between text-xs font-mono">
            <span className="text-[#808593] text-[11px]">ETH Balance:</span>
            <span className="font-bold text-[#EDEDEC]">
              {balance ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(5)} ETH` : '0 ETH'}
            </span>
          </div>

          {/* Actions: View in Explorer & Disconnect */}
          <div className="mt-3 pt-3 border-t border-[#1E222B] flex flex-col gap-1.5 text-xs font-mono">
            <a
              href={`${robinhoodTestnet.blockExplorers.default.url}/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#161922] text-[#808593] hover:text-[#EDEDEC] transition-colors"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors cursor-pointer"
            >
              <span>Disconnect Wallet</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
