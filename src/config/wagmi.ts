import { http, createConfig } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';
import { robinhoodTestnet } from './chain';

export const config = createConfig({
  chains: [robinhoodTestnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Cointinental Launchpad',
        url: 'http://localhost:3000',
      },
    }),
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
