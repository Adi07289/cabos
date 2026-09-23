"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/cn";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border-strong bg-surface-sunken transition-colors duration-(--dur-fast) disabled:opacity-45 data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-text shadow-e1 transition-transform duration-(--dur-fast) ease-out data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-on-accent" />
    </SwitchPrimitive.Root>
  );
}
