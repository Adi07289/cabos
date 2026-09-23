import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/** Severity badge. Colour is never the only signal: the label always names the level. */
export const badgeVariants = cva(
  "tabular inline-flex items-center gap-1.5 rounded-xs px-2 py-0.5 text-label uppercase",
  {
    variants: {
      tone: {
        neutral: "bg-surface-raised text-text-2 ring-1 ring-border",
        safe: "bg-safe-fill text-text ring-1 ring-safe",
        caution: "bg-caution-fill text-on-caution-fill",
        danger: "bg-danger-fill text-text ring-1 ring-danger",
        stop: "bg-stop-fill text-on-stop",
        info: "bg-info-fill text-text ring-1 ring-info",
        accent: "bg-accent text-on-accent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
