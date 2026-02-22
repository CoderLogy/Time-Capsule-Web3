import React, { useMemo, memo } from 'react'
import { Pill, Lock } from 'lucide-react';
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button";
import ViewCapsuleModal from "@/components/ViewCapsuleModal";
import type { Capsule } from '@/lib/capsule-query';
import { motion, AnimatePresence, useInView } from "framer-motion";


type CardsProps = {
  capsules: Capsule[]
  pendingTitles?: string[]
  containerRef?: React.RefObject<HTMLDivElement>
}

function LockedCard({ capsule }: { capsule: Capsule }) {
  const [now, setNow] = React.useState(() => Date.now())

  // Tick every 10 seconds to update progress bar
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(id)
  }, [])

  const unlockTs = Number(capsule.unlockDate) * 1000
  const createdTs = Number(capsule.blockTimestamp) * 1000
  const total = unlockTs - createdTs
  const elapsed = now - createdTs
  const progress = Math.min(100, Math.max(2, (elapsed / total) * 100))
  const unlockDateFormatted = new Date(unlockTs).toLocaleDateString('en-GB')

  return (
    <div className="bg-white/80 rounded-3xl p-5 hover:shadow-lg border border-gray-200 cursor-pointer transition-all duration-200 will-change-transform hover:-translate-y-1 hover:-translate-x-1 relative overflow-hidden group/card shrink-0">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex flex-1 min-w-0 max-w-[55%] items-center gap-3">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/card:text-muted group-hover/card:border-accent/50 transition-colors duration-350 ease-linear">
            <Lock />
          </div>
          <h3 className="font-bold truncate capitalize text-sm" style={{ fontFamily: "Raleway", fontWeight: "600" }}>{capsule.title}</h3>
          </div>
        <span className="shrink-0 inline-flex rounded-full items-center gap-1 bg-slate-200 group-hover/card:bg-slate-300 px-2.5 py-1 text-sm font-medium text-gray-500 uppercase transition-colors duration-200 ease-linear">Locked</span>
      </div>
      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 group-hover/card:bg-white group-hover/card:border-accent/20 transition-colors">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-semibold">Unlocks</span>
          <span className="font-bold">{unlockDateFormatted}</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden p-[1px]">
          <div className="h-full bg-secondary rounded-full transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

function ReadyCard({ capsule }: { capsule: Capsule }) {
  const unlockDateFormatted = useMemo(() =>
    new Date(Number(capsule.unlockDate) * 1000).toLocaleDateString('en-US'),
    [capsule.unlockDate]
  )

  return (
    <div className="bg-white/80 rounded-3xl p-5 hover:shadow-lg border border-gray-200 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:-translate-x-1 relative overflow-hidden group/card shrink-0">
      <div className="flex items-start justify-between mb-4 relative z-10 transition-all duration-500">
        <div className="flex flex-1 min-w-0 max-w-[55%] items-center gap-3">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/card:text-muted group-hover/card:border-accent/50 transition-colors duration-350 ease-linear">
            <Pill />
          </div>
            <h3 className="font-bold truncate capitalize text-sm" style={{ fontFamily: "Raleway", fontWeight: "600" }}>{capsule.title}</h3>
          </div>
        <span className="shrink-0 inline-flex rounded-full items-center gap-1 bg-green-100 group-hover/card:bg-green-200 text-green-600 px-2.5 py-1 text-sm font-medium uppercase transition-colors duration-200 ease-linear">Ready</span>
      </div>
      <div className="px-4 py-2.5 mt-2 flex justify-end">
        <ViewCapsuleModal title={capsule.title} date={unlockDateFormatted} dataURI={capsule.dataURI}>
          <Button className="px-4 py-2 text-white text-xs font-bold rounded-full hover:bg-primary/80 transition-all shadow-md w-full transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-0">
            Open Capsule
          </Button>
        </ViewCapsuleModal>
      </div>
    </div>
  )
}

function PendingCard({ title }: { title: string }) {
  return (
    <div className="bg-white/80 rounded-3xl p-5 border-gray-100 transition-all duration-200 relative overflow-hidden group/card shrink-0">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex flex-1 min-w-0 max-w-[55%] items-center gap-3">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
            <Spinner className="w-6 h-6" />
          </div>
            <h3 className="font-bold text-sm truncate" style={{ fontFamily: "Raleway", fontWeight: "600" }}>{title}</h3>
        </div>
        <span className="shrink-0 inline-flex rounded-full items-center gap-1 px-2.5 py-1 text-sm font-medium text-yellow-600 bg-yellow-100 uppercase">Pending</span>
      </div>
      <div className="px-4 py-4.5 mt-2 flex justify-center text-sm text-gray-400">
        <span>Waiting for block confirmation...</span>
      </div>
    </div>
  )
}


function CapsuleCardWrapper({ capsule }: { capsule: Capsule }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin:"-20px",amount: 0.2, once:true });

  return (
    <motion.div
      ref={ref}
      key={capsule.id}
      initial={{ scale: 0.8, y: 30, opacity: 0.4, rotate: -2 }}
      animate={
        inView
          ? { scale: 1, y: 0, opacity: 1, rotate: 0 }
          : { scale: 0.9, y: 40, opacity: 0, rotate: -2 }
      }
      exit={{ scale: 0.8, y: 30, opacity: 0, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
    >
      {capsule.status === "ready" ? (
        <ReadyCard capsule={capsule} />
      ) : (
        <LockedCard capsule={capsule} />
      )}
    </motion.div>
  );
}

function Cards({ capsules, pendingTitles = [], containerRef }: CardsProps) {
  return (
    <div ref={containerRef} className="flex flex-col gap-6 lg:h-[65vh] overflow-y-hidden lg:overflow-y-auto overflow-x-hidden min-h-0 lg:pr-2 px-8 lg:px-4 md:px-20 pb-2 py-2 m-0">
      <AnimatePresence>
      {/* Pending cards */}
        {pendingTitles.map((title, i) => (
          <PendingCard key={`pending-${i}`} title={title} />
        ))}

        {/* No capsules message */}
        {capsules.length === 0 && pendingTitles.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            No capsules yet.
          </p>
        )}
        
       
        {capsules.map((capsule: Capsule, i) => (
         <CapsuleCardWrapper key={ capsule.id || `capsule-${i}` } capsule={capsule} />
        ))}
        </AnimatePresence>
      </div>
  );
}

export default memo(Cards)

/*
//worp
<motion.div
  key={capsule.id}
  initial={{ scale: 0.2, x: 0, y: 0, rotate: 0, opacity: 0, skewX: 20, skewY: 20 }}
  animate={{ 
    scale: 1, 
    x: 0, 
    y: 0, 
    rotate: 720,      
    opacity: 1, 
    skewX: 0, 
    skewY: 0 
  }}
  exit={{ 
    scale: 0.2, 
    rotate: -720, 
    opacity: 0, 
    skewX: -20, 
    skewY: -20 
  }}
  transition={{
    duration: 0.8,
    ease: "linear",
  }}
>

*/