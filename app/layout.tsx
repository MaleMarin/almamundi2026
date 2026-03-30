import { HomeHardLink } from '@/components/layout/HomeHardLink';
import type { Metadata } from "next";
import "./globals.css";

function defaultMetadataBase(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv);
    } catch {
      /* fall through */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return new URL(`https://${vercel}`);
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: defaultMetadataBase(),
  title: "AlmaMundi",
  description: "Explora el mapa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-[#E0E5EC] text-gray-800 font-sans">
        <noscript>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-light text-white/95">AlmaMundi</h1>
            <p className="mt-2 text-white/60">Necesitas JavaScript para ver el sitio.</p>
            <HomeHardLink href="/" className="mt-4 inline-block text-orange-400 hover:underline">Ir al inicio</HomeHardLink>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
