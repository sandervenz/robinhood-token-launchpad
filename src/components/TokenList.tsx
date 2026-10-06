'use client';

import { useState, useMemo } from 'react';
import { useTokens } from '@/context/TokenContext';
import { TokenData, TokenPhase } from '@/types/token';
import { TokenCard } from './TokenCard';
import { 
  Search, 
  SlidersHorizontal, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Inbox, 
  LayoutGrid, 
  ListFilter,
  Check
} from 'lucide-react';

interface TokenListProps {
  onSelectBuy?: (token: TokenData) => void;
}

export function TokenList({ onSelectBuy }: TokenListProps) {
  const { tokens, isLoading, isRefreshing, isError, error, refetchTokens: refetch, lastPurchasedAddress } = useTokens();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<'all' | '0' | '2'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'progress' | 'name'>('newest');

  // Filtered & Sorted Tokens
  const filteredTokens = useMemo(() => {
    return tokens
      .filter((t) => {
        // Filter by phase
        if (selectedPhase !== 'all' && t.phase.toString() !== selectedPhase) {
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
        // default newest (by block number descending)
        return Number(b.blockNumber - a.blockNumber);
      });
  }, [tokens, searchQuery, selectedPhase, sortBy]);

  // Phase Counts
  const counts = useMemo(() => {
    const total = tokens.length;
    const active = tokens.filter((t) => t.phase === 0).length;
    const graduated = tokens.filter((t) => t.phase === 2).length;
    return { total, active, graduated };
  }, [tokens]);

  return (
    <section className="w-full max-w-7xl mx-auto my-8">
      {/* Section Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore Launchpad Tokens
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {tokens.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8F96A3] mt-1">
            Browse active bonding curves and track progression towards Uniswap v4 graduation.
          </p>
        </div>

        {/* Refresh & Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefreshing}
            className="glass-pill px-4 py-2 text-xs font-semibold text-[#8F96A3] hover:text-white hover:border-white/20 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8">
        {/* Phase Filter Tabs */}
        <div className="inline-flex p-1 rounded-full bg-[#0D0F16] border border-white/5 text-xs text-[#8F96A3] self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setSelectedPhase('all')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              selectedPhase === 'all'
                ? 'bg-white/10 text-white shadow-sm'
                : 'hover:text-white'
            }`}
          >
            All Tokens ({counts.total})
          </button>
          <button
            onClick={() => setSelectedPhase('0')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              selectedPhase === '0'
                ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                : 'hover:text-white'
            }`}
          >
            Active Curves ({counts.active})
          </button>
          <button
            onClick={() => setSelectedPhase('2')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              selectedPhase === '2'
                ? 'bg-purple-500/20 text-purple-300 shadow-sm'
                : 'hover:text-white'
            }`}
          >
            Graduated ({counts.graduated})
          </button>
        </div>

        {/* Search Input & Sort */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#8F96A3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, symbol, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D0F16] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-[#8F96A3] focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0D0F16] border border-white/10 rounded-full px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="progress">Highest Progress</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* STATE 1: LOADING SKELETON */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-6 h-80 flex flex-col justify-between animate-pulse"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5" />
                    <div>
                      <div className="w-24 h-4 bg-white/10 rounded mb-2" />
                      <div className="w-16 h-3 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-5 bg-white/5 rounded-full" />
                </div>
                <div className="w-full h-16 bg-white/5 rounded-xl my-4" />
                <div className="w-full h-4 bg-white/5 rounded my-2" />
              </div>
              <div className="w-full h-10 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* STATE 2: ERROR STATE WITH RETRY */}
      {!isLoading && isError && (
        <div className="glass-card rounded-2xl p-10 text-center max-w-lg mx-auto border-rose-500/20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Failed to Load Tokens</h3>
          <p className="text-xs text-[#8F96A3] mb-6 leading-relaxed">
            {error?.message || 'Unable to fetch token logs or reserves from Robinhood Testnet.'}
          </p>
          <button
            onClick={() => refetch()}
            className="btn-primary-glow px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* STATE 3: EMPTY STATE */}
      {!isLoading && !isError && filteredTokens.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8F96A3] mx-auto mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Tokens Found</h3>
          <p className="text-xs text-[#8F96A3] mb-5">
            {searchQuery
              ? `No tokens match "${searchQuery}". Try a different keyword.`
              : 'No tokens found in this filter category.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-blue-400 hover:underline cursor-pointer"
            >
              Clear search filter
            </button>
          )}
        </div>
      )}

      {/* TOKEN CARDS GRID */}
      {!isLoading && !isError && filteredTokens.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTokens.map((token) => (
            <TokenCard
              key={token.token}
              token={token}
              isHighlighted={lastPurchasedAddress === token.token.toLowerCase()}
              onSelectBuy={onSelectBuy}
            />
          ))}
        </div>
      )}
    </section>
  );
}
