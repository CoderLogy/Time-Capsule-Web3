import Navbar from "./navbar";
import EmptyPage from "./emptyPage";
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CountUp from "./CountUp";
import { useInView } from "motion/react";
import { useRef } from "react";
import { TextAnimate } from "./ui/text-animate";
import { useConnectModal } from "@rainbow-me/rainbowkit"
import DatePicker from "@/components/ui/date-picker";
import { Textarea } from "./ui/textarea";
import { Pill } from 'lucide-react';
import { Spinner } from "@/components/ui/spinner"
import { Lock } from "lucide-react"
import { Fuel } from 'lucide-react';
import { useEstimateGas, useEstimateFeesPerGas, useAccount,useChainId } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { useMemo,useEffect,useState } from "react";

export default function Dashboard() {
  const ref = useRef(null)
  const inView = useInView(ref)
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount()
  const [ethPrice, setEthPrice] = useState<number | null>(null)

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
      .then(res => res.json())
      .then(data=>setEthPrice(data.ethereum.usd))
  },[])
  const tx = useMemo(() => {
    if (!openConnectModal || !address) return undefined
    return {
      account: address as `0x${string}`,
      to: "0xB237756220035223Be69d49a6bc9A82f20638307" as `0x${string}`,
      value: parseEther("0.01"),
      chainId: 42161
    }
  }, [openConnectModal,address])
  
  const { data: gas } = useEstimateGas(tx)
  const { data: fees } = useEstimateFeesPerGas({ chainId: 42161 })

  const totalFee = useMemo(() => {
    if (!gas || !fees?.maxFeePerGas) return undefined
    const buffer = parseEther("0.00002")
    return formatEther(gas * fees.maxFeePerGas + buffer)
  }, [gas, fees])

  useEffect(() => {
    if (totalFee) {
      console.log("Total Fee:", totalFee)
    }
  }, [totalFee])
  return <div>
    <Navbar />
    <div className="pt-30 text-center py-8 flex flex-col items-center gap-4 md:gap-6">
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-2"><TextAnimate animation="slideDown" duration={0.75} by="word" className="inline-flex">Preserve your moments</TextAnimate> <br /><span className="text-transparent bg-clip-text bg-linear-to-r from-secondary to-primary">sealed in time.</span></h1>
      <p className="text-foreground text-base md:text-xl max-w-2xl tracking-tight px-2">A decentralized time capsule for your digital assets. Securely encrypt messages and media today, unlock them on a date you choose.</p>
      <div className="flex flex-col lg:flex-row gap-8 px-6 md:px-25 w-full mx-auto">
        <div className="w-full lg:w-7/12">
          <div className="bg-white/80 rounded-2xl p-5 md:p-8 relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">New Capsule</h2>
                <p className="text-xs md:text-sm">Seal a message on the blockchain.</p>
              </div>
              <div className="h-8 w-8 cursor-pointer rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors gap-2">
                <Plus className="text-primary" />
              </div>
            </div>
            <div className={`flex justify-around items-center w-full text-sm ${openConnectModal ? "select-none pointer-events-none blur-[3px]" : ""}`}>
            <div className="bg-background/60 shadow-inner inline-flex items-center gap-2 px-3 py-1.75 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
                Arbitrum Connected
              </div>
              <div className="h-8 w-48 flex gap-2 items-center justify-center bg-gray-200/70 shadow-inner rounded-full">
                <Fuel className="text-gray-500 h-5" /> <span>≈ {Number(totalFee).toFixed(6)} ETH <span className="m-0 text-xs text-gray-600">(${(Number(totalFee) * ethPrice).toFixed(2)})</span> </span>
              </div>
          </div>
            {openConnectModal && (
              <div className="absolute left-1/3 top-1/2">
                <span className="text-lg font-bold">🔒Signin with wallet!</span>
              </div>)}
            <div className={`opacity-60 px-2 py-5 ${openConnectModal ? "mt-8 select-none pointer-events-none blur-[1.8px]" : ""}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 resize-none">
                <div>
                  <Label className="text-xs md:text-sm mb-2 ml-2 uppercase">Title</Label>
                  <Input type="text" className="h-10 md:h-12 rounded-xl border border-gray-200 shadow-sm w-full" />
                </div>
                <div>
                  <Label className="text-xs md:text-sm mb-2 ml-2 uppercase">Unlock Date</Label>
                  {/* <Input type="date" className="h-10 md:h-12 rounded-xl border border-gray-200  shadow-sm w-full" /> */}
                  <DatePicker buttonClassName="hover:bg-transparent bg-transparent rounded-xl h-10 md:h-12" />
                </div>
                <div className="col-span-0 sm:col-span-2">
                  <Label className="text-xs md:text-sm mb-2 ml-2 uppercase">Messages</Label>
                  <Textarea className="h-24 md:h-32 rounded-xl border border-gray-200 shadow-sm w-full px-4 py-3 overflow-auto resize-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-5/12 xl:w-4/12 flex flex-col gap-6 mt-9">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold">Your Archive <span className="font-normal text-xs text-gray-500 align-middle" ref={ref}>
              ({inView && (<CountUp key={inView ? "visible" : "hidden"} from={0} to={5} duration={0.5}>
              </CountUp>)})
            </span></h2>
          </div>
          
        <div className="flex flex-col gap-4 lg:h-[400px] lg:overflow-y-auto overflow-x-hidden min-h-0 lg:pr-2  px-8 lg:px-4 md:px-20 pb-2 py-2 m-0">
            <div className="bg-white rounded-3xl p-5 hover:shadow-lg border-gray-100 cursor-pointer transition-all duration-300 will-change-transform hover:-translate-y-1 hover:-translate-x-1 relative overflow-hidden group/card shrink-0">
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/card:text-muted group-hover/card:border-accent/50 transition-colors">
                    <Lock />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Card Title</h3>
                  </div>
                </div>
                <span className="inline-flex rounded-full items-center gap-1 bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-500 uppercase">Locked</span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 group-hover/card:bg-white group-hover/card:border-accent/20 transition-colors">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium">Time Remaining</span>
                  <span className="font-bold">30d 10h 20m</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden p-[1px]">
                  <div className="h-full bg-secondary w-[20%] rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 hover:shadow-lg border-gray-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:-translate-x-1 relative overflow-hidden group/card shrink-0">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover/card:scale-110 bg-white">
              </div>
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/card:text-muted group-hover/card:border-accent/50 transition-colors">
                    <Pill />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Card Title</h3>
                  </div>
                </div>
                <span className="inline-flex rounded-full items-center gap-1 bg-green-100 text-green-600 px-2.5 py-1 text-sm font-medium uppercase">Ready</span>
              </div>
              <div className="px-4 py-2.5 mt-2 flex justify-end">
                <Button className="px-4 py-2 text-white text-xs font-bold rounded-full hover:bg-primary/80 transition-all shadow-md w-full transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-0">
                  <span>Open Capsule</span>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 hover:shadow-lg border-gray-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:-translate-x-1 relative overflow-hidden group/card shrink-0">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover/card:scale-110 bg-white">
              </div>
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/card:text-muted group-hover/card:border-accent/50 transition-colors">
                    <Spinner className="w-6 h-6"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Card Title</h3>
                  </div>
                </div>
                <span className="inline-flex rounded-full items-center gap-1 px-2.5 py-1 text-sm font-medium text-yellow-600 bg-yellow-100 uppercase">Open</span>
              </div>
              <div className="px-4 py-4.5 mt-2 flex justify-start text-xs">
                <span className="pl-14">Waiting for block confirmation!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto py-6 border-t border-gray-600/60">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Time Capsule App Decentralized.</p>
          <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 md:justify-end text-xs">
            <a className="hover:text-accent transition-colors" href="#">Privacy</a>
            <a className="hover:text-accent transition-colors" href="#">Terms</a>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
              <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
              System Operational
            </div>
          </div>
        </div>
      </footer>
    </div>


  </div>;
}
