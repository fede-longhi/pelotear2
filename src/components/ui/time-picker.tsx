"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(
    slots.includes(initial) ? initial : (slots[0] ?? "20:00"),
  );
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const selected = listRef.current?.querySelector<HTMLElement>(
        '[data-selected="true"]',
      );
      selected?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, value]);

  return (
    <div className={cn("relative", className)}>
      <input
        name={name}
        value={value}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onInvalid={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        onChange={() => {}}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-[var(--line)] bg-white/[0.06] px-3 py-2 text-left text-sm text-[var(--chalk)] shadow-sm transition-colors",
              "hover:bg-white/[0.08]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:border-[var(--gold)]/60",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Clock className="size-4 shrink-0 text-[var(--gold)]" aria-hidden />
            <span className="flex-1 truncate">{value}</span>
            <span aria-hidden className="text-[var(--muted)]">
              ▾
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          avoidCollisions
          collisionPadding={12}
          className="w-[var(--radix-popover-trigger-width)] p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            ref={listRef}
            role="listbox"
            aria-label="Elegí una hora"
            className="max-h-52 overflow-y-auto overscroll-contain py-0.5"
          >
            {slots.map((slot) => {
              const selected = slot === value;
              return (
                <button
                  key={slot}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected ? "true" : undefined}
                  className={cn(
                    "flex h-8 w-full cursor-pointer items-center rounded-md px-2.5 text-sm transition-colors",
                    selected
                      ? "bg-[var(--gold)] font-semibold text-[var(--ink)]"
                      : "text-[var(--chalk)] hover:bg-white/[0.08]",
                  )}
                  onClick={() => {
                    setValue(slot);
                    setOpen(false);
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
