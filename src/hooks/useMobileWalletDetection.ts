import { useEffect, useRef } from "react";

export interface WalletInfo {
    name: string;
    uaKey: string;
    buildDeepLink: (fullUrl: string) => string;
    iosInstallUrl: string;
    androidInstallUrl: string;
}

export const WALLET_CONFIGS: WalletInfo[] = [
    {
        name: "MetaMask",
        uaKey: "metamask",
        buildDeepLink: (fullUrl) => {
            // MetaMask universal link correct format:
            const stripped = fullUrl.replace(/^https?:\/\//, "");
            return `https://metamask.app.link/dapp/${stripped}`;
        },
        iosInstallUrl: "https://apps.apple.com/app/metamask/id1438144202",
        androidInstallUrl: "https://play.google.com/store/apps/details?id=io.metamask"
    },
    {
        name: "Trust Wallet",
        uaKey: "trust",
        buildDeepLink: (fullUrl) => {
            const encoded = encodeURIComponent(fullUrl);
            return `https://link.trustwallet.com/open_dapp?url=${encoded}`;
        },
        iosInstallUrl: "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409",
        androidInstallUrl:
            "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp"
    },
    {
        name: "Coinbase Wallet",
        uaKey: "coinbasebrowser",
        buildDeepLink: (fullUrl) => {
            const encoded = encodeURIComponent(fullUrl);
            return `https://go.cb-w.com/dapp?url=${encoded}`;
        },
        iosInstallUrl: "https://apps.apple.com/app/coinbase-wallet/id1278383455",
        androidInstallUrl: "https://play.google.com/store/apps/details?id=org.toshi"
    },
    {
        name: "Rainbow",
        uaKey: "rainbow",
        buildDeepLink: (fullUrl) => {
            const encoded = encodeURIComponent(fullUrl);
            return `https://rnbw.to/dapp?url=${encoded}`;
        },
        iosInstallUrl: "https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021",
        androidInstallUrl: "https://play.google.com/store/apps/details?id=me.rainbow"
    }
];

export function isInsideWalletBrowser(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    return WALLET_CONFIGS.some((w) => ua.includes(w.uaKey));
}

export function isMobileDevice(): boolean {
    if (typeof navigator === "undefined") return false;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent
    );
}

//This is the most reliable way to trigger deep link switching across android and ios at the moment.
export function openInWallet(wallet: WalletInfo): void {
    const currentUrl = window.location.href;
    const deepLink = wallet.buildDeepLink(currentUrl);

    console.log(`[WalletGate] Opening ${wallet.name} with:`, deepLink);

    window.location.href = deepLink;

    // Fallback to app store if app didn't open
    const timer = setTimeout(() => {
        if (!document.hidden) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            window.location.href = isIOS ? wallet.iosInstallUrl : wallet.androidInstallUrl;
        }
    }, 2000);

    document.addEventListener(
        "visibilitychange",
        () => {
            if (document.hidden) clearTimeout(timer);
        },
        { once: true }
    );
}

export function useMobileWalletDetection(): {
    isInsideWallet: boolean;
    isMobile: boolean;
} {
    const hasRunRef = useRef(false);

    useEffect(() => {
        if (hasRunRef.current) return;
        hasRunRef.current = true;
    }, []);

    return {
        isInsideWallet: isInsideWalletBrowser(),
        isMobile: isMobileDevice()
    };
}
