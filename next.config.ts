import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  devIndicators: false,
  // La primera vista es la home (header + headline + 4 cards). El mapa está en /mapa.
  // async redirects() {
  //   return [{ source: "/", destination: "/mapa", permanent: false }];
  // },
};

export default nextConfig;
