import { CustomConnectButton } from "./ui/customConnectButton";
import { Pill } from "lucide-react";
import { useState, useEffect } from "react";
function Navbar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000); // Update every minute
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <nav className="fixed top-6 z-50 left-1/2 -translate-x-1/2 w-[90vw] md:w-[65vw] max-w-3xl">
      <div className="glass-ios px-2 sm:p-2 md:px-6 py-2 md:py-3 rounded-2xl flex justify-between items-center relative mx-4">
        <div className="flex mx-2 md:mx-0 items-center gap-6 shrink-0">
          <div className="shrink-0 ml-auto px-2 py-2 rounded-xl text-primary bg-slate-400/30 flex items-center justify-center active:scale-95 hover:bg-primary group-active:scale-90 group-hover:text-white transition-all cursor-pointer ease-linear duration-200 relative group ">
            {/* Top-right half */}
            <Pill
              className="h-5 w-5 absolute transition-all duration-250 ease-in-out group-active:-translate-y-1 group-active:translate-x-1 group-active:-rotate-6 group-hover:text-white group-active:scale-90"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 0)" }}
            />

            {/* Bottom-left half */}
            <Pill
              className="h-5 w-5 absolute transition-all duration-250 ease-in-out group-active:translate-y-1 group-active:-translate-x-1 group-active:rotate-6 group-hover:text-white group-active:scale-90 "
              style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
            />

            {/* Spacer */}
            <Pill className="h-5 w-5 opacity-0 group-active:scale-90" />
          </div>
          <div className="hidden sm:flex flex-col items-start px-2.5 py-1.5 rounded-xl bg-slate-400/15 text-muted-foreground font-mono text-xs gap-0.5 tabular-nums leading-none">
            <span>
              {now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="text-[10px] opacity-50">
              {now.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <h1
          className="flex justify-center text-xl md:text-2xl tracking-wide antialiased absolute left-1/2 -translate-x-1/2"
          style={{ fontFamily: "Raleway Variable", fontWeight: "500" }}
        >
          Time Capsule
        </h1>
        <div className="shrink-0 md:mx-2 ml-auto">
          <CustomConnectButton />
        </div>
      </div>
    </nav>
  );
}

<Navbar />;

export default Navbar;
