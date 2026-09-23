import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { contrast } from "./contrast";
import { DURATION_MS, EASING, cssEasing } from "./motion";
import {
  DATAVIZ,
  PALETTES,
  TEXT_CONTRAST_TARGET,
  TEXT_ROLES,
  THEMES,
  cssVar,
  type Role,
  type ThemeName,
} from "./palette";

const css = readFileSync(fileURLToPath(new URL("../styles/tokens.css", import.meta.url)), "utf8");

/** Variables declared in the rule whose selector list includes `[data-theme="<theme>"]`. */
function themeBlock(theme: ThemeName): Record<string, string> {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const rule = rules.find(([, selector]) => selector.includes(`[data-theme="${theme}"]`));
  if (!rule) throw new Error(`no CSS block for ${theme}`);
  return Object.fromEntries(
    [...rule[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim().toLowerCase()]),
  );
}

describe("tokens.css matches palette.ts", () => {
  it.each(THEMES)("%s", (theme) => {
    const vars = themeBlock(theme);
    for (const [role, hex] of Object.entries(PALETTES[theme]) as [Role, string][]) {
      expect(vars[cssVar(role)], `${theme} ${cssVar(role)}`).toBe(hex.toLowerCase());
    }
    const viz = theme === "cab-night" || theme === "office-dark" ? DATAVIZ.night : DATAVIZ.day;
    viz.forEach((hex, i) => expect(vars[`--viz-${i + 1}`]).toBe(hex.toLowerCase()));
  });

  it("durations and easings match motion.ts", () => {
    for (const [name, ms] of Object.entries(DURATION_MS)) {
      expect(css).toContain(`--dur-${name}: ${ms}ms;`);
    }
    expect(css).toContain(`--ease-out: ${cssEasing("out")};`);
    expect(css).toContain(`--ease-in-out: ${cssEasing("inOut")};`);
    expect(css).toContain(`--ease-in: ${cssEasing("in")};`);
    expect(Object.keys(EASING)).toHaveLength(3);
  });
});

describe("contrast (design §2.1, §8)", () => {
  const backgrounds: Role[] = ["bg", "surface", "surfaceRaised"];

  it.each(THEMES)("%s: every text role meets its target on every surface", (theme) => {
    const p = PALETTES[theme];
    const target = TEXT_CONTRAST_TARGET[theme];
    for (const role of TEXT_ROLES) {
      for (const bg of backgrounds) {
        const ratio = contrast(p[role], p[bg]);
        expect(ratio, `${theme} ${role} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(target);
      }
    }
  });

  it("Cab Daylight is AAA for all text (sunlight legibility)", () => {
    expect(TEXT_CONTRAST_TARGET["cab-day"]).toBe(7);
  });

  it.each(THEMES)("%s: text on fills is readable", (theme) => {
    const p = PALETTES[theme];
    expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.onCautionFill, p.cautionFill)).toBeGreaterThanOrEqual(7);
    // Stop banners use display-size text only, where 4.5:1 is AAA (large text).
    expect(contrast(p.onStop, p.stopFill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.text, p.dangerFill)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.text, p.safeFill)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.text, p.infoFill)).toBeGreaterThanOrEqual(7);
  });

  it.each(THEMES)("%s: focus indicator is visible (≥ 3:1 against bg)", (theme) => {
    const p = PALETTES[theme];
    const best = Math.max(contrast(p.focusRing, p.bg), contrast(p.focusOffset, p.bg));
    expect(best).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ["night", PALETTES["cab-night"].bg],
    ["day", PALETTES["cab-day"].bg],
  ] as const)("data-viz %s series are ≥ 3:1 against the background", (mode, bg) => {
    for (const hex of DATAVIZ[mode]) {
      expect(contrast(hex, bg), hex).toBeGreaterThanOrEqual(3);
    }
  });

  it("the accent is never the caution colour (ADR-013)", () => {
    for (const theme of THEMES) {
      expect(PALETTES[theme].accent).not.toBe(PALETTES[theme].caution);
      expect(PALETTES[theme].accent).not.toBe(PALETTES[theme].cautionFill);
    }
  });
});
