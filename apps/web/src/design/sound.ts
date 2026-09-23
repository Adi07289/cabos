/**
 * Alert sounds, synthesised with Web Audio (design §2.6): no audio files, works offline.
 * Each sound is data (`SOUND_SPECS`), so the patterns are unit-tested; `playSound` renders it.
 */

export type Tone = {
  /** Start offset from play time, seconds. */
  at: number;
  duration: number;
  frequency: number;
  wave: OscillatorType;
  /** Amplitude modulation in Hz (0 = none). */
  amHz?: number;
};

export type SoundName = "warn" | "alarm" | "stop" | "confirm";

function repeat(tone: Omit<Tone, "at">, times: number, periodS: number): Tone[] {
  return Array.from({ length: times }, (_, i) => ({ ...tone, at: i * periodS }));
}

export const SOUND_SPECS: Record<SoundName, readonly Tone[]> = {
  // Two tones 660 → 880 Hz, 120 ms each.
  warn: [
    { at: 0, duration: 0.12, frequency: 660, wave: "sine" },
    { at: 0.12, duration: 0.12, frequency: 880, wave: "sine" },
  ],
  // 880 Hz square, 250 ms on / 250 ms off. One call plays 2 s; callers repeat while active.
  alarm: repeat({ duration: 0.25, frequency: 880, wave: "square" }, 4, 0.5),
  // Continuous 1 kHz with 4 Hz amplitude modulation. One call plays 1.5 s.
  stop: [{ at: 0, duration: 1.5, frequency: 1000, wave: "sine", amHz: 4 }],
  // Soft 1.2 kHz, 30 ms.
  confirm: [{ at: 0, duration: 0.03, frequency: 1200, wave: "sine" }],
};

export const SOUND_GAIN: Record<SoundName, number> = {
  warn: 0.25,
  alarm: 0.3,
  stop: 0.35,
  confirm: 0.12,
};

export function soundDuration(name: SoundName): number {
  return Math.max(...SOUND_SPECS[name].map((t) => t.at + t.duration));
}

let sharedContext: AudioContext | null = null;

/** Browsers only allow audio after a user gesture; call this from a tap (onboarding step 5). */
export async function unlockAudio(): Promise<AudioContext | null> {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  sharedContext ??= new window.AudioContext();
  if (sharedContext.state === "suspended") await sharedContext.resume();
  return sharedContext;
}

/** Plays a sound; resolves with a function that stops it early. */
export async function playSound(name: SoundName): Promise<() => void> {
  const ctx = await unlockAudio();
  if (!ctx) return () => undefined;
  const master = ctx.createGain();
  master.gain.value = SOUND_GAIN[name];
  master.connect(ctx.destination);
  const t0 = ctx.currentTime + 0.01;
  const nodes: OscillatorNode[] = [];

  for (const tone of SOUND_SPECS[name]) {
    const osc = ctx.createOscillator();
    osc.type = tone.wave;
    osc.frequency.value = tone.frequency;
    const env = ctx.createGain();
    const start = t0 + tone.at;
    const end = start + tone.duration;
    // 5 ms ramps avoid clicks.
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(1, start + 0.005);
    env.gain.setValueAtTime(1, end - 0.005);
    env.gain.linearRampToValueAtTime(0, end);
    osc.connect(env);
    if (tone.amHz) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      const am = ctx.createGain();
      lfo.frequency.value = tone.amHz;
      depth.gain.value = 0.5;
      am.gain.value = 0.5;
      lfo.connect(depth).connect(am.gain);
      env.connect(am).connect(master);
      lfo.start(start);
      lfo.stop(end);
      nodes.push(lfo);
    } else {
      env.connect(master);
    }
    osc.start(start);
    osc.stop(end);
    nodes.push(osc);
  }

  return () => {
    for (const node of nodes) {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    }
    master.disconnect();
  };
}
