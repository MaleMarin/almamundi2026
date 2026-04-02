import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' ${isDev ? "'unsafe-eval' " : ""}'unsafe-inline' https://*.firebaseapp.com https://www.google.com https://www.gstatic.com https://apis.google.com https://vercel.live https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://vercel.live https://*.cloudflare.com https://challenges.cloudflare.com https://storage.googleapis.com https://*.googleusercontent.com https://cdn.jsdelivr.net",
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
   * `/api/public-audio` solo importa un JSON pequeño; por si el trazado volviera a arrastrar `public/`.
   */
  outputFileTracingExcludes: {
    "/app/api/public-audio": ["public/**/*"],
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
      { source: '/historias', destination: '/historias/videos', permanent: false },
      {
        source: '/historias/videos/exhibicion-demo',
        destination: '/historias/videos',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
