import type { NextConfig } from "next";

const securityHeaders = [
  // Quita el header "x-powered-by"
  // (esto se activa con poweredByHeader:false abajo)

  // Evita MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Referer más seguro
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Bloquea permisos que no usas
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

  // Defensa contra clickjacking (mejor en CSP, pero este ayuda)
  { key: "X-Frame-Options", value: "DENY" },

  // HSTS (actívalo cuando estés 100% seguro de que TODO está en HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },

  // CSP base (ajustable si luego agregas analytics/pixels/CDNs)
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "base-uri 'self'; " +
      "object-src 'none'; " +
      "frame-ancestors 'none'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data: https:; " +
      "style-src 'self' 'unsafe-inline' https:; " +
      "script-src 'self' https:; " +
      "connect-src 'self' https:;",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;