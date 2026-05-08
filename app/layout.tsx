import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { CursorGlobal } from '@/components/ui/CursorGlobal';
import { Footer } from '@/components/layout/Footer';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { HighContrastToggle } from '@/components/layout/HighContrastToggle';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { GlobalSiteChrome } from '@/components/layout/GlobalSiteChrome';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { NOSCRIPT_BY_LOCALE } from '@/lib/i18n/home-messages';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

function defaultMetadataBase(): URL {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.PUBLIC_SITE_URL?.trim(),
  ].filter(Boolean) as string[];
  for (const raw of candidates) {
    try {
      const u = raw.endsWith('/') ? raw.slice(0, -1) : raw;
      return new URL(u);
    } catch {
      /* siguiente */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return new URL(`https://${vercel}`);
  }
  return new URL('http://localhost:3000');
}

export const metadata: Metadata = {
  metadataBase: defaultMetadataBase(),
  title: {
    default: 'AlmaMundi',
    template: '%s · AlmaMundi',
  },
  description: 'Explora el mapa',
  /**
   * Favicon: `public/artemis.ico` → `/artemis.ico`.
   * Apple: convención `app/apple-icon.png` (icono al guardar en pantalla de inicio).
   */
  icons: {
    icon: '/artemis.ico',
    shortcut: '/artemis.ico',
  },
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
          className="flex min-h-svh flex-col bg-[var(--home-bg)]"
        >
          <SmoothScrollProvider>
            {/*
              Altura mínima del área de página: empuja el footer fuera del primer pantallazo
              en rutas con poco contenido; el footer sigue en el DOM en todas las rutas.
              Mismo fondo que el footer: evita franja clara si el flex crece por min-h.
              Lenis + ScrollTrigger (cinematic / GSAP) viven en SmoothScrollProvider.
            */}
            <div className="flex w-full flex-1 flex-col min-h-[calc(100svh+32vh)] bg-[var(--home-bg)]">
              <LocaleProvider initialLocale={locale}>
                <GlobalSiteChrome>{children}</GlobalSiteChrome>
              </LocaleProvider>
            </div>
            <Footer />
          </SmoothScrollProvider>
        </div>
        <HighContrastToggle />
        <CookieBanner />
        <SpeedInsights />
      </body>
    </html>
  );
}
