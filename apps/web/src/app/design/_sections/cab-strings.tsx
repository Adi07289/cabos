import { getLocale, getTranslations } from "next-intl/server";

export async function CabStrings() {
  const t = await getTranslations("cab");
  const locale = await getLocale();
  const rows: [string, string][] = [
    ["cab.nav.shift", t("nav.shift")],
    ["cab.nav.guardian", t("nav.guardian")],
    ["cab.nav.academy", t("nav.academy")],
    ["cab.action.startShift", t("action.startShift")],
    ["cab.action.logNearMiss", t("action.logNearMiss")],
    ["cab.alert.fastenSeatbelt", t("alert.fastenSeatbelt")],
    ["cab.alert.unbuckledFor", t("alert.unbuckledFor", { elapsed: "00:14", alarmAt: "00:30" })],
    ["cab.alert.linkLost", t("alert.linkLost")],
    ["cab.greeting.morning", t("greeting.morning", { name: "Ravi" })],
  ];
  return (
    <div>
      <p className="mb-4 text-body-sm text-text-2">
        Rendered with next-intl in <span className="font-mono">{locale}</span>. Tamil has no strings yet and falls back
        to English; Hindi covers every cab string (a native speaker should review it).
      </p>
      <dl className="divide-y divide-border rounded-md border border-border bg-surface">
        {rows.map(([key, value]) => (
          <div key={key} className="grid gap-1 px-4 py-3 md:grid-cols-[18rem_1fr]">
            <dt className="font-mono text-mono-sm text-text-3">{key}</dt>
            <dd className="text-body-cab">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
