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

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
  });

  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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
      <div className="h-9 w-32 rounded-full bg-white/5 animate-pulse" />
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
      <button
        onClick={() => {
          const injectedConnector = connectors[0];
          if (injectedConnector) {
            connect({ connector: injectedConnector });
          }
        }}
        disabled={isConnecting}
        className="btn-primary-glow px-4 py-2 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {isWrongNetwork ? (
        <button
          onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
          disabled={isSwitching}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-all cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Wrong Network</span>
          <span className="text-[10px] bg-rose-500/30 px-1.5 py-0.5 rounded">Switch</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {/* Balance Pill */}
          <div className="hidden sm:flex items-center gap-1.5 glass-pill px-3 py-1.5 text-xs text-[#8F96A3]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-white font-medium">
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
            className="glass-pill px-3 py-1.5 text-xs text-white hover:border-blue-400/30 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400" />
            <span className="font-mono font-medium">{address && truncateAddress(address)}</span>
            <ChevronDown className="w-3 h-3 text-[#8F96A3]" />
          </button>
        </div>
      )}

      {/* Account Details Dropdown */}
      {dropdownOpen && address && (
        <div className="absolute right-0 mt-2 w-72 glass-card rounded-2xl p-4 shadow-2xl border border-white/10 z-50">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-semibold text-[#8F96A3]">Connected Account</span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{robinhoodTestnet.name}</span>
            </div>
          </div>

          {/* Address Display & Copy */}
          <div className="mt-3 p-2.5 rounded-xl bg-[#0D0F16] border border-white/5 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-white truncate">{address}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded-lg hover:bg-white/10 text-[#8F96A3] hover:text-white transition-colors cursor-pointer"
              title="Copy Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Balance Breakdown */}
          <div className="mt-3 py-2 px-3 rounded-xl bg-white/5 flex items-center justify-between text-xs">
            <span className="text-[#8F96A3]">ETH Balance:</span>
            <span className="font-bold text-white font-mono">
              {balance ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(5)} ETH` : '0 ETH'}
            </span>
          </div>

          {/* Actions: View in Explorer & Disconnect */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2 text-xs">
            <a
              href={`${robinhoodTestnet.blockExplorers.default.url}/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 text-[#8F96A3] hover:text-white transition-colors"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors cursor-pointer"
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
