import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { CursorGlobal } from '@/components/ui/CursorGlobal';
import { Footer } from '@/components/layout/Footer';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { HighContrastToggle } from '@/components/layout/HighContrastToggle';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { GlobalSiteChrome, SiteFontScope } from '@/components/layout/GlobalSiteChrome';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { NOSCRIPT_BY_LOCALE } from '@/lib/i18n/home-messages';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Montserrat } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const montserrat = Montserrat({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-interna',
  display: 'swap',
  adjustFontFallback: true });

function defaultMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://almamundi.org';
  try {
    return new URL(raw.endsWith('/') ? raw.slice(0, -1) : raw);
  } catch {
    return new URL('https://almamundi.org');
  }
}

const SITE_TITLE = 'AlmaMundi — Entra y cuenta tu historia';
const SITE_DESCRIPTION =
  'Descubre historias de vida reales en video, audio o texto, y entra a contar la tuya. Cada historia despierta otra.';

export const metadata: Metadata = {
  metadataBase: defaultMetadataBase(),
  title: {
    default: SITE_TITLE,
    template: '%s · AlmaMundi' },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'es_CL',
    siteName: 'AlmaMundi',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AlmaMundi — historias de vida en video, audio, escrito y foto' },
    ] },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'] },
  /**
   * Favicon: `app/icon.png` (convención App Router).
   * Apple: `app/apple-icon.png` (icono al guardar en pantalla de inicio).
   */
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '32x32' }],
    shortcut: '/icon.png' } };

export default async function RootLayout({
  children }: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const locale = parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  const ns = NOSCRIPT_BY_LOCALE[locale];

  return (
    <html
      lang={locale}
      className={montserrat.variable}
    >
      <body className="antialiased min-h-screen bg-[#E0E5EC] text-gray-800 font-interna">
        <CursorGlobal />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:rounded focus:text-sm focus:font-bold"
        >
          Saltar al contenido principal
        </a>
        <noscript>
          <div className="p-8 text-center">
            <h1 className="text-[22px] font-light text-white/95">{ns.title}</h1>
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
                <SiteFontScope>
                  <GlobalSiteChrome>{children}</GlobalSiteChrome>
                  <Footer initialLocale={locale} />
                </SiteFontScope>
              </LocaleProvider>
            </div>
          </SmoothScrollProvider>
        </div>
        <HighContrastToggle />
        <CookieBanner />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17718043044"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17718043044');
          `}
        </Script>
        <SpeedInsights />
      </body>
    </html>
  );
}
