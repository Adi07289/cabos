/**
 * Colour tokens: the typed source of truth for docs/design.md §2.1.
 *
 * `src/styles/tokens.css` must contain exactly these values (enforced by
 * tokens.contrast.test.ts), and the /design page renders swatches and contrast from here.
 */

export const THEMES = ["cab-night", "cab-day", "office", "office-dark"] as const;
export type ThemeName = (typeof THEMES)[number];

/** Semantic roles every theme defines. CSS variable = `--${kebab(role)}`. */
export type Role =
  | "bg"
  | "surface"
  | "surfaceRaised"
  | "surfaceSunken"
  | "border"
  | "borderStrong"
  | "text"
  | "text2"
  | "text3"
  | "accent"
  | "accentHover"
  | "accentPressed"
  | "onAccent"
  | "accentText"
  | "safe"
  | "caution"
  | "danger"
  | "info"
  | "safeFill"
  | "cautionFill"
  | "onCautionFill"
  | "dangerFill"
  | "infoFill"
  | "stopFill"
  | "onStop"
  | "focusRing"
  | "focusOffset";

export type Palette = Record<Role, string>;

export const INK = {
  950: "#07090B",
  900: "#0B0E11",
  850: "#12161A",
  800: "#1A1F24",
  700: "#232A30",
  600: "#2A3138",
  500: "#3A434B",
  400: "#56606A",
  300: "#8B96A0",
  200: "#A7B0B8",
  100: "#D5DBE0",
  50: "#EEF1F3",
} as const;

export const PAPER = {
  0: "#FFFFFF",
  50: "#F6F6F2",
  100: "#ECECE6",
  200: "#DCDCD4",
  300: "#BDBDB3",
  500: "#8F8F86",
  700: "#4A4D51",
  800: "#3A3C3F",
  950: "#0E0F10",
} as const;

/** Signal Yellow: hue ≈ 57°, deliberately cooler than Caterpillar gold (≈ 48°). ADR-013. */
export const SIGNAL = {
  400: "#F3EC6A",
  500: "#EDE33B",
  600: "#CFC521",
  ink: "#544C00",
} as const;

const night: Palette = {
  bg: INK[900],
  surface: INK[850],
  surfaceRaised: INK[800],
  surfaceSunken: INK[950],
  border: INK[600],
  borderStrong: INK[500],
  text: INK[50],
  text2: INK[200],
  text3: INK[300],
  accent: SIGNAL[500],
  accentHover: SIGNAL[400],
  accentPressed: SIGNAL[600],
  onAccent: INK[900],
  accentText: SIGNAL[500],
  safe: "#3DDC97",
  caution: "#FFB020",
  danger: "#FF7A70",
  info: "#5AB0FF",
  safeFill: "#113524",
  cautionFill: "#FFB020",
  onCautionFill: INK[900],
  dangerFill: "#3A1412",
  infoFill: "#0F2336",
  stopFill: "#FF3B30",
  onStop: INK[900],
  focusRing: SIGNAL[500],
  focusOffset: INK[900],
};

const day: Palette = {
  bg: PAPER[50],
  surface: PAPER[0],
  surfaceRaised: PAPER[0],
  surfaceSunken: PAPER[100],
  border: PAPER[200],
  borderStrong: PAPER[300],
  text: PAPER[950],
  text2: PAPER[800],
  text3: PAPER[700],
  accent: SIGNAL[500],
  accentHover: SIGNAL[400],
  accentPressed: SIGNAL[600],
  onAccent: PAPER[950],
  accentText: SIGNAL.ink,
  safe: "#055C35",
  caution: "#6E4000",
  danger: "#961A13",
  info: "#0C4A99",
  safeFill: "#DDF2E6",
  cautionFill: "#FFB020",
  onCautionFill: PAPER[950],
  dangerFill: "#FBE3E1",
  infoFill: "#E1ECFA",
  stopFill: "#C4211A",
  onStop: PAPER[0],
  focusRing: PAPER[950],
  focusOffset: SIGNAL[500],
};

const office: Palette = {
  ...day,
  text2: "#5B6168",
  text3: "#62686F",
};

export const PALETTES: Record<ThemeName, Palette> = {
  "cab-night": night,
  "cab-day": day,
  office,
  "office-dark": night,
};

/** Data-viz series (Okabe-Ito derived, yellow removed to avoid the accent). Order is fixed. */
export const DATAVIZ: Record<"night" | "day", readonly string[]> = {
  night: ["#56B4E9", "#E69F00", "#2FB58A", "#CC79A7", "#D55E00", "#A7B0B8"],
  day: ["#0072B2", "#A65F00", "#00785A", "#A34E83", "#B34700", "#4A4D51"],
};

export const TEXT_ROLES = [
  "text",
  "text2",
  "text3",
  "accentText",
  "safe",
  "caution",
  "danger",
  "info",
] as const satisfies readonly Role[];

/**
 * Minimum contrast for text roles on each theme's backgrounds (design §2.2, §8).
 * Cab Daylight is AAA (7:1) on every surface: the sunlight requirement.
 */
export const TEXT_CONTRAST_TARGET: Record<ThemeName, number> = {
  "cab-night": 4.5,
  "cab-day": 7,
  office: 4.5,
  "office-dark": 4.5,
};

export function cssVar(role: Role): string {
  return `--${role.replace(/[A-Z0-9]/g, (c) => `-${c.toLowerCase()}`)}`;
}
