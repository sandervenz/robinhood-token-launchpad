'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { 
  LAUNCH_FACTORY_ADDRESS, 
  LAUNCH_FACTORY_ABI, 
  BONDING_CURVE_ABI, 
  LAUNCHER_TOKEN_ABI 
} from '@/config/contracts';
import { useTokenLogs } from './useTokenLogs';
import { TokenData, TokenPhase } from '@/types/token';
import { formatSpotPrice, calculateGraduationProgress } from '@/lib/math';

export function useTokenData() {
  const publicClient = usePublicClient();
  const { tokens: tokenEvents, isLoading: isLogsLoading, refetch: refetchLogs } = useTokenLogs();

  const [tokensData, setTokensData] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isFetchingRef = useRef(false);

  const fetchMulticallData = useCallback(async () => {
    if (!publicClient || tokenEvents.length === 0 || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsError(false);
    setError(null);

    try {
      // Siapkan panggilan batch multicall untuk seluruh token (7 calls per token)
      const contracts: any[] = [];

      for (const t of tokenEvents) {
        contracts.push(
          // 0: Token Name
          { address: t.token, abi: LAUNCHER_TOKEN_ABI, functionName: 'name' },
          // 1: Token Symbol
          { address: t.token, abi: LAUNCHER_TOKEN_ABI, functionName: 'symbol' },
          // 2: Token Logo
          { address: t.token, abi: LAUNCHER_TOKEN_ABI, functionName: 'logo' },
          // 3: Curve Reserves
          { address: t.curve, abi: BONDING_CURVE_ABI, functionName: 'getReserves' },
          // 4: Curve Real Quote Reserve
          { address: t.curve, abi: BONDING_CURVE_ABI, functionName: 'realQuoteReserve' },
          // 5: Curve Graduation Threshold
          { address: t.curve, abi: BONDING_CURVE_ABI, functionName: 'graduationThreshold' },
          // 6: Factory LaunchedToken Struct (menghasilkan phase)
          { address: LAUNCH_FACTORY_ADDRESS, abi: LAUNCH_FACTORY_ABI, functionName: 'getLaunchedToken', args: [t.token] }
        );
      }

      // Panggil Multicall3 aggregate3 dengan allowFailure: true
      const results = await publicClient.multicall({
        contracts,
        allowFailure: true,
      });

      const updatedTokens: TokenData[] = [];
      const CALLS_PER_TOKEN = 7;

      for (let i = 0; i < tokenEvents.length; i++) {
        const baseIdx = i * CALLS_PER_TOKEN;
        const t = tokenEvents[i];

        const nameRes = results[baseIdx];
        const symbolRes = results[baseIdx + 1];
        const logoRes = results[baseIdx + 2];
        const reservesRes = results[baseIdx + 3];
        const realQuoteRes = results[baseIdx + 4];
        const thresholdRes = results[baseIdx + 5];
        const factoryRes = results[baseIdx + 6];

        const name = (nameRes?.status === 'success' && typeof nameRes.result === 'string') 
          ? nameRes.result 
          : 'Unknown Token';

        const symbol = (symbolRes?.status === 'success' && typeof symbolRes.result === 'string') 
          ? symbolRes.result 
          : 'TKN';

        const logo = (logoRes?.status === 'success' && typeof logoRes.result === 'string') 
          ? logoRes.result 
          : '';

        let quoteReserve = BigInt(0);
        let tokenReserve = BigInt(0);
        if (reservesRes?.status === 'success' && Array.isArray(reservesRes.result)) {
          quoteReserve = reservesRes.result[0] as bigint;
          tokenReserve = reservesRes.result[1] as bigint;
        }

        const realQuoteReserve = (realQuoteRes?.status === 'success' && typeof realQuoteRes.result === 'bigint')
          ? realQuoteRes.result
          : BigInt(0);

        const graduationThreshold = (thresholdRes?.status === 'success' && typeof thresholdRes.result === 'bigint')
          ? thresholdRes.result
          : t.graduationThreshold;

        let phase: TokenPhase = 0;
        if (factoryRes?.status === 'success' && factoryRes.result && typeof (factoryRes.result as any).phase === 'number') {
          phase = (factoryRes.result as any).phase as TokenPhase;
        }

        // Kalkulasi harga spot & progress graduation
        const spotPriceEth = formatSpotPrice(quoteReserve, tokenReserve);
        const { bps, percent } = calculateGraduationProgress(realQuoteReserve, graduationThreshold, phase);

        updatedTokens.push({
          ...t,
          name,
          symbol,
          logo,
          quoteReserve,
          tokenReserve,
          realQuoteReserve,
          graduationThreshold,
          phase,
          spotPriceEth,
          graduationProgressBps: bps,
          graduationProgressPercent: percent,
        });
      }

      setTokensData(updatedTokens);
    } catch (err) {
      console.error('Failed to multicall token metrics:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Multicall failed'));
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [publicClient, tokenEvents]);

  useEffect(() => {
    if (!isLogsLoading && tokenEvents.length > 0) {
      fetchMulticallData();
    } else if (!isLogsLoading && tokenEvents.length === 0) {
      setIsLoading(false);
    }
  }, [isLogsLoading, tokenEvents, fetchMulticallData]);

  // Polling data token setiap 15 detik agar reserve & harga selalu up to date
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMulticallData();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchMulticallData]);

  const handleRefetch = async () => {
    setIsRefreshing(true);
    await refetchLogs();
    await fetchMulticallData();
  };

  return {
    tokens: tokensData,
    isLoading: isLogsLoading || (isLoading && tokensData.length === 0),
    isRefreshing,
    isError,
    error,
    refetch: handleRefetch,
  };
}
