import { describe, expect, it, vi } from "vitest";

import { HAPTIC_PATTERNS, hapticsSupported, vibrate } from "./haptics";
import { SOUND_SPECS, soundDuration } from "./sound";

describe("haptic patterns (design §2.6)", () => {
  it("match the spec", () => {
    expect(HAPTIC_PATTERNS).toEqual({
      warn: [80],
      caution: [60, 60, 60],
      danger: [200, 100, 200],
      stop: [400, 100, 400, 100, 400],
      confirm: [20],
    });
  });

  it("escalate: each level vibrates longer than the one below", () => {
    const total = (p: readonly number[]) => p.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    expect(total(HAPTIC_PATTERNS.warn)).toBeLessThan(total(HAPTIC_PATTERNS.caution) + 1);
    expect(total(HAPTIC_PATTERNS.caution)).toBeLessThan(total(HAPTIC_PATTERNS.danger));
    expect(total(HAPTIC_PATTERNS.danger)).toBeLessThan(total(HAPTIC_PATTERNS.stop));
  });

  it("calls navigator.vibrate with a copy of the pattern", () => {
    const nav = { vibrate: vi.fn(() => true) };
    expect(vibrate("danger", nav)).toBe(true);
    expect(nav.vibrate).toHaveBeenCalledWith([200, 100, 200]);
  });

  it("reports unsupported devices instead of throwing", () => {
    expect(hapticsSupported({})).toBe(false);
    expect(vibrate("stop", {})).toBe(false);
  });
});

describe("sound specs (design §2.6)", () => {
  it("warn is two tones 660 → 880 Hz, 120 ms each", () => {
    expect(SOUND_SPECS.warn.map((t) => [t.frequency, t.duration])).toEqual([
      [660, 0.12],
      [880, 0.12],
    ]);
  });

  it("alarm is 880 Hz square, 250 ms on / 250 ms off", () => {
    for (const [i, tone] of SOUND_SPECS.alarm.entries()) {
      expect(tone).toMatchObject({ frequency: 880, wave: "square", duration: 0.25, at: i * 0.5 });
    }
  });

  it("stop is continuous 1 kHz with 4 Hz amplitude modulation", () => {
    expect(SOUND_SPECS.stop).toEqual([{ at: 0, duration: 1.5, frequency: 1000, wave: "sine", amHz: 4 }]);
  });

  it("confirm is a soft 30 ms tick", () => {
    expect(soundDuration("confirm")).toBeCloseTo(0.03);
  });
});
