"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";

import { SPRING } from "@/design/motion";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-(--dur-fast) disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-pressed",
        secondary: "border border-border-strong bg-surface-raised text-text hover:bg-surface",
        ghost: "text-text hover:bg-surface-raised",
        danger: "bg-stop-fill text-on-stop hover:brightness-110",
      },
      size: {
        // Office density.
        md: "h-10 px-4 text-body-sm",
        // Cab density: 56 px target, 72 px in glove mode (via --target-cab).
        cab: "min-h-(--target-cab) px-6 text-body-cab",
        icon: "size-10",
        "icon-cab": "size-(--target-cab)",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> &
  VariantProps<typeof buttonVariants> & { children?: React.ReactNode };

/** Press feedback uses `spring.press` (design §2.5); none under reduced motion. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = "button", ...props },
  ref,
) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={SPRING.press}
      {...props}
    />
  );
});
