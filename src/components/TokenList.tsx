'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTokens } from '@/context/TokenContext';
import { TokenData } from '@/types/token';
import { TokenCard } from './TokenCard';
import { TokenTable } from './TokenTable';
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Inbox, 
  LayoutGrid, 
  Table as TableIcon,
  X
} from 'lucide-react';

interface TokenListProps {
  onSelectBuy?: (token: TokenData) => void;
}

export function TokenList({ onSelectBuy }: TokenListProps) {
  const { 
    tokens, 
    isLoading, 
    isRefreshing, 
    isError, 
    error, 
    refetchTokens: refetch, 
    lastPurchasedAddress,
    phaseFilter,
    setPhaseFilter 
  } = useTokens();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'progress' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Pressing "/" focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' && 
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered & Sorted Tokens
  const filteredTokens = useMemo(() => {
    return tokens
      .filter((t) => {
        // Filter by phase
        if (phaseFilter !== 'all' && t.phase.toString() !== phaseFilter) {
          return false;
        }

        // Filter by search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.token.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'progress') {
          return b.graduationProgressPercent - a.graduationProgressPercent;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        // Default newest (by block number descending)
        return Number(b.blockNumber - a.blockNumber);
      });
  }, [tokens, searchQuery, phaseFilter, sortBy]);

  // Phase Counts
  const counts = useMemo(() => {
    const total = tokens.length;
    const active = tokens.filter((t) => t.phase === 0).length;
    const graduated = tokens.filter((t) => t.phase === 2).length;
    return { total, active, graduated };
  }, [tokens]);

  return (
    <section id="tokens" className="w-full max-w-7xl mx-auto my-8 scroll-mt-24">
      {/* Section Header & Toolbar Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore Launches
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#181B22] text-[#C8F031] border border-[#262B38]">
              {tokens.length} TOKENS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#808593] mt-1 font-mono">
            Autonomous bonding curves transitioning to Uniswap v4 on Robinhood Chain.
          </p>
        </div>

        {/* Sync & View Mode Controls */}
        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="inline-flex p-1 rounded-lg bg-[#111318] border border-[#1E222B] text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#1E222B] text-white shadow-sm'
                  : 'text-[#808593] hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#1E222B] text-white shadow-sm'
                  : 'text-[#808593] hover:text-white'
              }`}
              title="Ledger Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefreshing}
            className="btn-terminal-outline px-3.5 py-1.5 text-xs font-mono font-medium inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C8F031]' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Logs'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Phase Filter Tabs */}
        <div className="inline-flex p-1 rounded-lg bg-[#111318] border border-[#1E222B] text-xs font-mono self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setPhaseFilter('all')}
            className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer whitespace-nowrap ${
              phaseFilter === 'all'
                ? 'bg-[#1E222B] text-white shadow-sm'
                : 'text-[#808593] hover:text-white'
            }`}
          >
            All ({counts.total})
          </button>
          <button
            onClick={() => setPhaseFilter('0')}
            className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer whitespace-nowrap ${
              phaseFilter === '0'
                ? 'bg-[#C8F031]/15 text-[#C8F031] border border-[#C8F031]/30 shadow-sm'
                : 'text-[#808593] hover:text-white'
            }`}
          >
            Active Curves ({counts.active})
          </button>
          <button
            onClick={() => setPhaseFilter('2')}
            className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer whitespace-nowrap ${
              phaseFilter === '2'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-[#808593] hover:text-white'
            }`}
          >
            Graduated ({counts.graduated})
          </button>
        </div>

        {/* Search Input & Sort */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#808593] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search name, symbol, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111318] border border-[#1E222B] rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder-[#808593] focus:outline-none focus:border-[#C8F031]/60 font-mono transition-colors"
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#808593] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#1C2028] text-[#808593] text-[10px] font-mono border border-[#2B303C]">
                /
              </kbd>
            )}
          </div>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#111318] border border-[#1E222B] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#C8F031]/60 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="progress">Highest Progress</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* STATE 1: LOADING SKELETON */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="terminal-card p-5 h-72 flex flex-col justify-between animate-pulse"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-white/5" />
                    <div>
                      <div className="w-24 h-4 bg-white/10 rounded mb-2" />
                      <div className="w-16 h-3 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="w-16 h-5 bg-white/5 rounded" />
                </div>
                <div className="w-full h-14 bg-white/5 rounded my-4" />
                <div className="w-full h-3 bg-white/5 rounded my-2" />
              </div>
              <div className="w-full h-9 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* STATE 2: ERROR STATE WITH RETRY */}
      {!isLoading && isError && (
        <div className="terminal-card p-10 text-center max-w-lg mx-auto border-rose-500/30">
          <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Failed to Load Tokens</h3>
          <p className="text-xs text-[#808593] mb-6 leading-relaxed font-mono">
            {error?.message || 'Unable to fetch token logs or multicall metrics from Robinhood Testnet.'}
          </p>
          <button
            onClick={() => refetch()}
            className="btn-terminal-primary px-5 py-2 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* STATE 3: EMPTY STATE */}
      {!isLoading && !isError && filteredTokens.length === 0 && (
        <div className="terminal-card p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-lg bg-[#181B22] border border-[#242934] flex items-center justify-center text-[#808593] mx-auto mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Matching Tokens</h3>
          <p className="text-xs text-[#808593] mb-5 font-mono">
            {searchQuery
              ? `No tokens match "${searchQuery}". Try a different name or symbol.`
              : 'No tokens found in this filter phase.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#C8F031] hover:underline cursor-pointer font-mono font-semibold"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      )}

      {/* TOKEN LIST CONTENT: GRID OR TABLE */}
      {!isLoading && !isError && filteredTokens.length > 0 && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTokens.map((token) => (
              <TokenCard
                key={token.token}
                token={token}
                isHighlighted={lastPurchasedAddress === token.token.toLowerCase()}
                onSelectBuy={onSelectBuy}
              />
            ))}
          </div>
        ) : (
          <TokenTable
            tokens={filteredTokens}
            onSelectBuy={onSelectBuy}
            lastPurchasedAddress={lastPurchasedAddress}
          />
        )
      )}
    </section>
  );
}
