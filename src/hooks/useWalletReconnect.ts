import { useEffect, useRef, useCallback } from "react";
import { useAccount, useDisconnect, useConnect } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useAppVisibility } from "./useAppVisibility";
import { clearSignatureSigner } from "@/lib/encrypt-decrypt";

interface ReconnectOptions {
    maxRetries?: number;
    backoffMultiplier?: number;
    initialDelayMs?: number;
}

// Auto-reconnect wallet and recover state when switching back from background
export function useWalletReconnect(options: ReconnectOptions = {}) {
    const { maxRetries = 3, backoffMultiplier = 1.3, initialDelayMs = 2000 } = options;

    const queryClient = useQueryClient();
    const { address, isConnected, connector } = useAccount();
    const { disconnect } = useDisconnect();
    const { connectors } = useConnect();

    const reconnectAttemptsRef = useRef<number>(0);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isReconnectingRef = useRef<boolean>(false);

    const attemptReconnect = useCallback(async () => {
        if (isReconnectingRef.current) {
            return;
        }

        isReconnectingRef.current = true;
        reconnectAttemptsRef.current += 1;

        try {
            if (address && connector) {
                clearSignatureSigner();

                await new Promise((resolve) => setTimeout(resolve, 2000));

                if (isConnected && address) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }

                if (isConnected && address) {
                    // Invalidate all capsule queries to force refresh
                    await queryClient.invalidateQueries({ queryKey: ["capsules"] });

                    isReconnectingRef.current = false;
                    return;
                } else {
                }
            }

            // reconnection failed
            if (reconnectAttemptsRef.current < maxRetries) {
                const delay =
                    initialDelayMs * Math.pow(backoffMultiplier, reconnectAttemptsRef.current - 1);

                reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay);
            } else {
                reconnectAttemptsRef.current = 0;
            }
        } catch (error) {
            if (reconnectAttemptsRef.current < maxRetries) {
                const delay =
                    initialDelayMs * Math.pow(backoffMultiplier, reconnectAttemptsRef.current - 1);

                reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay);
            } else {
                reconnectAttemptsRef.current = 0;
            }
        } finally {
            isReconnectingRef.current = false;
        }
    }, [
        address,
        connector,
        isConnected,
        queryClient,
        maxRetries,
        backoffMultiplier,
        initialDelayMs
    ]);

    const handleVisibilityChange = useCallback(
        (visible: boolean) => {
            if (visible) {
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }

                reconnectAttemptsRef.current = 0;

                attemptReconnect();
            }
        },
        [attemptReconnect]
    );

    useAppVisibility(handleVisibilityChange);

    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    return {
        isReconnecting: isReconnectingRef.current,
        reconnectAttempts: reconnectAttemptsRef.current,
        attemptReconnect
    };
}
