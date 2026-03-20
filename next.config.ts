import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  devIndicators: false,
  /**
   * El mapa principal vive en la home, sección `#mapa` (HomeMap / MapSectionLocked).
   * La ruta `/mapa` sola ya no existe: evita confusión con el globo duplicado.
   */
  async redirects() {
    return [
      { source: '/mapa', destination: '/#mapa', permanent: false },
      { source: '/historias', destination: '/historias/videos', permanent: false },
    ];
  },
};

export default nextConfig;
