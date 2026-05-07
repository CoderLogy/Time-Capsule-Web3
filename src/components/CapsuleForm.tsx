import { memo, useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/date-picker";
import { Fuel } from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { createEncryptedCapsule } from "@/lib/createEncryptedCapsule";
import { toast } from "sonner";
import React from "react";
import { getEthPrice } from "@/lib/api-client";
import { BLOCKCHAIN_CONFIG } from "@/lib/config";
import { getTotalCapsuleCost } from "@/lib/contract-api";
import {
  trackCapsuleCreated,
  trackErrorEncountered,
  trackTransactionSubmitted,
  trackTransactionConfirmed,
  setUserProperties,
} from "@/lib/amplitude-events";

interface CapsuleFormProps {
    onPendingAdd: (title: string) => void;
    onPendingRemove: (title: string) => void;
    onCreated: () => Promise<unknown>;
    cardsContainerRef: React.RefObject<HTMLDivElement | null>;
}

const CapsuleForm = memo(function CapsuleForm({
    onPendingAdd,
    onPendingRemove,
    onCreated,
    cardsContainerRef
}: CapsuleFormProps) {
    const { address, isConnected } = useAccount();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [unlockDate, setUnlockDate] = useState<Date | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [dateResetKey, setDateResetKey] = useState(0);
    const [ethPrice, setEthPrice] = useState<number | null>(null);
    const [costData, setCostData] = useState<any>(null);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const priceData = await getEthPrice();
                setEthPrice(priceData.price);
            } catch (err) {
            }
        };

        fetchPrice();
    }, []);

    useEffect(() => {
        if (!isConnected) return;

        const fetchCost = async () => {
            try {
                const cost = await getTotalCapsuleCost();
                setCostData(cost);
            } catch (err) {
            }
        };

        fetchCost();

        // Refresh cost every 15 seconds
        const interval = setInterval(fetchCost, 15000);
        return () => clearInterval(interval);
    }, [isConnected]);

    const totalFeeInEth = useMemo(() => {
        if (!costData?.totalCost) return undefined;

        try {
            return Number(formatEther(costData.totalCost.toString()));
        } catch (err) {
            return undefined;
        }
    }, [costData]);

    const handleCreateCapsule = async () => {
        if (!title) return toast.warning("Provide title to your capsule!");
        if (!unlockDate) return toast.warning("Select unlock date");
        if (!message) return toast.warning("Enter a new message!");
        if (!isConnected) {
            toast.error("Wallet not connected - please reconnect");
            return;
        }

        const currentTitle = title;
        setLoading(true);
        onPendingAdd(currentTitle);

        try {
            const timestamp = Math.floor(unlockDate.getTime() / 1000);
            const result = await createEncryptedCapsule({
                address: address!,
                plaintext: message,
                unlockDate: timestamp,
                title
            });

            try {
              if (result?.hash) {
                trackTransactionSubmitted({
                  capsuleId: `${address}-${Date.now()}`,
                  transactionHash: result.hash,
                  chainId: BLOCKCHAIN_CONFIG.chainId,
                  walletAddress: address!,
                  gasFeesNative: result.gasLimit ? formatEther(result.gasLimit) : undefined,
                });

                const receipt = await result.wait();
                if (receipt) {
                  trackTransactionConfirmed({
                    capsuleId: `${address}-${Date.now()}`,
                    transactionHash: result.hash,
                    chainId: BLOCKCHAIN_CONFIG.chainId,
                  });
                }

                const capsuleId = result.hash || `${address}-${Date.now()}`;
                trackCapsuleCreated({
                  capsuleId,
                  capsuleUnlockDate: unlockDate.toISOString(),
                  capsuleVisibility: 'private',
                  walletAddress: address!,
                });

                setUserProperties({
                  hasCreatedCapsule: true,
                  firstCapsuleCreatedAt: new Date().toISOString(),
                });
              }
            } catch (err) {
              console.error("[CapsuleForm] Analytics tracking failed:", err);
            }

            await onCreated();

            toast.success("Capsule created successfully");

            setTitle("");
            setMessage("");
            setUnlockDate(undefined);
            setDateResetKey((k) => k + 1);

            setTimeout(() => {
                const container = cardsContainerRef.current;
                if (!container) return;
                const target = container.querySelector(`[data-capsule-title="${currentTitle}"]`);
                if (!target) return;
                (target as HTMLElement).scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }, 500);
        } catch (err) {
            try {
              trackErrorEncountered({
                errorCategory: 'capsule_creation',
                errorMessage: err instanceof Error ? err.message : String(err),
                errorContext: 'capsule_form_creation',
                chainId: BLOCKCHAIN_CONFIG.chainId,
              });
            } catch (trackErr) {
              console.error("[CapsuleForm] Error tracking failed:", trackErr);
            }

            toast.error("Failed to create capsule - your data is preserved");
        } finally {
            setLoading(false);
            onPendingRemove(currentTitle);
        }
    };

    return (
        <div className="bg-white/80 my-4 rounded-2xl p-5 lg:my-8 md:p-8 relative z-10">
            {/* Header */}
            <div className={`flex items-center whitespace-nowrap justify-between mb-8 ${!isConnected ? "select-none pointer-events-none opacity-50 blur-[1.8px]" : ""}`}>
                <div>
                    <h2
                        className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2"
                        style={{ fontFamily: "Raleway Variable", fontWeight: "600" }}
                    >
                        New Capsule
                    </h2>
                    <p className="text-xs md:text-sm">Seal a message on the blockchain.</p>
                </div>
                <Button
                    onClick={handleCreateCapsule}
                    disabled={loading}
                    className="h-8 w-auto mb-4 mx-2 rounded-full contrast-110 cursor-pointer hover:bg-accent/90 bg-accent flex items-center justify-center active:scale-90 active:translate-y-1 ease-linear duration-200 transition-all border border-primary/40"
                    style={{ boxShadow: "0 5px 0 0px #BD2E2ECC" }}
                >
                    <span className="text-white text-sm">Create & Seal</span>
                </Button>
            </div>

            <div
                className={`flex justify-around items-center w-full text-xs md:text-sm gap-1 ${
                    !isConnected ? "select-none pointer-events-none blur-[3px]" : ""
                }`} //status bar
            >
                <div className="bg-background/60 shadow-inner flex items-center h-8 px-4 py-2 rounded-full">
                    <span className="relative flex items-center justify-center h-2.5 w-2.5 sm:h-3 sm:w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                    </span>
                    {BLOCKCHAIN_CONFIG.chainName} Connected
                </div>
                <div className="h-8 w-full max-w-48 flex gap-2 items-center justify-center bg-gray-200/70 shadow-inner rounded-full group relative">
                    <Fuel className="text-gray-500 h-5" />
                    <span>
                        ≈ {totalFeeInEth ? Number(totalFeeInEth).toFixed(6) : "..."} ETH{" "}
                        <span className="m-0 text-xs text-gray-600">
                            {totalFeeInEth && ethPrice
                                ? `($${(Number(totalFeeInEth) * ethPrice).toFixed(2)})`
                                : "($...)"}
                        </span>
                    </span>

                    {costData && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                            <div>Capsule: {formatEther(costData.capsuleFee?.toString() || "0")} ETH</div>
                            <div>Gas: {formatEther(costData.gasCost?.toString() || "0")} ETH</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Wallet blured overlay */}
            {!isConnected && (
                <div className="absolute inset-0 md:bottom-35 sm:bottom-40 bottom-50 flex items-center justify-center z-50">
                    <span className="text-xl md:text-2xl font-bold">🔒Signin with wallet!</span>
                </div>
            )}

            {/* Form fields */}
            <div
                className={`px-4 py-4 md:py-5 lg:py-8 ${
                    !isConnected
                        ? "mt-8 select-none pointer-events-none opacity-50 blur-[1.8px]"
                        : ""
                }`}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 resize-none">
                    <div>
                        <Label
                            htmlFor="CapsuleTitle"
                            className="text-xs mb-1.5 ml-2 tracking-wider"
                        >
                            Title
                        </Label>
                        <Input
                            id="CapsuleTitle"
                            type="text"
                            placeholder="Eleanor Rigby"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                            className="text-sm h-12 rounded-xl border focus:border-2 border-gray-300 shadow-sm w-full focus:scale-102 placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <Label
                            htmlFor="CapsuleDatePicker"
                            className="text-xs mb-1.5 ml-2 tracking-wide"
                        >
                            Unlock Date
                        </Label>
                        <DatePicker
                            value={unlockDate}
                            key={dateResetKey}
                            onChange={(date) => setUnlockDate(date)}
                            disabled={loading}
                            buttonClassName="hover:bg-transparent bg-transparent border-gray-300! shadow-md rounded-xl h-12 focus:scale-102 active:scale-102"
                        />
                    </div>

                    <div className="col-span-0 sm:col-span-2">
                        <Label
                            htmlFor="CapsuleMessage"
                            className="text-xs mb-1.5 ml-2 tracking-wider"
                        >
                            Messages
                        </Label>
                        <Textarea
                            id="CapsuleMessage"
                            placeholder="Create a message for future self..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={loading}
                            className="h-32 text-sm rounded-xl border focus:border-2 border-gray-300 shadow-sm w-full px-4 py-3 overflow-auto resize-none focus:scale-102 placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CapsuleForm;
