"use client";

import { useThemeStore } from "@/components/theme/theme-store";
import { Badge } from "@/components/ui/badge";
import { contrast, grade } from "@/design/contrast";
import {
  DATAVIZ,
  INK,
  PALETTES,
  PAPER,
  SIGNAL,
  TEXT_CONTRAST_TARGET,
  TEXT_ROLES,
  cssVar,
  type Role,
} from "@/design/palette";

function Ramp({ name, ramp }: { name: string; ramp: Record<string | number, string> }) {
  return (
    <div>
      <p className="mb-2 text-label text-text-3 uppercase">{name}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] overflow-hidden rounded-md ring-1 ring-border">
        {Object.entries(ramp).map(([step, hex]) => (
          <div key={step} className="flex min-w-0 flex-col">
            <div className="h-14" style={{ background: hex }} />
            <div className="bg-surface px-1.5 py-1 font-mono text-[11px] leading-4 text-text-2">
              <div>{step}</div>
              <div className="truncate uppercase">{hex.slice(1)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SURFACE_ROLES: Role[] = ["bg", "surface", "surfaceRaised", "surfaceSunken", "border", "borderStrong"];
const FILL_ROLES: [Role, Role][] = [
  ["accent", "onAccent"],
  ["cautionFill", "onCautionFill"],
  ["stopFill", "onStop"],
  ["safeFill", "text"],
  ["dangerFill", "text"],
  ["infoFill", "text"],
];

export function Colour() {
  const theme = useThemeStore((s) => s.resolved);
  const p = PALETTES[theme];
  const target = TEXT_CONTRAST_TARGET[theme];
  const viz = theme === "cab-night" || theme === "office-dark" ? DATAVIZ.night : DATAVIZ.day;

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-6">
        <Ramp name="Ink (dark themes)" ramp={INK} />
        <Ramp name="Paper (light themes)" ramp={PAPER} />
        <Ramp name="Signal Yellow (accent, never caution)" ramp={SIGNAL} />
      </div>

      <div>
        <p className="mb-3 text-body-sm text-text-2">
          Text roles on <span className="font-mono">{theme}</span>. Contrast is computed live against{" "}
          <span className="font-mono">--bg</span> and <span className="font-mono">--surface</span>. Target for this
          theme: <span className="tabular font-medium text-text">{target}:1</span>.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TEXT_ROLES.map((role) => {
            const worst = Math.min(contrast(p[role], p.bg), contrast(p[role], p.surface));
            const ok = worst >= target;
            return (
              <div key={role} className="rounded-md border border-border bg-surface p-3">
                <p className="text-h3" style={{ color: p[role] }}>
                  Aa 1234
                </p>
                <p className="mt-1 font-mono text-mono-sm text-text-2">{cssVar(role)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="tabular font-mono text-mono-sm text-text">{worst.toFixed(2)}:1</span>
                  <Badge tone={ok ? "safe" : "danger"}>{ok ? grade(worst) : "below target"}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-label text-text-3 uppercase">Surfaces</p>
          <div className="grid grid-cols-3 gap-2">
            {SURFACE_ROLES.map((role) => (
              <div key={role} className="rounded-md ring-1 ring-border-strong">
                <div className="h-12 rounded-t-md" style={{ background: p[role] }} />
                <p className="px-2 py-1 font-mono text-mono-sm text-text-2">{cssVar(role)}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-label text-text-3 uppercase">Fills with their text</p>
          <div className="grid grid-cols-2 gap-2">
            {FILL_ROLES.map(([fill, on]) => (
              <div
                key={fill}
                className="flex items-center justify-between rounded-md px-3 py-2.5"
                style={{ background: p[fill], color: p[on] }}
              >
                <span className="text-body-sm font-medium">{cssVar(fill)}</span>
                <span className="tabular font-mono text-mono-sm">{contrast(p[fill], p[on]).toFixed(1)}:1</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-label text-text-3 uppercase">
          Data-viz series (colour-blind safe; also differ by dash)
        </p>
        <svg
          viewBox="0 0 600 120"
          className="w-full max-w-3xl"
          role="img"
          aria-label="Six data-visualisation series colours with distinct dash patterns"
        >
          {viz.map((hex, i) => (
            <g key={hex}>
              <line
                x1={20}
                x2={470}
                y1={12 + i * 19}
                y2={12 + i * 19}
                stroke={hex}
                strokeWidth={3}
                strokeDasharray={["", "10 5", "2 5", "14 4 2 4", "6 6", "1 3"][i]}
                strokeLinecap="round"
              />
              <text x={485} y={16 + i * 19} className="fill-text-2 font-mono" fontSize={12}>
                viz-{i + 1} {hex}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
