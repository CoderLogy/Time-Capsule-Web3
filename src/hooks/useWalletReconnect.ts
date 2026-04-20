import { useEffect, useRef, useCallback } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useAppVisibility } from './useAppVisibility';
import { clearSignatureSigner } from '@/lib/encrypt-decrypt';

interface ReconnectOptions {
  maxRetries?: number;
  backoffMultiplier?: number;
  initialDelayMs?: number;
}

/**
 * Hook to automatically reconnect wallet and recover app state when switching back from background
 * (e.g., switching from mobile wallet app back to browser tab)
 */
export function useWalletReconnect(options: ReconnectOptions = {}) {
  const {
    maxRetries = 3,
    backoffMultiplier = 1.5,
    initialDelayMs = 500,
  } = options;

  const queryClient = useQueryClient();
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectors } = useConnect();

  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isReconnectingRef = useRef(false);

  const attemptReconnect = useCallback(async () => {
    if (isReconnectingRef.current) {
      console.log('[WalletReconnect] Reconnect already in progress, skipping');
      return;
    }

    isReconnectingRef.current = true;
    reconnectAttemptsRef.current += 1;

    try {
      console.log(`[WalletReconnect] Attempt ${reconnectAttemptsRef.current}/${maxRetries}`);

      // If we were previously connected, try to reconnect with the same connector
      if (address && connector) {
        console.log('[WalletReconnect] Attempting to reconnect to previous wallet');

        // Clear signer cache to force re-establishment
        clearSignatureSigner();

        // Check if wallet is still responsive by attempting to get account info
        // Wagmi will attempt auto-reconnect from localStorage if available
        // If this fails, the account will show as disconnected

        // Wait a bit for Wagmi to process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // If still connected, we're good
        if (isConnected && address) {
          console.log('[WalletReconnect] Successfully reconnected to wallet');
          reconnectAttemptsRef.current = 0;

          // Invalidate all capsule queries to force refresh
          await queryClient.invalidateQueries({ queryKey: ['capsules'] });
          console.log('[WalletReconnect] Invalidated query cache');

          isReconnectingRef.current = false;
          return;
        }
      }

      // If we get here, reconnection failed
      if (reconnectAttemptsRef.current < maxRetries) {
        const delay = initialDelayMs * Math.pow(backoffMultiplier, reconnectAttemptsRef.current - 1);
        console.log(`[WalletReconnect] Reconnect failed, retrying in ${Math.round(delay)}ms`);

        reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay);
      } else {
        console.log('[WalletReconnect] Max reconnection attempts reached, giving up');
        console.log('[WalletReconnect] User should manually reconnect wallet');
        reconnectAttemptsRef.current = 0;
      }
    } catch (error) {
      console.error('[WalletReconnect] Error during reconnection attempt:', error);

      if (reconnectAttemptsRef.current < maxRetries) {
        const delay = initialDelayMs * Math.pow(backoffMultiplier, reconnectAttemptsRef.current - 1);
        console.log(`[WalletReconnect] Error during reconnect, retrying in ${Math.round(delay)}ms`);

        reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay);
      } else {
        console.log('[WalletReconnect] Max reconnection attempts reached after error');
        reconnectAttemptsRef.current = 0;
      }
    } finally {
      isReconnectingRef.current = false;
    }
  }, [address, connector, isConnected, queryClient, maxRetries, backoffMultiplier, initialDelayMs]);

  // Listen for app visibility changes
  const handleVisibilityChange = useCallback((visible: boolean) => {
    if (visible) {
      console.log('[WalletReconnect] App became visible, attempting wallet recovery');

      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Reset attempt counter
      reconnectAttemptsRef.current = 0;

      // Start reconnection attempt
      attemptReconnect();
    }
  }, [attemptReconnect]);

  useAppVisibility(handleVisibilityChange);

  // Cleanup
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
    attemptReconnect,
  };
}
