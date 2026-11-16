import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("field", className)} {...props} />;
}

export function FieldHint({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs text-[var(--muted)] leading-snug", className)}
      {...props}
    />
  );
}
