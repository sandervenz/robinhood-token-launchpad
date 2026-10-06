'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, Address } from 'viem';
import { 
  LAUNCH_FACTORY_ADDRESS, 
  FACTORY_DEPLOY_BLOCK 
} from '@/config/contracts';
import { TokenLaunchedEvent } from '@/types/token';

const TOKEN_LAUNCHED_EVENT = parseAbiItem(
  'event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)'
);

const CHUNK_SIZE = BigInt(45000); // Aman di bawah batas RPC 50.000 blok

export function useTokenLogs() {
  const publicClient = usePublicClient();
  const [tokens, setTokens] = useState<TokenLaunchedEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<{
    currentChunk: number;
    totalChunks: number;
    percentage: number;
  }>({ currentChunk: 0, totalChunks: 0, percentage: 0 });

  const lastScannedBlockRef = useRef<bigint>(FACTORY_DEPLOY_BLOCK);
  const isFetchingRef = useRef<boolean>(false);

  const fetchTokenLogs = useCallback(
    async (isManualRefresh = false) => {
      if (!publicClient || isFetchingRef.current) return;

      isFetchingRef.current = true;
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else if (tokens.length === 0) {
        setIsLoading(true);
      }
      setIsError(false);
      setError(null);

      try {
        const latestBlock = await publicClient.getBlockNumber();
        const startBlock = tokens.length === 0 
          ? FACTORY_DEPLOY_BLOCK 
          : lastScannedBlockRef.current + BigInt(1);

        if (startBlock > latestBlock) {
          isFetchingRef.current = false;
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        const totalBlocks = latestBlock - startBlock;
        const totalChunks = Math.max(1, Math.ceil(Number(totalBlocks) / Number(CHUNK_SIZE)));

        const newEvents: TokenLaunchedEvent[] = [];
        let chunkIndex = 0;

        for (let from = startBlock; from <= latestBlock; from += CHUNK_SIZE + BigInt(1)) {
          chunkIndex++;
          const to = from + CHUNK_SIZE > latestBlock ? latestBlock : from + CHUNK_SIZE;

          setProgress({
            currentChunk: chunkIndex,
            totalChunks,
            percentage: Math.min(100, Math.round((chunkIndex / totalChunks) * 100)),
          });

          const logs = await publicClient.getLogs({
            address: LAUNCH_FACTORY_ADDRESS,
            event: TOKEN_LAUNCHED_EVENT,
            fromBlock: from,
            toBlock: to,
          });

          for (const log of logs) {
            const { token, curve, deployer } = log.args;
            const pairToken = log.args.pairToken as Address;
            const launchConfigId = log.args.launchConfigId ?? BigInt(0);
            const graduationThreshold = log.args.graduationThreshold ?? BigInt(0);

            // Filter ETH pairs (pairToken == address(0)) sesuai brief
            if (token && curve && deployer) {
              newEvents.push({
                token,
                curve,
                deployer,
                pairToken,
                launchConfigId,
                graduationThreshold,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
              });
            }
          }
        }

        lastScannedBlockRef.current = latestBlock;

        setTokens((prev) => {
          const map = new Map<string, TokenLaunchedEvent>();
          // Gabungkan token lama dan baru, hindari duplikasi
          for (const item of prev) {
            map.set(item.token.toLowerCase(), item);
          }
          for (const item of newEvents) {
            map.set(item.token.toLowerCase(), item);
          }
          return Array.from(map.values());
        });
      } catch (err) {
        console.error('Failed to fetch token logs:', err);
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown error fetching logs'));
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [publicClient, tokens.length]
  );

  // Initial load
  useEffect(() => {
    fetchTokenLogs();
  }, [fetchTokenLogs]);

  // Polling setiap 30 detik untuk menangkap token baru yang di-launch
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTokenLogs(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTokenLogs]);

  return {
    tokens,
    isLoading,
    isRefreshing,
    isError,
    error,
    progress,
    refetch: () => fetchTokenLogs(true),
    lastScannedBlock: lastScannedBlockRef.current,
  };
}
