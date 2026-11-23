"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className={cn("p-3 bg-white rounded-md border border-slate-200", className)}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 rounded hover:bg-slate-100 text-slate-600"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 rounded hover:bg-slate-100 text-slate-600"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-sm">
        {days.map((day) => {
          const isSelected = selected && isSameDay(day, selected);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const currentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                "h-8 w-8 rounded text-center text-sm transition-colors mx-auto flex items-center justify-center",
                !isCurrentMonth && "text-slate-300",
                isCurrentMonth && !isSelected && "text-slate-700 hover:bg-slate-100",
                currentDay && !isSelected && "border border-slate-300 font-semibold",
                isSelected && "bg-slate-900 text-white font-medium hover:bg-slate-800",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
