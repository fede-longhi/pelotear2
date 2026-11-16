"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const chevrons = {
  left: ChevronLeft,
  right: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
} as const;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      navLayout="around"
      showOutsideDays={showOutsideDays}
      className={cn("pelotear-calendar", className)}
      classNames={{
        root: "rdp-root",
        day_button: "rdp-day_button cursor-pointer",
        button_previous: "rdp-button_previous cursor-pointer",
        button_next: "rdp-button_next cursor-pointer",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation = "right", ...chevronProps }) => {
          const Icon = chevrons[orientation] ?? ChevronRight;
          return (
            <Icon
              {...chevronProps}
              className={cn("size-4", chevronProps.className)}
              aria-hidden
            />
          );
        },
      }}
      {...props}
    />
  );
}
