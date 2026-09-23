import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const API_ORIGIN = process.env.CABOS_API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Same-origin API through a proxy rewrite; WebSockets connect directly (ADR-015).
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
