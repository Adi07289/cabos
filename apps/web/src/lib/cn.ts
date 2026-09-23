import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom type-scale names so `text-h1` and `text-text-2` don't collide.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-2xl",
            "display-xl",
            "numeral-xl",
            "numeral-lg",
            "numeral-md",
            "h1",
            "h2",
            "h3",
            "body-cab",
            "body",
            "body-sm",
            "label",
            "mono",
            "mono-sm",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
