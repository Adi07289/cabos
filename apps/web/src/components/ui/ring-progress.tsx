import { cn } from "@/lib/cn";

type RingProgressProps = {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  tone?: "accent" | "safe" | "caution" | "danger";
  label: string;
  className?: string;
  children?: React.ReactNode;
};

const TONE = {
  accent: "stroke-accent",
  safe: "stroke-safe",
  caution: "stroke-caution",
  danger: "stroke-danger",
} as const;

/** Used by hold-to-log and the seatbelt handshake ring. */
export function RingProgress({
  value,
  size = 72,
  stroke = 6,
  tone = "accent",
  label,
  className,
  children,
}: RingProgressProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn(TONE[tone], "transition-[stroke-dashoffset] duration-(--dur-base) ease-out")}
        />
      </svg>
      {children ? <div className="absolute inset-0 grid place-items-center">{children}</div> : null}
    </div>
  );
}
