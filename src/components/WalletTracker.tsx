import { useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
    trackWalletConnectionStarted,
    trackSignInCompleted,
    trackSignOutCompleted,
    trackAccountCreated,
    setUserProperties
} from "@/lib/amplitude-events";

/**
 * Component to track wallet connection/disconnection events with Amplitude
 * Wraps the application to monitor wallet state changes
 */
export function WalletTracker() {
    const { address, isConnected, chainId, connector } = useAccount();
    const { connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const prevConnectedRef = useRef(isConnected);
    const prevAddressRef = useRef(address);
    const connectionStartedRef = useRef(false);
    const isFirstConnectionRef = useRef(true);

    // Track when wallet is successfully connected
    useEffect(() => {
        if (isConnected && address && !prevConnectedRef.current) {
            const walletProvider = connector?.name || "Unknown";
            const userKey = `user_${address.toLowerCase()}_seen`;
            const isNewUser = !localStorage.getItem(userKey);

            console.log("[WalletTracker] Wallet connected:", {
                address,
                provider: walletProvider,
                chainId,
                isNewUser
            });

            // Mark user as seen
            localStorage.setItem(userKey, "true");

            // Track account creation if new user
            if (isNewUser) {
                try {
                    trackAccountCreated({
                        signupMethod: "wallet_connect",
                        walletAddress: address,
                        walletProvider,
                        chainId
                    });
                } catch (err) {
                    console.error("[WalletTracker] Error tracking account created:", err);
                }
            } else {
                // Track sign-in for returning users
                try {
                    trackSignInCompleted({
                        loginMethod: "wallet_connect",
                        walletProvider,
                        chainId
                    });
                } catch (err) {
                    console.error("[WalletTracker] Error tracking sign-in completed:", err);
                }
            }

            // Set user properties
            try {
                setUserProperties({
                    walletAddress: address,
                    walletProvider,
                    primaryChainId: chainId,
                    signupMethod: isNewUser ? "wallet_connect" : undefined
                });
            } catch (err) {
                console.error("[WalletTracker] Error setting user properties:", err);
            }

            prevConnectedRef.current = true;
            prevAddressRef.current = address;
        } else if (!isConnected && prevConnectedRef.current) {
            // Track disconnection
            const walletProvider = connector?.name || "Unknown";

            console.log("[WalletTracker] Wallet disconnected:", {
                provider: walletProvider
            });

            try {
                trackSignOutCompleted({
                    signOutReason: "user_initiated",
                    walletProvider
                });
            } catch (err) {
                console.error("[WalletTracker] Error tracking sign-out:", err);
            }

            prevConnectedRef.current = false;
            connectionStartedRef.current = false;
            isFirstConnectionRef.current = true;
        }
    }, [isConnected, address, chainId, connector]);

    return null; // This component doesn't render anything
}
