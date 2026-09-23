"use client";

import { create } from "zustand";

import { THEMES, type ThemeName } from "@/design/palette";
import { STORAGE_KEYS, type ThemePreference } from "@/design/theme";
import { safeStorage } from "@/lib/storage";

type ThemeState = {
  preference: ThemePreference;
  resolved: ThemeName;
  glove: boolean;
  /** Set by the safety layer (P4) so auto-switching waits during ALARM/Stop/Danger. */
  alertActive: boolean;
  setPreference: (pref: ThemePreference) => void;
  setResolved: (theme: ThemeName) => void;
  setGlove: (on: boolean) => void;
  setAlertActive: (on: boolean) => void;
};

function readPreference(): ThemePreference {
  const raw = safeStorage.get(STORAGE_KEYS.preference);
  return raw === "auto-cab" || (THEMES as readonly string[]).includes(raw ?? "")
    ? (raw as ThemePreference)
    : "auto-cab";
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "auto-cab",
  resolved: "cab-night",
  glove: false,
  alertActive: false,
  setPreference: (preference) => {
    safeStorage.set(STORAGE_KEYS.preference, preference);
    set({ preference });
  },
  setResolved: (resolved) => {
    safeStorage.set(STORAGE_KEYS.resolved, resolved);
    set({ resolved });
  },
  setGlove: (glove) => {
    safeStorage.set(STORAGE_KEYS.glove, String(glove));
    set({ glove });
  },
  setAlertActive: (alertActive) => set({ alertActive }),
}));

/** Load persisted settings once on the client (after hydration, to avoid mismatches). */
export function hydrateThemeStore(): void {
  useThemeStore.setState({
    preference: readPreference(),
    glove: safeStorage.get(STORAGE_KEYS.glove) === "true",
  });
}
