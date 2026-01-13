import Dashboard from "@/components/Dashboard"
import Beams from "@/components/Beams"
import CountUp from '@/components/CountUp'
import Wallet from "@/components/Wallet"

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
            <Dashboard />
            </div>
        </Wallet>
    )
}

export default App;