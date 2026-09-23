/**
 * Theme resolution (design §2.2). Pure functions, so they are unit-tested and reused by the
 * inline pre-paint script and the ThemeController.
 */

import { type ThemeName } from "./palette";
import { sunTimes } from "./sun";

export type ThemePreference = ThemeName | "auto-cab";
export type Density = "cab" | "compact";

export const STORAGE_KEYS = {
  preference: "cabos.theme.preference",
  resolved: "cabos.theme.resolved",
  density: "cabos.density",
  glove: "cabos.glove",
} as const;

/** Demo site until sites come from the API in P2 (Chennai highway project). */
export const DEFAULT_SITE = { name: "Chennai highway project", lat: 13.0827, lon: 80.2707 };

/** Near a sunrise/sunset boundary, keep the current theme to avoid flicker. */
export const HYSTERESIS_MS = 20 * 60 * 1000;

export type AutoCabInput = {
  now: Date;
  lat: number;
  lon: number;
  /** Theme currently shown, if any. */
  current?: "cab-night" | "cab-day";
  /** A theme switch never happens during an active ALARM, Stop or Danger alert. */
  alertActive?: boolean;
};

/** Is the sun up at `now`? Also returns the nearest sunrise/sunset boundary. */
export function daylight(now: Date, lat: number, lon: number): { isDay: boolean; nearestBoundaryMs: number } {
  let isDay = false;
  let nearest = Number.POSITIVE_INFINITY;
  // The local day can straddle two UTC dates, so look at yesterday, today and tomorrow (UTC).
  for (const offset of [-1, 0, 1]) {
    const day = new Date(now.getTime() + offset * 86_400_000);
    const times = sunTimes(day, lat, lon);
    if (times.kind === "polar-day") {
      if (offset === 0) isDay = true;
      continue;
    }
    if (times.kind === "polar-night") continue;
    const t = now.getTime();
    if (t >= times.sunrise.getTime() && t < times.sunset.getTime()) isDay = true;
    nearest = Math.min(nearest, Math.abs(t - times.sunrise.getTime()), Math.abs(t - times.sunset.getTime()));
  }
  return { isDay, nearestBoundaryMs: nearest };
}

export function autoCabTheme({ now, lat, lon, current, alertActive }: AutoCabInput): "cab-night" | "cab-day" {
  if (current && alertActive) return current;
  const { isDay, nearestBoundaryMs } = daylight(now, lat, lon);
  if (current && nearestBoundaryMs < HYSTERESIS_MS) return current;
  return isDay ? "cab-day" : "cab-night";
}

export function resolveTheme(
  pref: ThemePreference,
  input: Omit<AutoCabInput, "current"> & { current?: ThemeName },
): ThemeName {
  if (pref !== "auto-cab") return pref;
  const current = input.current === "cab-day" || input.current === "cab-night" ? input.current : undefined;
  return autoCabTheme({ ...input, current });
}

export function densityFor(theme: ThemeName): Density {
  return theme.startsWith("cab") ? "cab" : "compact";
}

/**
 * Runs in <head> before first paint (Next 16 "preventing flash" guide): applies the last
 * resolved theme and ergonomics so the page never flashes the wrong theme. Kept tiny and
 * dependency-free; ThemeController recomputes the auto theme after hydration.
 */
export const PRE_PAINT_SCRIPT = `(function(){try{var d=document.documentElement,s=localStorage;var t=s.getItem(${JSON.stringify(
  STORAGE_KEYS.resolved,
)});if(t){d.setAttribute("data-theme",t);d.setAttribute("data-density",t.indexOf("cab")===0?"cab":"compact")}var g=s.getItem(${JSON.stringify(
  STORAGE_KEYS.glove,
)});if(g)d.setAttribute("data-glove",g)}catch(e){}})()`;
