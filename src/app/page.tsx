'use client';

import { Navbar } from '@/components/Navbar';
import { NetworkAlert } from '@/components/NetworkAlert';
import { WalletStatusCard } from '@/components/WalletStatusCard';
import { TokenDiscoveryTable } from '@/components/TokenDiscoveryTable';
import { useLaunchFee } from '@/hooks/useLaunchFee';
import { 
  LAUNCH_FACTORY_ADDRESS, 
  FACTORY_DEPLOY_BLOCK 
} from '@/config/contracts';
import { robinhoodTestnet } from '@/config/chain';
import { ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const { feeFormatted, feeWei, isLoading, isError, refetch } = useLaunchFee();

  return (
    <div className="min-h-screen cosmic-bg flex flex-col selection:bg-blue-500/30">
      <Navbar />
      <NetworkAlert />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col justify-between">
        {/* Hero Section */}
        <div className="relative my-auto flex flex-col items-center text-center py-8">
          {/* Subtle Glow Behind Hero */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 text-xs text-[#8F96A3] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Robinhood Chain Testnet • Step 3 Initialized</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
            The Algorithmic <br />
            <span className="bg-gradient-to-r from-white via-[#b0cdff] to-[#689df8] bg-clip-text text-transparent">
              Bonding Curve Launchpad
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#8F96A3] max-w-2xl mb-8 leading-relaxed">
            Fair token launches with zero initial liquidity required. Every token is traded on an automated bonding curve until reaching graduation threshold for Uniswap v4.
          </p>

          {/* Step 3: Token Discovery from Logs Table */}
          <TokenDiscoveryTable />

          {/* Step 2: Wallet Connection & Balance Card */}
          <WalletStatusCard />

          {/* Step 1: Protocol & Factory Verification Card */}
          <div className="w-full max-w-3xl glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden text-left mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Smart Contract Setup & Verification</h2>
                  <p className="text-xs text-[#8F96A3]">Step 1 — Reading live factory state from Robinhood Chain Testnet</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected to Testnet</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6">
              {/* Launch Fee */}
              <div className="p-4 rounded-xl bg-[#0D0F16]/80 border border-white/5 flex flex-col justify-between">
                <span className="text-xs text-[#8F96A3] font-medium">Protocol Launch Fee</span>
                <div className="mt-2">
                  {isLoading ? (
                    <span className="text-lg font-bold text-gray-400 animate-pulse">Fetching...</span>
                  ) : isError ? (
                    <div>
                      <span className="text-sm font-semibold text-rose-400">Error reading fee</span>
                      <button 
                        onClick={() => refetch()} 
                        className="text-xs text-blue-400 block mt-1 hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-black text-white">{feeFormatted} ETH</span>
                      <span className="block text-[11px] text-[#8F96A3] mt-0.5 font-mono">
                        {feeWei.toString()} wei
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chain ID & Target */}
              <div className="p-4 rounded-xl bg-[#0D0F16]/80 border border-white/5 flex flex-col justify-between">
                <span className="text-xs text-[#8F96A3] font-medium">Target Chain</span>
                <div className="mt-2">
                  <span className="text-lg font-bold text-white">{robinhoodTestnet.name}</span>
                  <span className="block text-[11px] text-blue-400 mt-0.5 font-mono">
                    Chain ID: {robinhoodTestnet.id}
                  </span>
                </div>
              </div>

              {/* Deploy Block */}
              <div className="p-4 rounded-xl bg-[#0D0F16]/80 border border-white/5 flex flex-col justify-between">
                <span className="text-xs text-[#8F96A3] font-medium">Factory Deploy Block</span>
                <div className="mt-2">
                  <span className="text-lg font-bold text-white font-mono">
                    #{FACTORY_DEPLOY_BLOCK.toString()}
                  </span>
                  <span className="block text-[11px] text-[#8F96A3] mt-0.5">
                    Start block for getLogs
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Address Footnote */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#8F96A3]">
              <span className="font-mono truncate">
                Factory: <span className="text-white">{LAUNCH_FACTORY_ADDRESS}</span>
              </span>
              <a
                href={`${robinhoodTestnet.blockExplorers.default.url}/address/${LAUNCH_FACTORY_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>View on Explorer</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 px-4 text-center text-xs text-[#8F96A3]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Cointinental Launchpad — Robinhood Chain Testnet (Phase 3 Completed)</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Next.js 15+</span>
            <span>•</span>
            <span>Wagmi v2</span>
            <span>•</span>
            <span>Viem</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
