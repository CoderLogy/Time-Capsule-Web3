import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

const ScrollUpButton = function ScrollUp({
    cardsContainerRef
}: {
    cardsContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const container = cardsContainerRef.current;
        if (!container) return;

        const handleScroll = () => setShowScrollTop(container.scrollTop > 300);
        const handleWindowScroll = () => setShowScrollTop(window.scrollY > 1200);

        window.addEventListener("scroll", handleWindowScroll);
        container.addEventListener("scroll", handleScroll);

        return () => {
            container.removeEventListener("scroll", handleScroll);
            window.removeEventListener("scroll", handleWindowScroll);
        };
    }, [cardsContainerRef]);

    return (
        <AnimatePresence>
            {showScrollTop && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed bottom-8 right-8 z-50"
                >
                    <Button
                        onClick={() => {
                            cardsContainerRef.current?.scrollTo({
                                top: 0,
                                behavior: "smooth"
                            });
                        }}
                        className="glass-ios border-0.5 inline-flex items-center gap-2 rounded-2xl cursor-pointer bg-black/30 backdrop-blur-md px-4 py-2 text-sm font-medium text-white/80 hover:bg-black/40 transition-all duration-300 ease-in-out shadow-lg active:scale-90"
                    >
                        <ArrowUp className="h-4 w-4" />
                        Back to top
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default memo(ScrollUpButton);
