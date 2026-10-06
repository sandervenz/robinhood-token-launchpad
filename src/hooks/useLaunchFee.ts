'use client';

import { useReadContract } from 'wagmi';
import { LAUNCH_FACTORY_ADDRESS, LAUNCH_FACTORY_ABI } from '@/config/contracts';
import { robinhoodTestnet } from '@/config/chain';
import { formatEther } from 'viem';

export function useLaunchFee() {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: LAUNCH_FACTORY_ADDRESS,
    abi: LAUNCH_FACTORY_ABI,
    functionName: 'launchFee',
    chainId: robinhoodTestnet.id,
  });

  const feeWei = typeof data === 'bigint' ? data : BigInt(0);
  const feeFormatted = data ? formatEther(feeWei) : '0';

  return {
    feeWei,
    feeFormatted,
    isLoading,
    isError,
    error,
    refetch,
  };
}
