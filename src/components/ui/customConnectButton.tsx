import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LogIn } from 'lucide-react'; // or wherever your icon comes from
import { Button } from '@/components/ui/button'; // adjust path

export function CustomConnectButton() {
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

                // ❌ Not connected → Sign in
                if (!connected) {
                    return (
                        <Button
                            onClick={openConnectModal}
                            className="bg-primary text-white text-sm rounded-lg px-4 py-1 md:rounded-full md:py-2 hover:bg-primary/80 transition cursor-pointer"
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
                        className="bg-primary text-white text-sm rounded-lg px-4 py-1 md:rounded-full md:py-2 hover:bg-primary/80 transition"
                    >
                        <div className="flex items-center gap-3">
                            <span className="hidden md:block">
                                {account.displayName}
                            </span>
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
