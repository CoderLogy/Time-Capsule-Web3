import { CustomConnectButton } from "./ui/customConnectButton"
import { Pill } from "lucide-react"
function navbar() {
  return (
    <nav className="fixed top-6 z-50 left-1/2 -translate-x-1/2 w-[90vw] md:w-[65vw] max-w-3xl">
      <div className="glass-ios px-1 sm:p-2 md:px-6 py-1 md:py-3 rounded-xl flex justify-between items-center relative mx-4 md:mx-2">
        <div className="flex ml-2 items-center gap-2 shrink-0">
          <div className="px-2 py-2 rounded-xl text-primary bg-slate-400/30 flex items-center justify-center active:scale-95 hover:bg-primary group-active:scale-90 group-hover:text-white transition-all cursor-pointer ease-linear duration-200 relative group">
  
  {/* Top-right half */}
  <Pill
    className="h-6 w-6 absolute transition-all duration-250 ease-in-out group-active:-translate-y-1 group-active:translate-x-1 group-active:-rotate-6 group-hover:text-white group-active:scale-90"
    style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
  />

  {/* Bottom-left half */}
  <Pill
    className="h-6 w-6 absolute transition-all duration-250 ease-in-out group-active:translate-y-1 group-active:-translate-x-1 group-active:rotate-6 group-hover:text-white group-active:scale-90"
    style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}
  />

  {/* Spacer */}
  <Pill className="h-6 w-6 opacity-0 group-active:scale-90" />
</div>
        </div>
        <div className="flex-1">
          <h1 className="flex-1 flex justify-center text-xl md:text-2xl tracking-wide antialiased absolute left-1/2 -translate-1/2" style={{fontFamily:"Raleway", fontWeight:"500"}}>Time Capsule</h1>
        </div>
        <div className="shrink-0 ml-auto">
          <CustomConnectButton />
          </div>
      </div>
    </nav>
  )
}

export default navbar