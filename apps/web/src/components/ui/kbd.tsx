import { cn } from "@/lib/cn";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-xs border border-border-strong bg-surface-sunken px-1.5 font-mono text-mono-sm text-text-2",
        className,
      )}
      {...props}
    />
  );
}
