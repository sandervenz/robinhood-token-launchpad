'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { NetworkAlert } from '@/components/NetworkAlert';
import { TokenList } from '@/components/TokenList';
import { BuyModal } from '@/components/BuyModal';
import { TokenMetricsTable } from '@/components/TokenMetricsTable';
import { TokenDiscoveryTable } from '@/components/TokenDiscoveryTable';
import { WalletStatusCard } from '@/components/WalletStatusCard';
import { useLaunchFee } from '@/hooks/useLaunchFee';
import { 
  LAUNCH_FACTORY_ADDRESS, 
  MULTICALL3_ADDRESS,
  FACTORY_DEPLOY_BLOCK 
} from '@/config/contracts';
import { robinhoodTestnet } from '@/config/chain';
import { TokenData } from '@/types/token';
import { 
  Sparkles, 
  Layers, 
  Activity, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Terminal,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export default function Home() {
  const { feeFormatted, feeWei, isLoading: isFeeLoading } = useLaunchFee();
  const [selectedTokenForBuy, setSelectedTokenForBuy] = useState<TokenData | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  return (
    <div className="min-h-screen cosmic-bg flex flex-col selection:bg-blue-500/30 text-white font-sans">
      {/* Top Navbar */}
      <Navbar />
      <NetworkAlert />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col">
        {/* HERO SECTION */}
        <div className="relative text-center py-10 sm:py-16 max-w-4xl mx-auto flex flex-col items-center">
          {/* Subtle Ambient Cosmic Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />

          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 text-xs text-[#8F96A3] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Robinhood Chain Testnet • Algorithmic AMM Curves</span>
          </div>

          {/* Editorial Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6">
            The Next-Generation <br />
            <span className="bg-gradient-to-r from-white via-[#b0cdff] to-[#689df8] bg-clip-text text-transparent">
              Token Launchpad
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#8F96A3] max-w-2xl mb-8 leading-relaxed">
            Trade instant liquidity bonding curves on Robinhood Chain testnet. Zero rug-pulls, fair launch mechanics, and autonomous graduation to Uniswap v4 pools.
          </p>

          {/* Minimalist Live Protocol Stats Ribbon */}
          <div className="w-full max-w-2xl glass-card rounded-2xl p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-left">
            <div className="p-2.5 rounded-xl bg-[#08090C]/60 border border-white/5">
              <span className="text-[11px] text-[#8F96A3] block">Network</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">Chain 46630</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#08090C]/60 border border-white/5">
              <span className="text-[11px] text-[#8F96A3] block">Launch Fee</span>
              <span className="text-xs font-bold text-white font-mono">
                {isFeeLoading ? '...' : `${feeFormatted} ETH`}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#08090C]/60 border border-white/5">
              <span className="text-[11px] text-[#8F96A3] block">Multicall3</span>
              <span className="text-xs font-bold text-blue-400 font-mono">0xcA11...CA11</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#08090C]/60 border border-white/5">
              <span className="text-[11px] text-[#8F96A3] block">Deploy Block</span>
              <span className="text-xs font-bold text-white font-mono">#129157568</span>
            </div>
          </div>
        </div>

        {/* CORE FEATURE: TOKEN LIST (CARDS GRID & FILTERS) */}
        <TokenList onSelectBuy={(token) => setSelectedTokenForBuy(token)} />

        {/* STEP 6: BUY MODAL FORM */}
        <BuyModal
          token={selectedTokenForBuy}
          isOpen={!!selectedTokenForBuy}
          onClose={() => setSelectedTokenForBuy(null)}
        />

        {/* TECHNICAL AUDIT & INTERVIEW DIAGNOSTICS ACCORDION */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                Technical Audit & Step Verification Panels
              </h3>
              <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold">
                Steps 1–4 Proof
              </span>
            </div>

            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-xs text-[#8F96A3] hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer glass-pill px-3 py-1.5"
            >
              <span>{showDiagnostics ? 'Hide Verification Panels' : 'View Verification Panels'}</span>
              {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showDiagnostics && (
            <div className="space-y-8 pt-4 animate-fadeIn">
              {/* Wallet connection card */}
              <WalletStatusCard />

              {/* Step 4: Multicall3 Table */}
              <TokenMetricsTable />

              {/* Step 3: Raw Logs Table */}
              <TokenDiscoveryTable />
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 py-8 px-4 text-xs text-[#8F96A3] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">COINTINENTAL</span>
            <span>•</span>
            <span>Robinhood Chain Testnet Launchpad</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <a
              href={`${robinhoodTestnet.blockExplorers.default.url}/address/${LAUNCH_FACTORY_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>Factory Contract</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://faucet.testnet.chain.robinhood.com/"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
            >
              <span>Faucet</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
