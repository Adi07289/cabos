import { Barlow_Condensed, Geist, Geist_Mono, Instrument_Serif, Noto_Sans_Devanagari } from "next/font/google";

// Self-hosted by next/font at build time: no runtime requests to Google (design §2.3).
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
export const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});
export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument",
  display: "swap",
});
export const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-devanagari",
  display: "swap",
});

export const fontVariables = [geist, geistMono, barlow, instrument, devanagari].map((f) => f.variable).join(" ");
