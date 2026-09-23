const SCALE = [
  { token: "display-2xl", cls: "text-display-2xl", sample: "Calm until it matters.", note: "Geist 128/112 · −0.045em" },
  {
    token: "display-serif",
    cls: "font-serif text-display-xl italic",
    sample: "for the cab.",
    note: "Instrument Serif italic · landing only",
  },
  {
    token: "numeral-xl",
    cls: "font-numeral text-numeral-xl tabular",
    sample: "52 min",
    note: "Barlow Condensed 96/88 · P50 hero",
  },
  {
    token: "numeral-lg",
    cls: "font-numeral text-numeral-lg tabular",
    sample: "11.8 L",
    note: "Barlow Condensed 64/60 · cab KPIs",
  },
  {
    token: "numeral-md",
    cls: "font-numeral text-numeral-md tabular",
    sample: "0.705",
    note: "Barlow Condensed 40/40 · tiles",
  },
  { token: "h1", cls: "text-h1", sample: "Shift Deck", note: "Geist 40/44" },
  { token: "h2", cls: "text-h2", sample: "Guardian", note: "Geist 28/34" },
  { token: "h3", cls: "text-h3", sample: "Trenching · T002", note: "Geist 22/28" },
  {
    token: "body-cab",
    cls: "text-body-cab",
    sample: "Fasten seatbelt. Alarm in 16 seconds.",
    note: "Geist 20/30 · cab minimum 18 px",
  },
  { token: "body", cls: "text-body", sample: "Idle was 12% below your 14-day baseline.", note: "Geist 16/24 · office" },
  { token: "label", cls: "text-label uppercase", sample: "Overrun risk", note: "Geist 13/16 · +0.04em" },
  {
    token: "mono",
    cls: "font-mono text-mono tabular",
    sample: "idle_ratio 0.705 · n = 4,212",
    note: "Geist Mono 15/22 · evidence values",
  },
];

export function TypeScale() {
  return (
    <div className="divide-y divide-border">
      {SCALE.map((row) => (
        <div key={row.token} className="grid gap-2 py-4 md:grid-cols-[12rem_1fr] md:items-baseline">
          <div>
            <p className="font-mono text-mono-sm text-text">{row.token}</p>
            <p className="text-body-sm text-text-3">{row.note}</p>
          </div>
          <p className={`${row.cls} min-w-0 overflow-hidden text-ellipsis`}>{row.sample}</p>
        </div>
      ))}
    </div>
  );
}
