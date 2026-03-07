import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/date-picker";
import { Fuel } from "lucide-react";
import { useEstimateGas, useEstimateFeesPerGas, useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { createEncryptedCapsule } from "@/lib/createEncryptedCapsule";
import { toast } from "sonner";
import React from "react";

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

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const res = await fetch(
                    "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
                );
                const data = await res.json();

                if (data?.USD) {
                    setEthPrice(data.USD);
                }
            } catch (err) {
                console.error("Failed to fetch ETH price", err);
            }
        };

        fetchPrice();
    }, []);

    const tx = useMemo(() => {
    if (!isConnected || !address) return undefined;
    return {
        account: address as `0x${string}`,
        to: "0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926" as `0x${string}`,
        value: parseEther("0.00005"),
        chainId: 11155111,
        data: "0x" as `0x${string}`,  // ← add this
    };
    }, [isConnected, address]);
    
    const { data: gas } = useEstimateGas({
        ...tx,
        query: {
            enabled: !!tx
        }
    });
    const { data: fees } = useEstimateFeesPerGas({
        chainId: 11155111,
        query: {
            enabled: !!tx
        }
    });

    const totalFee = useMemo(() => {
        if (!gas || !fees?.maxFeePerGas) return undefined;
        const buffer = parseEther("0.00005");
        return Number(formatEther(gas * fees.maxFeePerGas + buffer));
    }, [gas, fees]);

    // Temporarily add after your hooks:
    console.log("gas:", gas, "fees:", fees, "ethPrice:", ethPrice, "totalFee:", totalFee);
    
    const handleCreateCapsule = async () => {
        if (!title) return toast.warning("Provide title to your capsule!");
        if (!unlockDate) return toast.warning("Select unlock date");
        if (!message) return toast.warning("Enter a new message!");
        if (!isConnected) return (toast.error("Wallet not connected"), window.location.reload());

        const currentTitle = title;
        setLoading(true);
        onPendingAdd(currentTitle);

        try {
            const timestamp = Math.floor(unlockDate.getTime() / 1000);
            await createEncryptedCapsule({
                address: address!,
                plaintext: message,
                unlockDate: timestamp,
                title
            });
            await onCreated();
            toast.success("Capsule created successfully");

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
            console.error("Failed to create capsule:", err);
            toast.error("Failed to create capsule");
        } finally {
            setLoading(false);
            onPendingRemove(currentTitle);
            setTitle("");
            setMessage("");
            setUnlockDate(undefined);
            setDateResetKey((k) => k + 1);
        }
    };

    return (
        <div className="bg-white/80 my-4 rounded-2xl p-5 lg:my-8 md:p-8 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
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
                    className="h-8 w-auto rounded-full contrast-110 cursor-pointer hover:bg-accent/90 bg-accent flex items-center justify-center active:scale-90 active:translate-y-1 ease-linear duration-200 transition-all border border-primary/40"
                    style={{ boxShadow: "0 5px 0 0px #BD2E2ECC" }}
                >
                    <span className="text-white text-sm font-medium">Create & Seal</span>
                </Button>
            </div>

            {/* Status bar */}
            <div
                className={`flex justify-around items-center w-full text-xs md:text-sm gap-1 ${
                    !isConnected ? "select-none pointer-events-none blur-[3px]" : ""
                }`}
            >
                <div className="bg-background/60 shadow-inner flex items-center h-8 px-4 py-2 rounded-full">
                    <span className="relative flex items-center justify-center h-2.5 w-2.5 sm:h-3 sm:w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                    </span>
                    Sepolia Connected
                </div>
                <div className="h-8 w-full max-w-48 flex gap-2 items-center justify-center bg-gray-200/70 shadow-inner rounded-full">
                    <Fuel className="text-gray-500 h-5" />
                    <span>
                        ≈ {totalFee ? Number(totalFee).toFixed(6) : "..."} ETH{" "}
                        <span className="m-0 text-xs text-gray-600">
                            {totalFee && ethPrice
                                ? `($${(Number(totalFee) * ethPrice).toFixed(2)})`
                                : "($...)"}
                        </span>
                    </span>
                </div>
            </div>

            {/* Wallet lock overlay */}
            {!isConnected && (
                <div className="absolute left-1/3 top-1/2 sm:left-1/4 md:left-1/3 md:top-1/3">
                    <span className="text-lg font-bold">🔒Signin with wallet!</span>
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
                            className="h-32 text-sm rounded-xl border focus:border-2 border-gray-300 shadow-sm w-full px-4 py-3 overflow-auto resize-none focus:scale-102 placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CapsuleForm;
