import en from "../../messages/en.json";

export type Messages = typeof en;
type Tree = { [key: string]: string | Tree };

/** Missing keys fall back to English, so a partial catalogue (Tamil) never shows raw keys. */
export function withFallback(partial: Tree, base: Tree = en): Tree {
  const out: Tree = {};
  for (const [key, value] of Object.entries(base)) {
    const override = partial[key];
    if (typeof value === "string") out[key] = typeof override === "string" ? override : value;
    else out[key] = withFallback(typeof override === "object" ? override : {}, value);
  }
  return out;
}
