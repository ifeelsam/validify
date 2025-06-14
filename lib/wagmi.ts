import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { metaMask, walletConnect, coinbaseWallet } from '@wagmi/connectors'

// Define Monad Testnet chain
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
      apiUrl: 'https://testnet.monadexplorer.com/api',
    },
  },
  testnet: true,
})

// Create wagmi config
export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    metaMask(),
    // walletConnect({
    //   projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '2c55b8b9e4314e0086c0c3b28e1d5d9a',
    //   metadata: {
    //     name: 'Validify',
    //     description: 'Validate Your Ideas. Get Paid Feedback.',
    //     url: 'https://validify.app',
    //     icons: ['https://validify.app/logo.png'],
    //   },
    // }),
    // coinbaseWallet({
    //   appName: 'Validify',
    //   appLogoUrl: 'https://validify.app/logo.png',
    // }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
}) 