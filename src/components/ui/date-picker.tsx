"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    disabled?: boolean;

    className?: string;
    buttonClassName?: string;
    calendarClassNames?: React.ComponentProps<typeof Calendar>["classNames"];
};

export default function DatePicker({
    onChange,
    disabled,
    className,
    buttonClassName,
    calendarClassNames
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(undefined);
    const handleSelect = (selected: Date | undefined) => {
        setDate(selected);
        onChange?.(selected);
        setOpen(false);
    };
    const today = React.useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0); // normalize to midnight
        return d;
    }, []);

    // Start of current month — earliest the calendar can navigate to
    const startMonth = React.useMemo(() => {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // 10 years out — upper bound for the year dropdown
    const endMonth = React.useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 100);
        d.setMonth(11);
        d.setDate(31);
        return d;
    }, []);

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="CapsuleDatePicker"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between font-normal rounded-lg border-input text-sm! shadow-sm",
                            "data-[state=open]:bg-white",
                            "data-[state=open]:ring-3 data-[state=open]:ring-slate-300",
                            date ? "text-current" : "text-gray-400 hover:text-gray-400",
                            buttonClassName
                        )}
                    >
                        {date ? date.toLocaleDateString() : "Pick a date!"}
                        <ChevronDownIcon className="h-4 w-4 opacity-70" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        showOutsideDays={true}
                        onSelect={handleSelect}
                        startMonth={startMonth}
                        endMonth={endMonth}
                        classNames={{
                            day_selected:
                                "bg-primary text-primary-foreground hover:bg-primary focus:bg-primary",
                            day_today: "bg-secondary/20 text-secondary font-semibold",
                            outside: "text-muted/90",
                            weeks: "max-h-[11rem] block",
                            ...calendarClassNames
                        }}
                        disabled={[(date: Date) => date < today]}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
