import Dashboard from "@/components/Dashboard";
import Beams from "@/components/ui/Beams";
import CountUp from "@/components/ui/CountUp";
import Wallet from "@/components/Wallet";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

export function App() {
    return (
        <Wallet>
            
            <div className="min-h-screen bg-background w-full relative text-foreground antialiased">
                {/*
            <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
                <Beams
                    beamWidth={2}
                    beamHeight={15}
                    beamNumber={12}
                    lightColor="#d7e2e8"
                    speed={2}
                    noiseIntensity={1.75}
                    scale={0.2}
                    rotation={0}
                />
            </div>
        */}
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at center, transparent 60%, rgba(60,80,95,0.5) 100%)"
                    }}
                />
                <Analytics />
                <Dashboard />
                <Toaster
                    toastOptions={{
                        classNames: {
                            toast: "!glass-ios !bg-transparent"
                        }
                    }}
                />
            </div>
        </Wallet>
    );
}

export default App;
