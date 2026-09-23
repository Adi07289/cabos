/** Haptic patterns per alert level (design §2.6). Never the only channel for an alert. */

export const HAPTIC_PATTERNS = {
  warn: [80],
  caution: [60, 60, 60],
  danger: [200, 100, 200],
  stop: [400, 100, 400, 100, 400],
  confirm: [20],
} as const satisfies Record<string, readonly number[]>;

export type HapticLevel = keyof typeof HAPTIC_PATTERNS;

/** Stop repeats every 1.5 s while active. */
export const STOP_REPEAT_MS = 1500;

type VibrateNavigator = { vibrate?: (pattern: number[]) => boolean };

export function hapticsSupported(nav: VibrateNavigator | undefined = globalThis.navigator): boolean {
  return typeof nav?.vibrate === "function";
}

/** Returns false when the device cannot vibrate (desktop, iOS Safari). */
export function vibrate(level: HapticLevel, nav: VibrateNavigator | undefined = globalThis.navigator): boolean {
  if (!nav || typeof nav.vibrate !== "function") return false;
  return nav.vibrate([...HAPTIC_PATTERNS[level]]);
}
