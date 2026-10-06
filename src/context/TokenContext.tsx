'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useTokenData } from '@/hooks/useTokenData';
import { TokenData } from '@/types/token';
import { useQueryClient } from '@tanstack/react-query';

interface TokenContextType {
  tokens: TokenData[];
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  error: Error | null;
  refetchTokens: () => Promise<void>;
  handlePurchaseSuccess: (tokenAddress: string) => Promise<void>;
  lastPurchasedAddress: string | null;
  phaseFilter: 'all' | '0' | '2';
  setPhaseFilter: (phase: 'all' | '0' | '2') => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: ReactNode }) {
  const tokenData = useTokenData();
  const queryClient = useQueryClient();
  const [lastPurchasedAddress, setLastPurchasedAddress] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<'all' | '0' | '2'>('all');

  const handlePurchaseSuccess = useCallback(
    async (tokenAddress: string) => {
      setLastPurchasedAddress(tokenAddress.toLowerCase());

      // 1. Invalidate all TanStack / Wagmi query caches (saldo ETH user, balance token user)
      await queryClient.invalidateQueries();

      // 2. Refetch curve reserves, realQuoteReserve, spot price & graduation progress via Multicall3
      await tokenData.refetch();

      // Hilangkan status highlight setelah 8 detik
      setTimeout(() => {
        setLastPurchasedAddress(null);
      }, 8000);
    },
    [queryClient, tokenData]
  );

  return (
    <TokenContext.Provider
      value={{
        tokens: tokenData.tokens,
        isLoading: tokenData.isLoading,
        isRefreshing: tokenData.isRefreshing,
        isError: tokenData.isError,
        error: tokenData.error,
        refetchTokens: tokenData.refetch,
        handlePurchaseSuccess,
        lastPurchasedAddress,
        phaseFilter,
        setPhaseFilter,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
}
