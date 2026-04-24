// WalletGate.tsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import { CustomConnectButton } from "./ui/customConnectButton";
import {
  WALLET_CONFIGS,
  WalletInfo,
  isInsideWalletBrowser,
  isMobileDevice,
  openInWallet,
} from "@/hooks/useMobileWalletDetection";

// ─── Official wallet SVG logos ────────────────────────────────────────────────

const MetaMaskIcon = () => (
  <svg viewBox="0 0 318 318" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <path d="M274.1 35.5L174.6 109.4l19-44.9 80.5-29z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M43.8 35.5l98.6 74.6-18.1-45.7-80.5-28.9zM238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3-46.5-.9zM33.4 207.7l16.2 55.3 56.7-15.6-26.5-40.6-46.4.9z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5-38.5 34.1zM214.3 138.2l-39-34.7-1.3 61.1 56.2-2.5-15.9-23.9zM106.3 247.4l33.8-16.5-29.2-22.8-4.6 39.3zM177.8 230.9l33.9 16.5-4.7-39.3-29.2 22.8z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M211.7 247.4l-33.9-16.5 2.7 22.1-.3 9.3 31.5-14.9zM106.3 247.4l31.5 14.9-.2-9.3 2.5-22.1-33.8 16.5z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M138.2 193.5l-28.2-8.3 19.9-9.1 8.3 17.4zM179.7 193.5l8.3-17.4 20 9.1-28.3 8.3z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M106.3 247.4l4.8-40.6-31.3.9 26.5 39.7zM207 206.8l4.7 40.6 26.5-39.7-31.2-.9zM230.2 162.1l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1 22.7-23.1zM110 185.2l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5 22.8 23.1z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M87.8 162.1l23.6 46-.8-22.9-22.8-23.1zM207.5 185.2l-1 22.9 23.7-46-22.7 23.1zM144.1 164.6l-5.3 28.9 6.6 34.1 1.5-44.9-2.8-18.1zM174 164.6l-2.7 18 1.3 45 6.7-34.1-5.3-28.9z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M179.7 193.5l-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9-28.3 8.3zM110 185.2l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1-28.2-8.3z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M180 262.3l.3-9.3-2.5-2.2h-37.6l-2.4 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9-31.5 14.9z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M177.8 230.9l-4.8-3.3h-27.9l-4.8 3.3-2.5 22.1 2.4-2.2h37.6l2.5 2.2-2.5-22.1z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M278.3 114.2l8.5-40.8-12.8-37.9-97.2 72.1 37.4 31.6 52.8 15.4 11.7-13.6-5-3.6 8-7.3-6.1-4.7 8-6.1-4.3-5.1zM31.2 73.4l8.5 40.8-5.4 4 8.1 6.2-6.1 4.7 8 7.3-5 3.6 11.6 13.6 52.8-15.4 37.4-31.6L43.9 35.5 31.2 73.4z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M267 155.1l-52.8-15.4 15.9 23.9-23.7 46 31.2-.9h46.5l-17.1-53.6zM103.7 139.7L51 155.1 34 208.7h46.4l31.2.9-23.6-46 15.7-23.9zM174 164.6l3.4-58.4 15.5-41.9h-69l15.3 41.9 3.6 58.4 1.3 18.2.1 44.8h27.9l.2-44.8 1.7-18.2z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrustWalletIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <rect width="40" height="40" rx="10" fill="#3375BB"/>
    <path d="M20 8l12 4.8v8c0 6.6-5.1 12.8-12 14.2C13.1 33.6 8 27.4 8 20.8v-8L20 8z" fill="white"/>
    <path d="M16 20.5l3 3 6-6" stroke="#3375BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CoinbaseIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <rect width="40" height="40" rx="10" fill="#1652F0"/>
    <path d="M20 10C14.48 10 10 14.48 10 20s4.48 10 10 10 10-4.48 10-10S25.52 10 20 10zm0 16.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z" fill="white"/>
    <rect x="17" y="17" width="6" height="6" rx="1.5" fill="white"/>
  </svg>
);

const RainbowIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <rect width="40" height="40" rx="10" fill="#174299"/>
    <path d="M8 26c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M11 26c0-4.971 4.029-9 9-9s9 4.029 9 9" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M14 26c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#00D395" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M17 26c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
  </svg>
);

const WALLET_ICON_MAP: Record<string, React.ReactNode> = {
  metamask: <MetaMaskIcon />,
  trust: <TrustWalletIcon />,
  coinbasebrowser: <CoinbaseIcon />,
  rainbow: <RainbowIcon />,
};

// ─── Portal wrapper — only renders after DOM is confirmed ready ───────────────
// This prevents the "vt is not a function" crash during SSR / Vercel prerender.

function ClientPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────

function WalletSheet({
  onClose,
  onContinueInBrowser,
}: {
  onClose: () => void;
  onContinueInBrowser: () => void;
}) {
  return (
    <ClientPortal>
      <div
        className="fixed inset-0 flex items-end justify-center"
        style={{
          zIndex: 9999,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm mx-4 mb-8 rounded-2xl p-5 flex flex-col gap-2"
          style={{
            background: "rgba(22,22,28,0.97)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 -8px 48px rgba(0,0,0,0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-base font-semibold text-white">Open in Wallet</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Use your wallet's browser to connect
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
          </div>

          {/* Wallet rows */}
          {WALLET_CONFIGS.map((wallet) => (
            <button
              key={wallet.uaKey}
              onClick={() => openInWallet(wallet)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.97]"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div className="rounded-xl overflow-hidden shrink-0">
                {WALLET_ICON_MAP[wallet.uaKey]}
              </div>
              <span className="flex-1 text-sm font-medium text-white">
                {wallet.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
            </button>
          ))}

          {/* Continue in browser → swaps to CustomConnectButton */}
          <button
            onClick={onContinueInBrowser}
            className="mt-1 w-full py-2.5 text-xs rounded-xl transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Continue in browser anyway
          </button>
        </div>
      </div>
    </ClientPortal>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type Mode = "gate" | "sheet" | "connect";

export function WalletGate() {
  const [mode, setMode] = useState<Mode>("gate");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until client-side — avoids SSR mismatch
  if (!isMounted) return null;

  // Inside wallet browser or desktop → straight to connect button
  if (isInsideWalletBrowser() || !isMobileDevice() || mode === "connect") {
    return <CustomConnectButton />;
  }

  return (
    <>
      <button
        onClick={() => setMode("sheet")}
        className="
          flex items-center gap-2 px-3 py-2
          rounded-xl bg-slate-400/30
          hover:bg-slate-400/45 active:scale-95
          transition-all duration-150 ease-out
          text-sm font-medium text-foreground
          cursor-pointer shrink-0
        "
      >
        <span>Connect Now</span>
        <ExternalLink className="w-4 h-4" />
      </button>

      {mode === "sheet" && (
        <WalletSheet
          onClose={() => setMode("gate")}
          onContinueInBrowser={() => setMode("connect")}
        />
      )}
    </>
  );
}