'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { 
  Wallet, 
  X, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Sparkles
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
        setErrorMessage('Koneksi dibatalkan di wallet.');
      } else if (err.message?.includes('already pending')) {
        setErrorMessage('Permintaan koneksi sudah terbuka. Silakan buka ekstensi MetaMask Anda di toolbar browser.');
      } else {
        setErrorMessage(err.shortMessage || err.message || 'Gagal menghubungkan wallet.');
      }
    } finally {
      setActiveConnectorId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 relative border border-white/15 shadow-2xl shadow-blue-500/10 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hubungkan Wallet</h3>
              <p className="text-xs text-[#8F96A3]">Pilih dompet Web3 untuk memulai</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#8F96A3] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if no ethereum extension in browser */}
        {!hasEthereum && (
          <div className="my-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white mb-0.5">Ekstensi MetaMask Tidak Terdeteksi</span>
                <span>
                  Pastikan Anda membuka halaman ini di browser Google Chrome / Brave yang sudah terpasang ekstensi MetaMask.
                </span>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-amber-400 font-semibold hover:underline block"
                >
                  <span>Unduh MetaMask Ekstensi</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Connector List */}
        <div className="space-y-2.5 my-5">
          {connectors.map((c) => {
            const isThisLoading = isPending && activeConnectorId === c.id;
            const isMetaMask = c.name.toLowerCase().includes('metamask');

            return (
              <button
                key={c.id}
                onClick={() => handleConnect(c)}
                disabled={isPending}
                className="w-full p-4 rounded-2xl bg-[#08090C] hover:bg-white/[0.04] border border-white/10 hover:border-blue-500/40 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {isMetaMask ? (
                      <span className="text-xl">🦊</span>
                    ) : (
                      <Wallet className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-white block">
                      {c.name}
                    </span>
                    <span className="text-[11px] text-[#8F96A3]">
                      {isMetaMask ? 'Rekomendasi Utama (Chrome Extension)' : 'Browser Wallet Injected'}
                    </span>
                  </div>
                </div>

                <div>
                  {isThisLoading ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Hubungkan →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Helpful note */}
        <p className="text-[11px] text-[#8F96A3] text-center pt-2 border-t border-white/5">
          Jika popup MetaMask tidak muncul otomatis, periksa ikon serigala 🦊 di pojok kanan atas browser Anda untuk menyetujui koneksi.
        </p>
      </div>
    </div>
  );
}
