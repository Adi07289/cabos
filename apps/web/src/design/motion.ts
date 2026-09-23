/** Motion tokens (docs/design.md §2.5). CSS mirrors the durations as --dur-* variables. */

export const DURATION_MS = {
  instant: 80,
  fast: 120,
  base: 200,
  slow: 320,
  slower: 560,
} as const;

export type DurationName = keyof typeof DURATION_MS;

export const EASING = {
  out: [0.2, 0.8, 0.2, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.4, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const SPRING = {
  press: { type: "spring", stiffness: 700, damping: 35, mass: 0.6 },
  layout: { type: "spring", stiffness: 380, damping: 36 },
  gentle: { type: "spring", stiffness: 170, damping: 26 },
} as const;

export const STAGGER_S = {
  list: 0.04,
  hero: 0.08,
} as const;

/** Lists longer than this appear at once instead of staggering. */
export const STAGGER_MAX_ITEMS = 8;

/** Above this many updates per second, values snap instead of tweening. */
export const TWEEN_MAX_UPDATES_PER_S = 5;

export function cssEasing(name: keyof typeof EASING): string {
  return `cubic-bezier(${EASING[name].join(", ")})`;
}
