'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { Address, parseAbiItem, decodeEventLog, parseEther, keccak256, toHex } from 'viem';
import { LAUNCH_FACTORY_ADDRESS, LAUNCH_FACTORY_ABI } from '@/config/contracts';
import { parseTransactionError, ParsedTxError } from '@/lib/errorParser';
import { useTokens } from '@/context/TokenContext';

const TOKEN_LAUNCHED_EVENT = parseAbiItem(
  'event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)'
);

export type LaunchLifecycleState =
  | 'idle'
  | 'awaiting_wallet'
  | 'pending_tx'
  | 'success'
  | 'rejected'
  | 'error';

export interface LaunchResult {
  txHash: `0x${string}`;
  tokenAddress: Address;
  curveAddress: Address;
  name: string;
  symbol: string;
}

export function useLaunchToken(onSuccessCallback?: () => void) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { refetchTokens } = useTokens();

  const [state, setState] = useState<LaunchLifecycleState>('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);
  const [parsedError, setParsedError] = useState<ParsedTxError | null>(null);

  const executeLaunch = useCallback(
    async ({
      name,
      symbol,
      description = '',
      logo = '',
    }: {
      name: string;
      symbol: string;
      description?: string;
      logo?: string;
    }) => {
      if (!publicClient || !address) return;

      setState('awaiting_wallet');
      setTxHash(null);
      setResult(null);
      setParsedError(null);

      try {
        // 1. Generate salt unik
        const randomSeed = `${Date.now()}_${Math.random()}_${address}`;
        const salt = keccak256(toHex(randomSeed));

        // 2. Format TokenParams
        const params = {
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          logo: logo.trim(),
          description: description.trim(),
          socials: {
            twitter: '',
            telegram: '',
            discord: '',
            website: '',
            farcaster: '',
          },
          creatorFeeRecipient: '0x0000000000000000000000000000000000000000' as Address,
          creatorTaxBps: 0,
          buybackEnabled: false,
          expectedEconomics: '0x416423331ca6d9743485ce8245e1e90c61c04176b119bc0224ad64d76cd7537e' as `0x${string}`,
          salt,
        };

        // 3. Kirim transaksi ke LaunchFactory on-chain
        const hash = await writeContractAsync({
          address: LAUNCH_FACTORY_ADDRESS,
          abi: LAUNCH_FACTORY_ABI,
          functionName: 'launchToken',
          args: [params, BigInt(1), '0x0000000000000000000000000000000000000000'],
          value: parseEther('0.0005'), // launchFee 0.0005 ETH
        });

        setTxHash(hash);
        setState('pending_tx');

        // 4. Tunggu blok receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        if (receipt.status === 'reverted') {
          throw new Error('Transaction was reverted on-chain.');
        }

        // 5. Ekstrak TokenLaunched event
        let tokenAddress: Address = '0x0000000000000000000000000000000000000000';
        let curveAddress: Address = '0x0000000000000000000000000000000000000000';

        for (const log of receipt.logs) {
          try {
            if (log.address.toLowerCase() === LAUNCH_FACTORY_ADDRESS.toLowerCase()) {
              const decoded = decodeEventLog({
                abi: [TOKEN_LAUNCHED_EVENT],
                data: log.data,
                topics: log.topics,
              });
              if (decoded.eventName === 'TokenLaunched' && decoded.args) {
                tokenAddress = (decoded.args as any).token as Address;
                curveAddress = (decoded.args as any).curve as Address;
                break;
              }
            }
          } catch {
            // Abaikan log lain
          }
        }

        setResult({
          txHash: hash,
          tokenAddress,
          curveAddress,
          name: params.name,
          symbol: params.symbol,
        });
        setState('success');

        // 6. Refresh token list seketika
        await refetchTokens();
        if (onSuccessCallback) {
          onSuccessCallback();
        }
      } catch (err: any) {
        console.error('Launch token error:', err);
        const parsed = parseTransactionError(err);
        setParsedError(parsed);

        if (parsed.type === 'rejected') {
          setState('rejected');
        } else {
          setState('error');
        }
      }
    },
    [publicClient, address, writeContractAsync, refetchTokens, onSuccessCallback]
  );

  const reset = useCallback(() => {
    setState('idle');
    setTxHash(null);
    setResult(null);
    setParsedError(null);
  }, []);

  return {
    state,
    txHash,
    result,
    parsedError,
    executeLaunch,
    reset,
    isIdle: state === 'idle',
    isAwaitingWallet: state === 'awaiting_wallet',
    isPendingTx: state === 'pending_tx',
    isSuccess: state === 'success',
    isRejected: state === 'rejected',
    isError: state === 'error',
  };
}
