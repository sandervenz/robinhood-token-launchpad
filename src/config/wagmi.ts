import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { robinhoodTestnet } from './chain';

export const config = createConfig({
  chains: [robinhoodTestnet],
  connectors: [
    injected({ target: 'metaMask' }),
    injected(),
  ],
  transports: {
    [robinhoodTestnet.id]: http('https://robinhood-sepolia-rpc.publicnode.com'),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
