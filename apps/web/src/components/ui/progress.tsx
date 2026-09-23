import { cn } from "@/lib/cn";

type ProgressProps = { value: number; max?: number; label: string; className?: string };

export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-border", className)}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-(--dur-base) ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
