import { useEffect, useRef } from "react";

interface WalletInfo {
    name: string;
    scheme: string;
    uriScheme: string;
    buildDeepLink: (domain: string, fullUrl: string) => string;
}

const WALLET_CONFIGS: WalletInfo[] = [
    {
        name: "MetaMask",
        scheme: "https://metamask.app.link",
        uriScheme: "metamask",
        buildDeepLink: (_, fullUrl) => {
            // iOS prefers the URI scheme, Android prefers the universal link
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
                return `metamask://dapp/${encodeURIComponent(fullUrl)}`;
            }
            return `https://metamask.app.link/dapp/?url=${encodeURIComponent(fullUrl)}`;
        }
    },
    {
        name: "Trust Wallet",
        scheme: "https://link.trustwallet.com",
        uriScheme: "trust",
        buildDeepLink: (_, fullUrl) => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
                return `trust://open_dapp?url=${encodeURIComponent(fullUrl)}`;
            }
            return `https://link.trustwallet.com/open_dapp?url=${encodeURIComponent(fullUrl)}`;
        }
    },
    {
        name: "Coinbase Wallet",
        scheme: "https://go.cb-w.com",
        uriScheme: "coinbase",
        buildDeepLink: (_, fullUrl) => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
                return `cbwallet://dapp/${encodeURIComponent(fullUrl)}`;
            }
            return `https://go.cb-w.com/dapp?url=${encodeURIComponent(fullUrl)}`;
        }
    },
    {
        name: "Rainbow",
        scheme: "https://rnbw.to",
        uriScheme: "rainbow",
        buildDeepLink: (_, fullUrl) => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
                return `rainbow://open?url=${encodeURIComponent(fullUrl)}`;
            }
            return `https://rnbw.to/dapp?url=${encodeURIComponent(fullUrl)}`;
        }
    }
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
    const domain = currentUrl.replace(/^https?:\/\//, "").split("/")[0];
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
            const domain = currentUrl.replace(/^https?:\/\//, "").split("/")[0];

            // Check conditions for showing prompt
            if (!isMobileDevice(userAgent)) {
                console.log("[MobileWalletDetection] Not a mobile device, skipping");
                return;
            }

            if (isAlreadyInWallet(userAgent)) {
                console.log("[MobileWalletDetection] Already in wallet browser, skipping");
                return;
            }

            if (hasShownPromptRecently(domain)) {
                console.log("[MobileWalletDetection] Prompt shown recently, skipping");
                return;
            }

            // On iOS, always offer wallet options. On Android, detect if user agent hints at a wallet
            const isIOS = /iPad|iPhone|iPod/.test(userAgent);
            const detectedWallet = isIOS ? WALLET_CONFIGS[0] : detectBestWallet(userAgent);

            if (!detectedWallet) {
                console.log("[MobileWalletDetection] No wallet detected");
                return;
            }

            console.log(
                `[MobileWalletDetection] ${isIOS ? "iOS" : "Mobile"} device detected, showing prompt for ${detectedWallet.name}`
            );

            // Build wallet options message
            const walletList = WALLET_CONFIGS.map((w, i) => `${i + 1}. ${w.name}`).join("\n");
            const userChoice = window.prompt(
                `Open this dApp in a wallet browser?\n\nSelect wallet number:\n${walletList}\n\n(Or cancel to continue in browser)`,
                "1"
            );

            markPromptShown(domain);

            if (userChoice) {
                const selectedIndex = parseInt(userChoice, 10) - 1;
                if (selectedIndex >= 0 && selectedIndex < WALLET_CONFIGS.length) {
                    const selectedWallet = WALLET_CONFIGS[selectedIndex];
                    const deepLinkUrl = buildRedirectUrl(selectedWallet, currentUrl);
                    console.log(
                        `[MobileWalletDetection] User selected ${selectedWallet.name}, redirecting...`
                    );
                    window.location.href = deepLinkUrl;
                } else {
                    console.log("[MobileWalletDetection] Invalid selection, continuing in browser");
                }
            } else {
                console.log("[MobileWalletDetection] User cancelled, continuing in browser");
            }
        } catch (error) {
            console.error("[MobileWalletDetection] Error during detection:", error);
        }
    }, []);
}
