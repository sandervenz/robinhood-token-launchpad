'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { 
  Wallet, 
  X, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  Terminal,
  ArrowRight
} from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { connectAsync, connectors, isPending } = useConnect();
  const { isConnected } = useAccount();

  const [hasEthereum, setHasEthereum] = useState<boolean>(true);
  const [activeConnectorId, setActiveConnectorId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasEthereum(!!(window as any).ethereum);
    }
  }, []);

  // Close if connected
  useEffect(() => {
    if (isConnected && isOpen) {
      onClose();
    }
  }, [isConnected, isOpen, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const handleConnect = async (connector: any) => {
    setActiveConnectorId(connector.id);
    setErrorMessage(null);

    try {
      await connectAsync({ connector });
      onClose();
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      if (err.code === 4001 || err.message?.includes('User rejected')) {
        setErrorMessage('Connection request was rejected in wallet.');
      } else if (err.message?.includes('already pending')) {
        setErrorMessage('Connection request already pending. Please open your MetaMask extension in the browser toolbar.');
      } else {
        setErrorMessage(err.shortMessage || err.message || 'Failed to connect wallet.');
      }
    } finally {
      setActiveConnectorId(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-wallet-title"
    >
      <div 
        className="w-full max-w-md bg-[#111318] rounded-xl border border-[#1E222B] p-6 relative shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E222B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#161922] border border-[#262C38] flex items-center justify-center text-[#C8F031]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 id="connect-wallet-title" className="text-base font-bold text-[#EDEDEC] tracking-tight">
                Connect Wallet
              </h3>
              <p className="text-xs text-[#808593] font-mono">Select Web3 provider to interact</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 rounded-md text-[#808593] hover:text-[#EDEDEC] hover:bg-[#1A1E27] transition-colors cursor-pointer disabled:opacity-30"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning if no ethereum extension in browser */}
        {!hasEthereum && (
          <div className="my-4 p-3.5 rounded-lg bg-[#241B0E] border border-[#443118] text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white mb-0.5">MetaMask Extension Not Detected</span>
                <span className="text-[#808593]">
                  Make sure you are browsing on Google Chrome or Brave with MetaMask extension installed.
                </span>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[#C8F031] font-mono font-semibold hover:underline"
                >
                  <span>Download MetaMask Extension</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="my-4 p-3 rounded-lg bg-[#1C1316] border border-[#3E1C22] text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="font-mono text-[11px]">{errorMessage}</span>
          </div>
        )}

        {/* Connector List */}
        <div className="space-y-2 my-4">
          {connectors.map((c) => {
            const isThisLoading = isPending && activeConnectorId === c.id;
            const isMetaMask = c.name.toLowerCase().includes('metamask');

            return (
              <button
                key={c.id}
                onClick={() => handleConnect(c)}
                disabled={isPending}
                className="w-full p-3.5 rounded-lg bg-[#0A0B0E] hover:bg-[#161922] border border-[#1E222B] hover:border-[#2F3543] transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#141720] border border-[#222734] flex items-center justify-center flex-shrink-0 text-base">
                    {isMetaMask ? '🦊' : <Wallet className="w-4 h-4 text-[#808593]" />}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-[#EDEDEC] block">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-[#808593] font-mono">
                      {isMetaMask ? 'Recommended (Browser Extension)' : 'Injected Web3 Provider'}
                    </span>
                  </div>
                </div>

                <div>
                  {isThisLoading ? (
                    <Loader2 className="w-4 h-4 text-[#C8F031] animate-spin" />
                  ) : (
                    <span className="text-xs font-mono text-[#808593] group-hover:text-[#C8F031] transition-colors inline-flex items-center gap-1">
                      <span>Connect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Terminal footnote */}
        <p className="text-[11px] text-[#606575] font-mono text-center pt-3 border-t border-[#1E222B]">
          If the popup window does not appear, check the fox icon 🦊 in your browser toolbar to approve.
        </p>
      </div>
    </div>
  );
}
