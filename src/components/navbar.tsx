import { CustomConnectButton } from "./ui/customConnectButton"

function navbar() {
  return (
    <nav className="fixed top-6 z-50 left-1/2 -translate-x-1/2">
      <div className="glass-ios px-2 md:px-6 py-2 md:py-3 rounded-xl w-[90vw] md:w-[70vw] max-w-6xl flex justify-between items-center">
        <div className="flex-1">
          <h1 className="flex-1 flex justify-center text-xl md:text-2xl font-semibold antialiased pl-[18vw] md:pl-[9vw]">Time Capsule</h1>
        </div>
        <CustomConnectButton />
      </div>
    </nav>
  )
}

export default navbar