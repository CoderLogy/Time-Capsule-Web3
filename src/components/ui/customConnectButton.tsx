import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletReconnect } from "@/hooks/useWalletReconnect";

export function CustomConnectButton() {
  const { isReconnecting } = useWalletReconnect();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <Button disabled className="opacity-50">
              Loading...
            </Button>
          );
        }

        // 🔄 Reconnecting after background app switch
        if (isReconnecting) {
          return (
            <Button disabled className="opacity-70">
              <div className="flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                <h2>Reconnecting...</h2>
              </div>
            </Button>
          );
        }

        // ❌ Not connected → Sign in
        if (!connected) {
          return (
            <Button
              onClick={openConnectModal}
              className="border-primary bg-transparent text-foreground text-sm rounded-xl px-2 md:px-4 py-1 md:py-2 active:scale-90 hover:text-white hover:bg-primary/80 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LogIn />
                <h2>Sign in</h2>
              </div>
            </Button>
          );
        }

        // ⚠ Wrong network
        if (chain.unsupported) {
          return (
            <Button
              onClick={openChainModal}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Wrong Network
            </Button>
          );
        }

        // ✅ Connected
        return (
          <Button
            onClick={openAccountModal}
            className="border-primary/80 bg-slate-400/15 text-primary text-xs rounded-xl px-4 sm:py-1 md:px-4 py-4 hover:bg-primary/80 active:scale-95 hover:text-white transition-all cursor-pointer ease-linear duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="hidden md:block">{account.displayName}</span>
              <span className="md:hidden">
                {account.displayName?.slice(0, 6)}…
              </span>
            </div>
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}

