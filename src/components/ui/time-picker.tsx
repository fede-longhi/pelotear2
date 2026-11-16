"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type TimePickerProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  stepMinutes?: 15 | 30 | 60;
  className?: string;
  "aria-invalid"?: boolean;
};

function buildSlots(stepMinutes: number): string[] {
  const slots: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

function normalizeTime(value: string | undefined): string {
  if (!value?.trim()) return "";
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function TimePicker({
  id,
  name,
  defaultValue = "20:00",
  required,
  disabled,
  stepMinutes = 15,
  className,
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const slots = React.useMemo(() => buildSlots(stepMinutes), [stepMinutes]);
  const initial = normalizeTime(defaultValue) || "20:00";
  const [value, setValue] = React.useState(
    slots.includes(initial) ? initial : slots[0] ?? "20:00",
  );

  return (
    <div className={cn("relative", className)}>
      <Clock
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--gold)]"
        aria-hidden
      />
      <select
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn(
          "flex h-10 w-full cursor-pointer appearance-none rounded-md border border-[var(--line)] bg-white/[0.06] py-2 pl-10 pr-9 text-sm text-[var(--chalk)] shadow-sm transition-colors",
          "hover:bg-white/[0.08]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:border-[var(--gold)]/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {slots.map((slot) => (
          <option key={slot} value={slot} className="bg-[var(--sky-top)] text-[var(--chalk)]">
            {slot}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
      >
        ▾
      </span>
    </div>
  );
}
