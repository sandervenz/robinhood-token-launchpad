import { Address } from 'viem';

export interface TokenLaunchedEvent {
  token: Address;
  curve: Address;
  deployer: Address;
  pairToken: Address;
  launchConfigId: bigint;
  graduationThreshold: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export type TokenPhase = 0 | 1 | 2 | 3;

export interface TokenData extends TokenLaunchedEvent {
  name: string;
  symbol: string;
  logo: string;
  quoteReserve: bigint;
  tokenReserve: bigint;
  realQuoteReserve: bigint;
  phase: TokenPhase;
  feeBps: bigint;
  creatorTaxBps: bigint;
  spotPriceEth: string;
  graduationProgressBps: bigint;
  graduationProgressPercent: number;
}
