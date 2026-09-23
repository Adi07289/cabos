import type { Metadata } from "next";

import { CabStrings } from "./_sections/cab-strings";
import { Colour } from "./_sections/colour";
import { ComponentsGallery } from "./_sections/components-gallery";
import { Controls } from "./_sections/controls";
import { LayoutTokens } from "./_sections/layout-tokens";
import { MotionPlayground } from "./_sections/motion-playground";
import { Section } from "./_sections/section";
import { Signals } from "./_sections/signals";
import { TypeScale } from "./_sections/type";

export const metadata: Metadata = {
  title: "Design system",
  description: "CabOS living style guide: every token and component, in every theme.",
};

const NAV = [
  ["colour", "Colour"],
  ["typography", "Type"],
  ["space-and-depth", "Space"],
  ["motion", "Motion"],
  ["sound-and-haptics", "Signals"],
  ["components", "Components"],
  ["cab-strings", "Language"],
] as const;

export default function DesignPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-8">
      <header className="flex flex-col gap-6 pt-12 pb-10">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-md bg-accent font-numeral text-xl font-bold text-on-accent"
          >
            C
          </span>
          <span className="text-h3">CabOS</span>
          <span className="text-body-sm text-text-3">Design system · v0.1</span>
        </div>
        <h1 className="max-w-4xl text-display-xl max-md:text-h1">
          Legible at arm&apos;s length. <span className="font-serif font-normal italic">Calm until it matters.</span>
        </h1>
        <p className="max-w-2xl text-body text-text-2">
          Every token and component used by CabOS, rendered live. Switch themes to see Cab Night, Cab Daylight (AAA for
          sunlight) and the Office themes; contrast is computed from the same values the app ships.
        </p>
        <Controls />
        <nav aria-label="Sections" className="flex flex-wrap gap-x-5 gap-y-2">
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-body-sm text-text-2 underline-offset-4 hover:text-text hover:underline"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Section
        id="colour"
        title="Colour"
        lede="Graphite surfaces, one Signal Yellow action, and semantic colours that only ever mean state."
      >
        <Colour />
      </Section>
      <Section
        id="typography"
        title="Typography"
        lede="Geist for UI, Geist Mono for evidence, Barlow Condensed for numbers read at a glance. Tabular figures wherever digits change."
      >
        <TypeScale />
      </Section>
      <Section id="space-and-depth" title="Space, radii and depth">
        <LayoutTokens />
      </Section>
      <Section
        id="motion"
        title="Motion"
        lede="Motion carries meaning: arrived, changed, moved, escalated. Nothing decorative inside the app."
      >
        <MotionPlayground />
      </Section>
      <Section
        id="sound-and-haptics"
        title="Sound and haptics"
        lede="Each alert level has its own sound and vibration. Neither is ever the only channel."
      >
        <Signals />
      </Section>
      <Section
        id="components"
        title="Components"
        lede="Radix primitives restyled to CabOS tokens. Cab sizes follow the 56 px (72 px glove) touch target."
      >
        <ComponentsGallery />
      </Section>
      <Section
        id="cab-strings"
        title="Language"
        lede="All Cab Mode strings exist in English and Hindi; the structure is ready for Tamil."
      >
        <CabStrings />
      </Section>
    </div>
  );
}
