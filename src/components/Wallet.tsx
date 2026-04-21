import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider, createStorage, http } from "wagmi";
import {
  RainbowKitProvider,
  DisclaimerComponent,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { ReactNode } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WALLET_CONFIG, BLOCKCHAIN_CONFIG } from "@/lib/config";

// Use Infura RPC for Sepolia - proper public endpoint
const SEPOLIA_RPC_URL = "https://1rpc.io/sepolia";

export const config = getDefaultConfig({
  appName: "myproject",
  projectId: WALLET_CONFIG.walletConnectId,
  chains: [sepolia],
  ssr: false,
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
  storage: createStorage({
    storage: localStorage,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      // Retry on transient network errors but not permanent failures
      retry: (failureCount, error) => {
        // Max 3 retries for transient errors
        if (failureCount >= 3) return false;

        // Don't retry on 4xx client errors (bad request, not found, etc.)
        if (error instanceof Error) {
          const msg = error.message;
          if (msg.includes("4") || msg.includes("401") || msg.includes("403")) {
            return false;
          }
          // Retry on network timeouts and 5xx server errors
          if (msg.includes("timeout") || msg.includes("5")) {
            return true;
          }
        }

        return failureCount < 3;
      },
      // Exponential backoff: 1s, 2s, 4s max
      retryDelay: (attemptIndex) =>
        Math.min(1000 * Math.pow(2, attemptIndex), 4000),
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
