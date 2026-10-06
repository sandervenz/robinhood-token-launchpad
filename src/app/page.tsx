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
  Terminal,
  Activity, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';

export default function Home() {
  const { feeFormatted, isLoading: isFeeLoading } = useLaunchFee();
  const [selectedTokenForBuy, setSelectedTokenForBuy] = useState<TokenData | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  return (
    <div className="min-h-screen terminal-grid-bg flex flex-col text-[#EDEDEC] font-sans selection:bg-[#C8F031]/30 selection:text-[#0A0B0E]">
      {/* Top Masthead Navbar */}
      <Navbar />
      <NetworkAlert />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex flex-col">
        {/* TERMINAL PROTOCOL MASTHEAD */}
        <section className="py-6 sm:py-10 border-b border-[#1E222B] mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161922] border border-[#262C38] text-[11px] font-mono text-[#808593] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8F031]" />
                <span>ROBINHOOD CHAIN TESTNET • ALGORITHMIC AMM PROTOCOL</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#EDEDEC] uppercase leading-tight">
                Robinhood AMM <br />
                <span className="text-[#C8F031]">Liquidity Terminal</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#808593] font-mono mt-3 max-w-xl leading-relaxed">
                Autonomous bonding curves with continuous deterministic pricing. Upon reaching graduation threshold (0.042 ETH), liquidity auto-migrates to Uniswap v4 pools.
              </p>
            </div>

            {/* Protocol Telemetry Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#111318] border border-[#1E222B]">
                <span className="text-[10px] text-[#606575] uppercase block">Chain</span>
                <span className="font-bold text-[#C8F031]">46630 (RHB)</span>
              </div>
              <div className="p-3 rounded-lg bg-[#111318] border border-[#1E222B]">
                <span className="text-[10px] text-[#606575] uppercase block">Launch Fee</span>
                <span className="font-bold text-[#EDEDEC]">
                  {isFeeLoading ? '...' : `${feeFormatted || '0.0005'} ETH`}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#111318] border border-[#1E222B]">
                <span className="text-[10px] text-[#606575] uppercase block">Multicall3</span>
                <span className="font-bold text-[#808593]">0xcA11...CA11</span>
              </div>
              <div className="p-3 rounded-lg bg-[#111318] border border-[#1E222B]">
                <span className="text-[10px] text-[#606575] uppercase block">Deploy Block</span>
                <span className="font-bold text-[#EDEDEC]">#129157568</span>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURE: TOKEN LIST (CARDS GRID / COMPACT TABLE) */}
        <section id="tokens">
          <TokenList onSelectBuy={(token) => setSelectedTokenForBuy(token)} />
        </section>

        {/* BUY MODAL FORM */}
        <BuyModal
          token={selectedTokenForBuy}
          isOpen={!!selectedTokenForBuy}
          onClose={() => setSelectedTokenForBuy(null)}
        />

        {/* TECHNICAL AUDIT & INTERVIEW DIAGNOSTICS ACCORDION */}
        <div className="mt-14 pt-6 border-t border-[#1E222B]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-mono text-xs">
              <Terminal className="w-4 h-4 text-[#C8F031]" />
              <h3 className="font-bold text-[#EDEDEC] uppercase tracking-wider">
                Technical Audit & Step Verification Panels
              </h3>
              <span className="text-[10px] bg-[#161922] text-[#808593] border border-[#222734] px-1.5 py-0.5 rounded font-mono">
                Steps 1–4 Proof
              </span>
            </div>

            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-xs font-mono text-[#808593] hover:text-[#EDEDEC] transition-colors inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded bg-[#111318] border border-[#1E222B]"
            >
              <span>{showDiagnostics ? 'Hide Verification Panels' : 'View Verification Panels'}</span>
              {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showDiagnostics && (
            <div className="space-y-6 pt-2 animate-fadeIn">
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

      {/* TERMINAL FOOTER */}
      <footer className="w-full border-t border-[#1E222B] py-6 px-4 sm:px-8 text-xs font-mono text-[#808593] mt-auto bg-[#0A0B0E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#EDEDEC]">COINTINENTAL</span>
            <span>•</span>
            <span>Robinhood Chain Testnet Launchpad</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href={`${robinhoodTestnet.blockExplorers.default.url}/address/${LAUNCH_FACTORY_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#EDEDEC] transition-colors inline-flex items-center gap-1"
            >
              <span>Factory Contract</span>
              <ArrowUpRight className="w-3 h-3 text-[#606575]" />
            </a>
            <span>•</span>
            <a
              href="https://faucet.testnet.chain.robinhood.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[#C8F031] hover:underline inline-flex items-center gap-1"
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
