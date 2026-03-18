import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  devIndicators: false,
  // El mapa vive en la home (#mapa). /mapa ya no existe: redirigir a home para evitar doble globo.
  async redirects() {
    return [{ source: '/mapa', destination: '/#mapa', permanent: false }];
  },
};

export default nextConfig;
