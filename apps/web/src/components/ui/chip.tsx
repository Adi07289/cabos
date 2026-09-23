"use client";

import { cn } from "@/lib/cn";

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean };

/** Toggleable filter/choice chip. Selected state uses the accent (design: "selected"). */
export function Chip({ className, selected = false, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-body-sm transition-colors duration-(--dur-fast)",
        selected
          ? "border-accent bg-accent text-on-accent"
          : "border-border-strong bg-surface text-text-2 hover:text-text",
        className,
      )}
      {...props}
    />
  );
}
