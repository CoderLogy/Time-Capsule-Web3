import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, DisclaimerComponent} from '@rainbow-me/rainbowkit';
import {arbitrum,sepolia} from 'wagmi/chains';
import { ReactNode } from 'react';
import { QueryClientProvider, QueryClient} from "@tanstack/react-query";

const config = getDefaultConfig({
    appName: 'myproject',
    projectId: '501d84a519fa4c7147c0dcbe4e412f20',
    chains: [arbitrum, sepolia],
    ssr: false, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();
const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
    <Text>
        By connecting your wallet, you agree to the{' '}
        <Link href="https://termsofservice.xyz">Terms of Service</Link> and
        acknowledge you have read and understand the protocol{' '}
        <Link href="https://disclaimer.xyz">Disclaimer</Link>
    </Text>
);

export default function Wallet({children}:{children: ReactNode}) {
  return (
      <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
              <RainbowKitProvider modalSize={"compact"} initialChain={sepolia} appInfo={{
                  appName: 'Rainbowkit Demo', learnMoreUrl: 'https://learnaboutcryptowallets.example', disclaimer: Disclaimer}}>
              {children}
              </RainbowKitProvider>
        </QueryClientProvider>      
    </WagmiProvider>
  )
}

