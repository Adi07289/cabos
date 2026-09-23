import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { ThemeController } from "@/components/theme/theme-controller";
import { PRE_PAINT_SCRIPT } from "@/design/theme";

import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CabOS", template: "%s · CabOS" },
  description: "The operating system for the cab: a smart operator assistant designed for Cat® machine operators.",
};

export const viewport: Viewport = {
  themeColor: "#0B0E11",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={fontVariables}
      data-theme="cab-night"
      data-density="cab"
      data-glove="false"
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved theme before first paint (Next 16 "preventing flash" guide). */}
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <ThemeController />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
