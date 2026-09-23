import { describe, expect, it } from "vitest";

import { sunTimes } from "./sun";
import { DEFAULT_SITE, HYSTERESIS_MS, autoCabTheme, daylight, densityFor, resolveTheme } from "./theme";

const { lat, lon } = DEFAULT_SITE; // Chennai
const at = (iso: string) => new Date(iso);

describe("autoCabTheme", () => {
  it("is day at Chennai noon IST and night at midnight IST", () => {
    expect(autoCabTheme({ now: at("2026-09-23T06:30:00Z"), lat, lon })).toBe("cab-day");
    expect(autoCabTheme({ now: at("2026-09-23T18:30:00Z"), lat, lon })).toBe("cab-night");
  });

  it("handles a local night that spans two UTC dates", () => {
    // 05:00 IST on 24 Sep = 23:30 UTC on 23 Sep: still dark in Chennai.
    expect(autoCabTheme({ now: at("2026-09-23T23:30:00Z"), lat, lon })).toBe("cab-night");
  });

  it("keeps the current theme within the hysteresis window around sunrise", () => {
    const t = sunTimes(at("2026-09-23T12:00:00Z"), lat, lon);
    if (t.kind !== "normal") throw new Error("expected normal day");
    const justAfterSunrise = new Date(t.sunrise.getTime() + 5 * 60_000);
    expect(autoCabTheme({ now: justAfterSunrise, lat, lon, current: "cab-night" })).toBe("cab-night");
    const wellAfter = new Date(t.sunrise.getTime() + HYSTERESIS_MS + 60_000);
    expect(autoCabTheme({ now: wellAfter, lat, lon, current: "cab-night" })).toBe("cab-day");
  });

  it("never switches during an active alert", () => {
    expect(autoCabTheme({ now: at("2026-09-23T06:30:00Z"), lat, lon, current: "cab-night", alertActive: true })).toBe(
      "cab-night",
    );
  });

  it("uses polar day/night correctly", () => {
    expect(daylight(at("2026-06-21T12:00:00Z"), 78.22, 15.65).isDay).toBe(true);
    expect(daylight(at("2026-12-21T12:00:00Z"), 78.22, 15.65).isDay).toBe(false);
  });
});

describe("resolveTheme and density", () => {
  it("explicit preferences win", () => {
    expect(resolveTheme("office", { now: at("2026-09-23T18:30:00Z"), lat, lon })).toBe("office");
  });
  it("auto-cab resolves by the sun", () => {
    expect(resolveTheme("auto-cab", { now: at("2026-09-23T06:30:00Z"), lat, lon })).toBe("cab-day");
  });
  it("cab themes use cab density", () => {
    expect(densityFor("cab-night")).toBe("cab");
    expect(densityFor("office")).toBe("compact");
  });
});
