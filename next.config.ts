import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const cspDev = [
  "default-src 'self' blob: data:",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "connect-src 'self' ws: wss: http: https:",
].join("; ");

const cspProd = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  "script-src 'self' https:",
  "connect-src 'self' https:",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },

  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),

  { key: "Content-Security-Policy", value: isDev ? cspDev : cspProd },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
