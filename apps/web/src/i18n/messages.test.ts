import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import ta from "../../messages/ta.json";
import { withFallback } from "./messages";

type Tree = { [key: string]: string | Tree };

const keys = (tree: Tree, prefix = ""): string[] =>
  Object.entries(tree).flatMap(([k, v]) => (typeof v === "string" ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`)));

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("message catalogues", () => {
  it("Hindi covers every Cab Mode (cab.*) string: required by the brief", () => {
    expect(keys(hi as Tree).sort()).toEqual(keys(en as Tree).sort());
  });

  it("Hindi keeps the same ICU placeholders", () => {
    const flat = (t: Tree) =>
      Object.fromEntries(
        keys(t).map((k) => [k, k.split(".").reduce<Tree | string>((n, p) => (n as Tree)[p], t) as string]),
      );
    const e = flat(en as Tree);
    const h = flat(hi as Tree);
    for (const k of Object.keys(e)) expect(placeholders(h[k]), k).toEqual(placeholders(e[k]));
  });

  it("an empty Tamil catalogue falls back to English instead of showing keys", () => {
    const merged = withFallback(ta as Tree);
    expect(keys(merged).sort()).toEqual(keys(en as Tree).sort());
    expect((merged.cab as Tree).nav).toEqual((en as Tree).cab && ((en as Tree).cab as Tree).nav);
  });
});
