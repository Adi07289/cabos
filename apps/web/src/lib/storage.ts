/**
 * localStorage that never throws: private windows, blocked storage and SSR all fall back to
 * "no value". Only per-viewer conveniences live here (theme, glove mode), never domain state.
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // storage unavailable: the setting simply won't persist
    }
  },
};
