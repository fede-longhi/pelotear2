import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-[var(--line)] bg-white/[0.06] px-3 py-2 text-sm text-[var(--chalk)] shadow-sm transition-colors placeholder:text-[var(--muted)]/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:border-[var(--gold)]/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:mr-3 file:rounded-md file:border-0 file:bg-[var(--gold)]/15 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-[var(--gold)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
