const SPACE = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
const RADII = [
  ["xs", 4, "chips"],
  ["sm", 8, "inputs"],
  ["md", 12, "buttons"],
  ["lg", 16, "cards"],
  ["xl", 24, "sheets"],
] as const;
const ELEVATION = ["e1", "e2", "e3"] as const;

export function LayoutTokens() {
  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div>
        <p className="mb-3 text-label text-text-3 uppercase">Spacing · 4 px base</p>
        <ul className="flex flex-col gap-1.5">
          {SPACE.map((px) => (
            <li key={px} className="flex items-center gap-3">
              <span className="tabular w-10 text-right font-mono text-mono-sm text-text-2">{px}</span>
              <span className="h-3 rounded-xs bg-accent" style={{ width: px }} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-3 text-label text-text-3 uppercase">Radii</p>
        <div className="grid grid-cols-2 gap-3">
          {RADII.map(([name, px, use]) => (
            <div key={name} className="border border-border-strong bg-surface-raised p-3" style={{ borderRadius: px }}>
              <p className="font-mono text-mono-sm">
                r-{name} · {px}px
              </p>
              <p className="text-body-sm text-text-3">{use}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-label text-text-3 uppercase">Elevation</p>
        <div className="flex flex-col gap-4">
          {ELEVATION.map((e) => (
            <div key={e} className="rounded-lg bg-surface-raised p-4" style={{ boxShadow: `var(--${e})` }}>
              <p className="font-mono text-mono-sm">--{e}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
