import React from 'react'
import { Pill } from 'lucide-react';
import { Spinner } from "@/components/ui/spinner"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button";
import ViewCapsuleModal from "@/components/viewCapsuleModal";

type CardProps = {
  title: string;
  message: string;
  timeRemaining: number;
  createdAt: number;
};

function Cards({title,message,timeRemaining}:CardProps) {
    return (
       <div className="flex flex-col gap-4 lg:h-[65vh] lg:overflow-y-auto overflow-x-hidden min-h-0 lg:pr-2  px-8 lg:px-4 md:px-20 pb-2 py-2 m-0">
        <div className="bg-white rounded-3xl p-5 hover:shadow-lg border-gray-100 cursor-pointer transition-all duration-200 will-change-transform hover:-translate-y-1 hover:-translate-x-1 relative overflow-hidden group/card shrink-0">
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/card:text-muted group-hover/card:border-accent/50 transition-colors">
                    <Lock />
                  </div>
                  <div>
                <h3 className="font-bold text-sm">{title}</h3>
                  </div>
                </div>
                <span className="inline-flex rounded-full items-center gap-1 bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-500 uppercase">Locked</span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 group-hover/card:bg-white group-hover/card:border-accent/20 transition-colors">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium">Time Remaining</span>
                  <span className="font-bold">{timeRemaining}</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden p-[1px]">
                  <div className="h-full bg-secondary w-[20%] rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 hover:shadow-lg border-gray-100 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:-translate-x-1 relative overflow-hidden group/card shrink-0">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover/card:scale-110 bg-white">
              </div>
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/card:text-muted group-hover/card:border-accent/50 transition-colors">
                    <Pill />
                  </div>
                  <div>
                <h3 className="font-bold text-sm">{title}</h3>
                  </div>
                </div>
                <span className="inline-flex rounded-full items-center gap-1 bg-green-100 text-green-600 px-2.5 py-1 text-sm font-medium uppercase">Ready</span>
              </div>
              <div className="px-4 py-2.5 mt-2 flex justify-end">
                <ViewCapsuleModal title={title} date={timeRemaining} message={message}>
                <Button className="px-4 py-2 text-white text-xs font-bold rounded-full hover:bg-primary/80 transition-all shadow-md w-full transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-0">
                  <span>Open Capsule</span>
                  </Button>
                  </ViewCapsuleModal>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 hover:shadow-lg border-gray-100 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:-translate-x-1 relative overflow-hidden group/card shrink-0">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-lg -mr-4 -mt-4 transition-transform group-hover/card:scale-150 bg-amber-200 blur-2xl">//TODO:FIX THIS
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
              <div className="px-4 py-4.5 mt-2 flex justify-start text-sm">
                <span className="pl-14">Waiting for block confirmation!</span>
              </div>
            </div>
        </div >
  )
}

export default Cards