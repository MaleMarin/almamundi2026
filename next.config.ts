import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' ${isDev ? "'unsafe-eval' " : ""}'unsafe-inline' https://*.firebaseapp.com https://www.google.com https://www.gstatic.com https://apis.google.com https://vercel.live https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://vercel.live https://*.cloudflare.com https://challenges.cloudflare.com https://storage.googleapis.com https://*.googleusercontent.com https://cdn.jsdelivr.net https://nominatim.openstreetmap.org",
  "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://*.firebaseapp.com https://challenges.cloudflare.com",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  /**
   * `public/` pesa ~380 MB (videos, texturas, audio). El file tracing de Next
   * lo metía entero en funciones como /api/submissions/photo (~414 MB) si algún
   * import usaba process.cwd() + "public". Esos archivos los sirve el CDN, no la función.
   */
  outputFileTracingExcludes: {
    "/*": [
      "./public/**/*",
      "./tmp-*/**/*",
      "./node_modules/playwright/**/*",
      "./node_modules/playwright-core/**/*",
      "./node_modules/@playwright/**/*",
    ],
  },
  outputFileTracingIncludes: {
    "/api/globe-texture": ["./public/textures/**/*"],
  },
  devIndicators: false,
  /** Menos reutilización de la caché del cliente en rutas dinámicas (p. ej. vuelta a `/`). */
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
  /**
   * No usar `#` en `destination`: Next no soporta fragmentos y puede romper el enrutado en dev.
   * Mapa dedicado: `app/mapa/page.tsx`. En home: sección `#mapa` (MapSectionLocked).
   */
  async redirects() {
    return [
      {
        source: '/mapa',
        destination: '/?section=mapa',
        permanent: true,
      },
      {
        source: '/mapa/',
        destination: '/?section=mapa',
        permanent: true,
      },
      {
        source: '/cultura-digital',
        destination: '/educacion-mediatica',
        permanent: false,
      },
      { source: '/historias', destination: '/historias/videos', permanent: false },
      {
        source: '/historias/videos/exhibicion-demo',
        destination: '/historias/videos',
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "precisar",
  project: "almamundi",
});
