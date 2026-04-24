// Wallet.tsx
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider, createStorage, http, noopStorage } from "wagmi";
import {
  RainbowKitProvider,
  DisclaimerComponent,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { ReactNode } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WALLET_CONFIG } from "@/lib/config";

const SEPOLIA_RPC_URL = "https://1rpc.io/sepolia";

// ✅ Use wagmi's built-in noopStorage as SSR fallback — this is the
//    officially recommended pattern from wagmi docs.
//    localStorage is only accessed after confirming window exists.
export const config = getDefaultConfig({
  appName: "Time Capsule",
  projectId: WALLET_CONFIG.walletConnectId,
  chains: [sepolia],
  ssr: false,
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
  storage: createStorage({
    storage:
      typeof window !== "undefined" && window.localStorage
        ? window.localStorage
        : noopStorage,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        if (error instanceof Error) {
          const msg = error.message;
          if (msg.includes("401") || msg.includes("403")) return false;
          if (msg.includes("timeout") || msg.includes("500")) return true;
        }
        return failureCount < 3;
      },
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
          modalSize="compact"
          initialChain={sepolia}
          appInfo={{
            appName: "Time Capsule",
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