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

// Auto-reconnect wallet and recover state when switching back from background
export function useWalletReconnect(options: ReconnectOptions = {}) {
  const {
    maxRetries = 3,
    backoffMultiplier = 1.3,  
    initialDelayMs = 2000,    
  } = options;

  const queryClient = useQueryClient();
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectors } = useConnect();

  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isReconnectingRef = useRef<boolean>(false);

  const attemptReconnect = useCallback(async () => {
    if (isReconnectingRef.current) {
      console.log('[WalletReconnect] Reconnect already in progress, skipping');
      return;
    }

    isReconnectingRef.current = true;
    reconnectAttemptsRef.current += 1;

    try {
      console.log(`[WalletReconnect] Attempt ${reconnectAttemptsRef.current}/${maxRetries}`);

      if (address && connector) {
        console.log('[WalletReconnect] Attempting to reconnect to previous wallet');

        // Clear signer cache to force re-establishment
        clearSignatureSigner();

        
        await new Promise(resolve => setTimeout(resolve, 2000));

        
        if (isConnected && address) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        
        if (isConnected && address) {
          console.log('[WalletReconnect] Successfully reconnected to wallet');
          reconnectAttemptsRef.current = 0;

          // Invalidate all capsule queries to force refresh
          await queryClient.invalidateQueries({ queryKey: ['capsules'] });
          console.log('[WalletReconnect] Invalidated query cache');

          isReconnectingRef.current = false;
          return;
        } else {
          console.log('[WalletReconnect] Connection still not ready after stability check');
        }
      }

      // reconnection failed
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

      reconnectAttemptsRef.current = 0;

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
