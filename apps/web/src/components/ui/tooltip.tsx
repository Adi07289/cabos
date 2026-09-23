"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/cn";

/**
 * Office only. Cab Mode has no hover-dependent UI (design §6); use an info sheet there.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-(--z-dropdown) max-w-72 rounded-sm border border-border bg-surface-raised px-3 py-2 text-body-sm text-text shadow-e2",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
