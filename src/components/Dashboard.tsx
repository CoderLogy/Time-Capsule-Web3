import Navbar from "./navbar";
import { Label } from "@/components/ui/label";
import CountUp from "./ui/CountUp";
import { useInView } from "motion/react";
import { useRef, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import Cards from "./cards";
import { getCapsules } from "@/lib/contract-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Capsule } from "@/lib/capsule-query";
import CapsuleForm from "./CapsuleForm";
import ScrollUpButton from "./ScrollUpButton";
import Footer from "./Footer";
import HeroText from "./HeroText";
import { useWalletReconnect } from "@/hooks/useWalletReconnect";
import { useMobileWalletDetection } from "@/hooks/useMobileWalletDetection";

export default function Dashboard() {
    const queryClient = useQueryClient();
    const ref = useRef(null);
    const inView = useInView(ref);
    const { address, isConnected } = useAccount();
    const [pendingTitles, setPendingTitles] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const cardsContainerRef = useRef<HTMLDivElement>(null);

    useWalletReconnect({});

    // Detect mobile and prompt to open in wallet browser
    useMobileWalletDetection();

    const { data: capsules = [], refetch: refetchCapsules } = useQuery<Capsule[]>({
        queryKey: ["capsules", address],
        queryFn: () => getCapsules(address!),
        enabled: !!address && isConnected,
        refetchInterval: 5_000, // Poll every 5 seconds for faster visibility
        staleTime: 3_000 // Capsules stale after 3 seconds
    });

    const searchCapsule = useMemo(() => {
        const searchTerm = (search || "").toLowerCase();

        return capsules
            .filter(
                (c) => typeof c.title === "string" && c.title.toLowerCase().includes(searchTerm)
            )
            .sort((a, b) => {
                const titleA = (a.title || "").toLowerCase();
                const titleB = (b.title || "").toLowerCase();

                const score = (title: string) => {
                    if (!title) return 0;
                    if (title === searchTerm) return 100;
                    if (title.startsWith(searchTerm)) return 50;
                    if (title.includes(searchTerm)) return 10;
                    return 0;
                };

                const diff = score(titleB) - score(titleA);
                if (diff !== 0) return diff;
                return titleA.localeCompare(titleB);
            });
    }, [capsules, search]);

    const refreshCapsules = async () => {
        await queryClient.invalidateQueries({ queryKey: ["capsules"] });
    };

    return (
        <div>
            <Navbar />
            <div className="pt-30 text-center py-8 flex flex-col items-center gap-4 md:gap-6">
                <HeroText />
                <p className="text-foreground text-base md:text-xl max-w-2xl tracking-tight px-2">
                    A decentralized time capsule for your digital assets. Securely encrypt messages
                    and media today, unlock them on a date you choose.
                </p>

                <div className="flex flex-col lg:flex-row lg:justify-center gap-6 px-6 md:px-24 w-full mx-auto">
                    <div className="w-full lg:w-7/12">
                        <CapsuleForm
                            onPendingAdd={(t) => setPendingTitles((p) => [...p, t])}
                            onPendingRemove={(t) =>
                                setPendingTitles((p) => p.filter((x) => x !== t))
                            }
                            onCreated={refetchCapsules}
                            cardsContainerRef={cardsContainerRef}
                        />
                    </div>

                    <div className="w-full lg:w-5/12 xl:w-4/12 flex flex-col gap-6 mt-8 md:mt-10 lg:mt-16">
                        <div
                            className={`flex gap-3 items-center ${
                                capsules.length < 5 ? "flex-col" : "flex-row justify-between"
                            } px-0 md:px-2 md:mx-4`}
                        >
                            <Label htmlFor="SearchCapsules">
                                <h2
                                    className={`text-xl shrink-0 font-semibold font-raleway ${capsules.length > 5 ? "pr-5" : ""}`}
                                >
                                    Your Capsules
                                    <span
                                        className="font-normal text-xs pr-4 text-gray-500 ml-2 inline-block align-middle"
                                        ref={ref}
                                    >
                                        (
                                        {inView && (
                                            <CountUp
                                                key={inView ? "visible" : "0"}
                                                from={0}
                                                to={searchCapsule.length}
                                                duration={0.3}
                                                onStart={() => {}}
                                                onEnd={() => {}}
                                            />
                                        )}
                                        )
                                    </span>
                                </h2>
                            </Label>
                            <div className={`flex grow-2 ${capsules.length === 0 ? "hidden" : ""}`}>
                                {capsules.length >= 5 && (
                                    <input
                                        id="SearchCapsules"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="outline-0 resize-none h-8 w-full rounded-xl bg-white/80 text-sm px-3 py-2 border focus:border-2 border-gray-300 shadow-sm focus:scale-102 transition-all duration-150 focus:ring-0 placeholder:text-gray-400"
                                    />
                                )}
                            </div>
                        </div>
                        <Cards
                            capsules={searchCapsule}
                            pendingTitles={pendingTitles}
                            containerRef={cardsContainerRef}
                        />
                    </div>
                </div>

                <Footer />
            </div>

            <ScrollUpButton cardsContainerRef={cardsContainerRef} />
        </div>
    );
}
