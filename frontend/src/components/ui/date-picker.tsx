"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-slate-500",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : <span>{placeholder}</span>}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-1 shadow-lg">
            <Calendar
              selected={date}
              onSelect={(selected) => {
                onDateChange?.(selected);
                setIsOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
