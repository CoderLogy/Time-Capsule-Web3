import { useEffect, useRef } from 'react';

interface WalletInfo {
  name: string;
  scheme: string;
  uriScheme: string;
  buildDeepLink: (domain: string, fullUrl: string) => string;
}

const WALLET_CONFIGS: WalletInfo[] = [
  {
    name: 'MetaMask',
    scheme: 'https://metamask.app.link',
    uriScheme: 'metamask',
    buildDeepLink: (domain) => `https://metamask.app.link/dapp/${domain}`,
  },
  {
    name: 'Trust Wallet',
    scheme: 'https://link.trustwallet.com',
    uriScheme: 'trust',
    buildDeepLink: (_, fullUrl) => `https://link.trustwallet.com/open_dapp?url=${encodeURIComponent(fullUrl)}`,
  },
  {
    name: 'Coinbase Wallet',
    scheme: 'https://go.cb-w.com',
    uriScheme: 'coinbase',
    buildDeepLink: (_, fullUrl) => `https://go.cb-w.com/dapp?url=${encodeURIComponent(fullUrl)}`,
  },
  {
    name: 'Rainbow',
    scheme: 'https://rnbw.to',
    uriScheme: 'rainbow',
    buildDeepLink: (_, fullUrl) => `https://rnbw.to/dapp?url=${encodeURIComponent(fullUrl)}`,
  },
];

function isMobileDevice(userAgent: string): boolean {
  const mobilePattern = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobilePattern.test(userAgent);
}

function isAlreadyInWallet(userAgent: string): boolean {
  return WALLET_CONFIGS.some((wallet) => userAgent.toLowerCase().includes(wallet.uriScheme));
}

function detectBestWallet(userAgent: string): WalletInfo | null {
  const lowerUA = userAgent.toLowerCase();

  for (const wallet of WALLET_CONFIGS) {
    if (lowerUA.includes(wallet.uriScheme)) {
      return wallet;
    }
  }

  // Default to MetaMask if no specific wallet detected but we're on mobile
  return WALLET_CONFIGS[0];
}

function buildRedirectUrl(wallet: WalletInfo, currentUrl: string): string {
  const domain = currentUrl.replace(/^https?:\/\//, '').split('/')[0];
  return wallet.buildDeepLink(domain, currentUrl);
}

function getSessionKey(domain: string): string {
  return `timecapsule_wallet_redirect_${domain}`;
}

function hasShownPromptRecently(domain: string, hourWindow: number = 24): boolean {
  const key = getSessionKey(domain);
  const lastPromptTime = sessionStorage.getItem(key);

  if (!lastPromptTime) return false;

  const lastTime = parseInt(lastPromptTime, 10);
  const now = Date.now();
  const hourWindowMs = hourWindow * 60 * 60 * 1000;

  return now - lastTime < hourWindowMs;
}

function markPromptShown(domain: string): void {
  const key = getSessionKey(domain);
  sessionStorage.setItem(key, Date.now().toString());
}

export function useMobileWalletDetection(): void {
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Prevent multiple executions in strict mode
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    try {
      const userAgent = navigator.userAgent;
      const currentUrl = window.location.href;
      const domain = currentUrl.replace(/^https?:\/\//, '').split('/')[0];

      // Check conditions for showing prompt
      if (!isMobileDevice(userAgent)) {
        console.log('[MobileWalletDetection] Not a mobile device, skipping');
        return;
      }

      if (isAlreadyInWallet(userAgent)) {
        console.log('[MobileWalletDetection] Already in wallet browser, skipping');
        return;
      }

      if (hasShownPromptRecently(domain)) {
        console.log('[MobileWalletDetection] Prompt shown recently, skipping');
        return;
      }

      const detectedWallet = detectBestWallet(userAgent);

      if (!detectedWallet) {
        console.log('[MobileWalletDetection] No wallet detected');
        return;
      }

      // Show prompt
      const deepLinkUrl = buildRedirectUrl(detectedWallet, currentUrl);

      console.log(`[MobileWalletDetection] Detected ${detectedWallet.name} on mobile, showing prompt`);

      const userConfirmed = window.confirm(
        `For the best experience, open this dApp in ${detectedWallet.name}?\n\nYou'll get better wallet integration and security.`
      );

      if (userConfirmed) {
        console.log(`[MobileWalletDetection] User confirmed, redirecting to ${detectedWallet.name}`);
        markPromptShown(domain);
        window.location.href = deepLinkUrl;
      } else {
        console.log('[MobileWalletDetection] User declined, continuing in browser');
        markPromptShown(domain);
      }
    } catch (error) {
      console.error('[MobileWalletDetection] Error during detection:', error);
    }
  }, []);
}
