import { cn } from "@/lib/cn";

/** Content-shaped placeholder. Shimmer is disabled under reduced motion. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-sm bg-surface-raised motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
