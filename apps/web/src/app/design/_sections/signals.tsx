"use client";

import { Volume2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HAPTIC_PATTERNS, hapticsSupported, vibrate, type HapticLevel } from "@/design/haptics";
import { SOUND_SPECS, playSound, soundDuration, type SoundName } from "@/design/sound";
import { useClientValue } from "@/lib/use-client-value";

const SOUNDS: { name: SoundName; label: string; describe: string }[] = [
  { name: "warn", label: "Warn chime", describe: "660 → 880 Hz, 120 ms each" },
  { name: "alarm", label: "Alarm tone", describe: "880 Hz square, 250 ms on/off" },
  { name: "stop", label: "Stop tone", describe: "1 kHz, 4 Hz modulation" },
  { name: "confirm", label: "Confirm tick", describe: "1.2 kHz, 30 ms" },
];

export function Signals() {
  const canVibrate = useClientValue(() => hapticsSupported());
  const [lastHaptic, setLastHaptic] = useState<string | null>(null);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <p className="mb-3 text-label text-text-3 uppercase">Sounds · synthesised with Web Audio</p>
        <ul className="flex flex-col gap-2">
          {SOUNDS.map((s) => (
            <li key={s.name} className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
              <Button
                variant="secondary"
                size="icon"
                aria-label={`Play ${s.label}`}
                onClick={() => void playSound(s.name)}
              >
                <Volume2 aria-hidden className="size-5" />
              </Button>
              <div className="flex-1">
                <p className="text-body font-medium">{s.label}</p>
                <p className="tabular font-mono text-mono-sm text-text-3">
                  {s.describe} · {soundDuration(s.name).toFixed(2)} s · {SOUND_SPECS[s.name].length} tone(s)
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-3 text-label text-text-3 uppercase">Haptics · navigator.vibrate</p>
        {canVibrate === false ? (
          <p className="mb-3 text-body-sm text-text-2">
            This device can&apos;t vibrate (desktop browsers and iOS Safari). The patterns still show below; on an
            Android tablet the buttons vibrate.
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {(Object.keys(HAPTIC_PATTERNS) as HapticLevel[]).map((level) => (
            <li key={level} className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
              <Button
                variant="secondary"
                disabled={canVibrate !== true}
                onClick={() => setLastHaptic(vibrate(level) ? level : null)}
              >
                {level}
              </Button>
              <span className="tabular flex-1 font-mono text-mono-sm text-text-2">
                [{HAPTIC_PATTERNS[level].join(", ")}] ms
              </span>
              {lastHaptic === level ? <Badge tone="safe">sent</Badge> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
