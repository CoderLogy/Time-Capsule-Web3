import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to detect when the app comes to foreground (page becomes visible)
 * Useful for triggering state recovery on mobile context switches
 */
export function useAppVisibility(onVisibilityChange?: (visible: boolean) => void) {
  const visibilityChangeRef = useRef<boolean>(true);

  const handleVisibilityChange = useCallback(() => {
    const isVisible = document.visibilityState === 'visible';

    // Only trigger callback on transition to visible, not on every change
    if (isVisible && !visibilityChangeRef.current) {
      console.log('[AppVisibility] App resumed from background');
      visibilityChangeRef.current = true;
      onVisibilityChange?.(true);
    } else if (!isVisible && visibilityChangeRef.current) {
      console.log('[AppVisibility] App backgrounded');
      visibilityChangeRef.current = false;
      onVisibilityChange?.(false);
    }
  }, [onVisibilityChange]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isVisible: document.visibilityState === 'visible',
  };
}
