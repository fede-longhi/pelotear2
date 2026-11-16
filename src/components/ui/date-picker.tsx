"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
};

function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const parsed = parse(value.trim(), "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  id,
  name,
  defaultValue = "",
  required,
  disabled,
  placeholder = "Elegí una fecha",
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Date | undefined>(() =>
    parseIsoDate(defaultValue),
  );

  const isoValue = selected ? format(selected, "yyyy-MM-dd") : "";
  const label = selected
    ? format(selected, "dd/MM/yyyy", { locale: es })
    : placeholder;

  return (
    <div className={cn("relative", className)}>
      <input
        name={name}
        value={isoValue}
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
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-white/[0.06] px-3 py-2 text-left text-sm shadow-sm transition-colors",
              "hover:bg-white/[0.08]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:border-[var(--gold)]/60",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected ? "text-[var(--chalk)]" : "text-[var(--muted)]/70",
            )}
          >
            <span className="truncate">{label}</span>
            <CalendarIcon
              className="size-4 shrink-0 text-[var(--gold)]"
              aria-hidden
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              setSelected(date);
              setOpen(false);
            }}
            defaultMonth={selected}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
