import { describe, expect, it } from "vitest";

import fixtures from "./__fixtures__/sun-astral.json";
import { sunTimes } from "./sun";

// Reference values from the independent Python `astral` library (generated in Phase 1).
type Fixture = { site: string; lat: number; lon: number; date: string; sunrise: string; sunset: string };

const minutesApart = (a: Date, b: string) => Math.abs(a.getTime() - new Date(b).getTime()) / 60_000;

describe("sunTimes vs astral", () => {
  // When a sunrise falls near midnight UTC (e.g. Gurugram in June: 05:23 IST = 23:53 UTC), the
  // two libraries may file it under adjacent UTC dates. Compare with the nearest event from the
  // neighbouring days: that is how daylight() uses these times too.
  const nearest = (lat: number, lon: number, date: string, pick: "sunrise" | "sunset", ref: string) =>
    Math.min(
      ...[-1, 0, 1].map((offset) => {
        const t = sunTimes(new Date(new Date(`${date}T12:00:00Z`).getTime() + offset * 86_400_000), lat, lon);
        return t.kind === "normal" ? minutesApart(t[pick], ref) : Number.POSITIVE_INFINITY;
      }),
    );

  it.each(fixtures as Fixture[])("$site $date", (f) => {
    // Mid-latitudes within 2 min; near the Arctic Circle the sun grazes the horizon, so 6 min.
    const tolerance = Math.abs(f.lat) > 60 ? 6 : 2;
    expect(nearest(f.lat, f.lon, f.date, "sunrise", f.sunrise)).toBeLessThan(tolerance);
    expect(nearest(f.lat, f.lon, f.date, "sunset", f.sunset)).toBeLessThan(tolerance);
  });

  it("reports polar day and polar night instead of failing", () => {
    expect(sunTimes(new Date("2026-06-21T12:00:00Z"), 78.22, 15.65).kind).toBe("polar-day");
    expect(sunTimes(new Date("2026-12-21T12:00:00Z"), 78.22, 15.65).kind).toBe("polar-night");
  });
});
