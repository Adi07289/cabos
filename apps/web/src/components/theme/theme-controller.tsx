"use client";

import { useEffect } from "react";

import { DEFAULT_SITE, densityFor, resolveTheme } from "@/design/theme";

import { hydrateThemeStore, useThemeStore } from "./theme-store";

const RECHECK_MS = 60_000;

/**
 * Applies the theme, density and glove attributes to <html> (design §2.2). The pre-paint
 * script in <head> applies the last resolved theme before first paint; this recomputes the
 * auto theme from the sun and re-checks every minute.
 */
export function ThemeController() {
  const preference = useThemeStore((s) => s.preference);
  const glove = useThemeStore((s) => s.glove);
  const alertActive = useThemeStore((s) => s.alertActive);
  const setResolved = useThemeStore((s) => s.setResolved);

  useEffect(() => {
    hydrateThemeStore();
  }, []);

  useEffect(() => {
    const apply = () => {
      const root = document.documentElement;
      const current = root.getAttribute("data-theme") ?? undefined;
      const theme = resolveTheme(preference, {
        now: new Date(),
        lat: DEFAULT_SITE.lat,
        lon: DEFAULT_SITE.lon,
        current: current as Parameters<typeof resolveTheme>[1]["current"],
        alertActive,
      });
      root.setAttribute("data-theme", theme);
      root.setAttribute("data-density", densityFor(theme));
      setResolved(theme);
    };
    apply();
    if (preference !== "auto-cab") return;
    const id = window.setInterval(apply, RECHECK_MS);
    return () => window.clearInterval(id);
  }, [preference, alertActive, setResolved]);

  useEffect(() => {
    document.documentElement.setAttribute("data-glove", String(glove));
  }, [glove]);

  return null;
}
