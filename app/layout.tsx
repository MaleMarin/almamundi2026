import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
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
      <body className="antialiased min-h-screen bg-[#E0E5EC] text-gray-800" style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Avenir, sans-serif" }}>
        <noscript>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-light text-white/95">AlmaMundi</h1>
            <p className="mt-2 text-white/60">Necesitas JavaScript para ver el sitio.</p>
            <Link href="/" className="mt-4 inline-block text-orange-400 hover:underline">Ir al inicio</Link>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
