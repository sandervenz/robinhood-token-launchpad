'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { Address, parseAbiItem, decodeEventLog } from 'viem';
import { BONDING_CURVE_ABI } from '@/config/contracts';
import { parseTransactionError, ParsedTxError } from '@/lib/errorParser';
import { TokenData } from '@/types/token';

const CURVE_BUY_EVENT = parseAbiItem(
  'event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)'
);

export type TxLifecycleState =
  | 'idle'
  | 'awaiting_wallet'
  | 'pending_tx'
  | 'success'
  | 'rejected'
  | 'error';

export interface BuyResult {
  txHash: `0x${string}`;
  tokensReceived: bigint;
  tokensReceivedFormatted?: string;
  blockNumber: bigint;
}

export function useBuyToken(onSuccessCallback?: () => void) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [state, setState] = useState<TxLifecycleState>('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [result, setResult] = useState<BuyResult | null>(null);
  const [parsedError, setParsedError] = useState<ParsedTxError | null>(null);

  const executeBuy = useCallback(
    async ({
      token,
      quoteIn,
      minTokensOut,
    }: {
      token: TokenData;
      quoteIn: bigint;
      minTokensOut: bigint;
    }) => {
      if (!publicClient || !address) return;

      setState('awaiting_wallet');
      setTxHash(null);
      setResult(null);
      setParsedError(null);

      try {
        // 1. Minta tanda tangan transaksi dari user di wallet (MetaMask)
        const hash = await writeContractAsync({
          address: token.curve,
          abi: BONDING_CURVE_ABI,
          functionName: 'buy',
          args: [quoteIn, minTokensOut, address],
          value: quoteIn,
        });

        // 2. Transaksi terkirim ke mempool, menunggu blok (mining)
        setTxHash(hash);
        setState('pending_tx');

        // 3. Tunggu konfirmasi receipt dari blok
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        if (receipt.status === 'reverted') {
          throw new Error('Transaction was reverted on-chain.');
        }

        // 4. Ekstrak nilai tokensOut dari event CurveBuy pada receipt
        let tokensReceived = minTokensOut; // Fallback jika event tidak ter-decode
        for (const log of receipt.logs) {
          try {
            if (log.address.toLowerCase() === token.curve.toLowerCase()) {
              const decoded = decodeEventLog({
                abi: [CURVE_BUY_EVENT],
                data: log.data,
                topics: log.topics,
              });
              if (decoded.eventName === 'CurveBuy' && decoded.args) {
                tokensReceived = (decoded.args as any).tokensOut as bigint;
                break;
              }
            }
          } catch {
            // log bukan CurveBuy, lanjutkan
          }
        }

        setResult({
          txHash: hash,
          tokensReceived,
          blockNumber: receipt.blockNumber,
        });
        setState('success');

        // Trigger refetch untuk Langkah 8
        if (onSuccessCallback) {
          onSuccessCallback();
        }
      } catch (err: any) {
        console.error('Buy transaction failed:', err);
        const parsed = parseTransactionError(err);
        setParsedError(parsed);

        if (parsed.type === 'rejected') {
          setState('rejected');
        } else {
          setState('error');
        }
      }
    },
    [publicClient, address, writeContractAsync, onSuccessCallback]
  );

  const resetState = useCallback(() => {
    setState('idle');
    setTxHash(null);
    setResult(null);
    setParsedError(null);
  }, []);

  return {
    state,
    txHash,
    result,
    error: parsedError,
    executeBuy,
    resetState,
    isBusy: state === 'awaiting_wallet' || state === 'pending_tx',
  };
}
