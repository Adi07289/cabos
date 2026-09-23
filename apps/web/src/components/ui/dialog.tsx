"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

function Overlay() {
  return <DialogPrimitive.Overlay className="fixed inset-0 z-(--z-sheet) bg-black/50 backdrop-blur-(--blur-sheet)" />;
}

function CloseButton() {
  return (
    <DialogPrimitive.Close
      aria-label="Close"
      className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-md text-text-2 hover:bg-surface hover:text-text"
    >
      <X aria-hidden className="size-5" />
    </DialogPrimitive.Close>
  );
}

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-(--z-sheet) w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface-raised p-6 shadow-e3",
          className,
        )}
        {...props}
      >
        {children}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Bottom sheet: the cab pattern for secondary tasks (reachable with one hand). */
export function SheetContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-(--z-sheet) max-h-[85dvh] overflow-y-auto rounded-t-xl border-t border-border bg-surface-raised p-6 pb-10 shadow-e3",
          className,
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border-strong" />
        {children}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
