import { CursorGlobal } from '@/components/ui/CursorGlobal';
import { Footer } from '@/components/layout/Footer';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { HighContrastToggle } from '@/components/layout/HighContrastToggle';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { NOSCRIPT_BY_LOCALE } from '@/lib/i18n/home-messages';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const locale = parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  const ns = NOSCRIPT_BY_LOCALE[locale];

  return (
    <html lang={locale}>
      <body className="antialiased min-h-screen bg-[#E0E5EC] text-gray-800 font-sans">
        <CursorGlobal />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:rounded focus:text-sm focus:font-bold"
        >
          Saltar al contenido principal
        </a>
        <noscript>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-light text-white/95">{ns.title}</h1>
            <p className="mt-2 text-white/60">{ns.p}</p>
            <HomeHardLink href="/" className="mt-4 inline-block text-orange-400 hover:underline">
              {ns.link}
            </HomeHardLink>
          </div>
        </noscript>
        {/* #main-content en el servidor: evita desajuste de hidratación (Suspense) al cruzar RSC → LocaleProvider */}
        <div
          id="main-content"
          tabIndex={-1}
          className="flex min-h-svh flex-col"
        >
          {/*
            Altura mínima del área de página: empuja el footer fuera del primer pantallazo
            en rutas con poco contenido; el footer sigue en el DOM en todas las rutas.
          */}
          <div className="flex w-full flex-1 flex-col min-h-[calc(100svh+32vh)]">
            <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
          </div>
          <Footer />
        </div>
        <HighContrastToggle />
      </body>
    </html>
  );
}
