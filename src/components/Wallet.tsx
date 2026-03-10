import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider, createStorage } from "wagmi";
import {
  RainbowKitProvider,
  DisclaimerComponent,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { arbitrum, sepolia } from "wagmi/chains";
import { ReactNode } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export const config = getDefaultConfig({
  appName: "myproject",
  projectId: "d6d73254b873a6c64d325465fa9c4a2c",
  chains: [sepolia],
  ssr: false,
  storage: createStorage({
    storage: localStorage,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
    By connecting your wallet, you agree to the{" "}
    <Link href="https://termsofservice.xyz">Terms of Service</Link> and
    acknowledge you have read and understand the protocol{" "}
    <Link href="https://disclaimer.xyz">Disclaimer</Link>
  </Text>
);

export default function Wallet({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "oklch(0.7048 0.1307 9.4806)",
            accentColorForeground: "white",
            borderRadius: "large",
            fontStack: "system",
            overlayBlur: "small",
          })}
          modalSize={"compact"}
          initialChain={sepolia}
          appInfo={{
            appName: "Rainbowkit Demo",
            learnMoreUrl: "https://learnaboutcryptowallets.example",
            disclaimer: Disclaimer,
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
