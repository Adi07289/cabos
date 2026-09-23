"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => undefined;

/**
 * A value that only exists in the browser (device capabilities, "now"). Renders `null` on
 * the server and during hydration, then the real value, with no hydration mismatch.
 * `read` must return a primitive (or a stable reference) so React can compare snapshots.
 */
export function useClientValue<T extends string | number | boolean>(read: () => T): T | null {
  return useSyncExternalStore<T | null>(noopSubscribe, read, () => null);
}
