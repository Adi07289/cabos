"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";

import { useThemeStore } from "@/components/theme/theme-store";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { THEMES } from "@/design/palette";
import { sunTimes } from "@/design/sun";
import { DEFAULT_SITE, type ThemePreference } from "@/design/theme";
import { LOCALES, LOCALE_LABEL, type Locale, writeLocaleCookie } from "@/i18n/config";
import { useClientValue } from "@/lib/use-client-value";

const PREFS: { value: ThemePreference; label: string }[] = [
  { value: "auto-cab", label: "Auto (sun)" },
  ...THEMES.map((t) => ({ value: t, label: t.replace("-", " ") })),
];

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Kolkata",
});

function sunLine(): string {
  const t = sunTimes(new Date(), DEFAULT_SITE.lat, DEFAULT_SITE.lon);
  return t.kind === "normal"
    ? `${DEFAULT_SITE.name}: sunrise ${timeFmt.format(t.sunrise)}, sunset ${timeFmt.format(t.sunset)} IST`
    : `${DEFAULT_SITE.name}: ${t.kind}`;
}

function SunLine() {
  // Browser-only: the server and the browser may disagree about "now".
  const text = useClientValue(sunLine);
  return <p className="tabular text-body-sm text-text-3">{text ?? "\u00a0"}</p>;
}

export function Controls() {
  const { preference, resolved, glove, setPreference, setGlove } = useThemeStore();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setLocale = (next: Locale) => {
    writeLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-e1">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Theme">
        <span className="w-20 text-label text-text-3 uppercase">Theme</span>
        {PREFS.map((p) => (
          <Chip key={p.value} selected={preference === p.value} onClick={() => setPreference(p.value)}>
            {p.label}
          </Chip>
        ))}
        <span className="ml-auto font-mono text-mono-sm text-text-2">
          data-theme=<span className="text-accent-text">{resolved}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Language">
        <span className="w-20 text-label text-text-3 uppercase">Language</span>
        {LOCALES.map((l) => (
          <Chip key={l} selected={locale === l} disabled={pending} onClick={() => setLocale(l)} lang={l}>
            {LOCALE_LABEL[l]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-20 text-label text-text-3 uppercase">Glove</span>
        <Switch id="glove" checked={glove} onCheckedChange={setGlove} aria-describedby="glove-help" />
        <label htmlFor="glove" id="glove-help" className="text-body-sm text-text-2">
          Glove mode: cab targets grow from 56 px to 72 px
        </label>
      </div>
      <SunLine />
    </div>
  );
}
