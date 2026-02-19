import type { Metadata } from "next";
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
      <body className="antialiased min-h-screen bg-[#0F172A]" style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Avenir, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
