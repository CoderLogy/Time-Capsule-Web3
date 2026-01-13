"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
    value?: Date
    onChange?: (date: Date | undefined) => void

    className?: string
    buttonClassName?: string
    calendarClassNames?: React.ComponentProps<typeof Calendar>["classNames"]
}

export default function DatePicker({
    value,
    onChange,
    className,
    buttonClassName,
    calendarClassNames,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(undefined)
    const handleSelect = (selected: Date | undefined) => {
        setDate(selected)
        onChange?.(selected)
        setOpen(false)
    }
    const today = React.useMemo(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0) // normalize to midnight
        return d
    }, [])
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className={cn(
                            "w-full justify-between font-normal rounded-lg border-input shadow-sm",
                            "data-[state=open]:bg-white", "data-[state=open]:ring-4 data-[state=open]:ring-gray-200",
                            buttonClassName
                        )}
                    >
                        {date ? date.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon className="h-4 w-4 opacity-70" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={handleSelect}
                        classNames={{
                            day_selected:
                                "bg-primary text-primary-foreground hover:bg-primary focus:bg-primary",
                            day_today:
                                "bg-secondary/20 text-secondary font-semibold",
                            ...calendarClassNames, // ✅ user overrides
                        }}
                        disabled={[
                            (date: Date) => date < today
                        ]}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}