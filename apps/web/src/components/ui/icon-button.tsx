"use client";

import { forwardRef } from "react";

import { Button, type ButtonProps } from "./button";

/** Icon-only button. `label` is required: it becomes the accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "aria-label"> & { label: string }>(
  function IconButton({ label, size = "icon", variant = "ghost", ...props }, ref) {
    return <Button ref={ref} aria-label={label} title={label} size={size} variant={variant} {...props} />;
  },
);
