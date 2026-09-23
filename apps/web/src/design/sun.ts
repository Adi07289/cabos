/**
 * Sunrise and sunset from latitude/longitude, with no network (design §2.2: Cab themes
 * switch automatically at local sunrise and sunset).
 *
 * The standard sunrise equation (NOAA-style approximation), using −0.833° for atmospheric
 * refraction and the solar disc radius. Checked against the independent `astral` library in
 * sun.test.ts: within 2 minutes at mid-latitudes.
 */

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J2000 = 2451545;
const UNIX_EPOCH_JD = 2440587.5;
const OBLIQUITY = 23.4397 * RAD;
const HORIZON = -0.833 * RAD;

export type SunTimes =
  { kind: "normal"; sunrise: Date; sunset: Date } | { kind: "polar-day" } | { kind: "polar-night" };

const toJulian = (ms: number): number => ms / DAY_MS + UNIX_EPOCH_JD;
const fromJulian = (jd: number): Date => new Date(Math.round((jd - UNIX_EPOCH_JD) * DAY_MS));
const mod360 = (deg: number): number => ((deg % 360) + 360) % 360;

/**
 * Sun times for the UTC calendar day containing `day`.
 * `lon` is east-positive (Chennai = +80.27).
 */
export function sunTimes(day: Date, lat: number, lon: number): SunTimes {
  const noonUtc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 12);
  const n = Math.round(toJulian(noonUtc) - J2000 + 0.0008);
  const jStar = n - lon / 360;
  const m = mod360(357.5291 + 0.98560028 * jStar);
  const mr = m * RAD;
  const c = 1.9148 * Math.sin(mr) + 0.02 * Math.sin(2 * mr) + 0.0003 * Math.sin(3 * mr);
  const lambda = mod360(m + c + 180 + 102.9372) * RAD;
  const transit = J2000 + jStar + 0.0053 * Math.sin(mr) - 0.0069 * Math.sin(2 * lambda);
  const sinDecl = Math.sin(lambda) * Math.sin(OBLIQUITY);
  const cosDecl = Math.cos(Math.asin(sinDecl));
  const phi = lat * RAD;
  const cosOmega = (Math.sin(HORIZON) - Math.sin(phi) * sinDecl) / (Math.cos(phi) * cosDecl);
  if (cosOmega > 1) return { kind: "polar-night" };
  if (cosOmega < -1) return { kind: "polar-day" };
  const omegaDays = Math.acos(cosOmega) / (2 * Math.PI);
  return {
    kind: "normal",
    sunrise: fromJulian(transit - omegaDays),
    sunset: fromJulian(transit + omegaDays),
  };
}
