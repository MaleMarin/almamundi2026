import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { CursorGlobal } from '@/components/ui/CursorGlobal';
import { Footer } from '@/components/layout/Footer';
import { NewsletterBand } from '@/components/newsletter/NewsletterBand';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { HighContrastToggle } from '@/components/layout/HighContrastToggle';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { GlobalSiteChrome, SiteFontScope } from '@/components/layout/GlobalSiteChrome';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { NOSCRIPT_BY_LOCALE } from '@/lib/i18n/home-messages';
import { PUBLIC_OG_LOCALE, publicSiteMeta } from '@/lib/i18n/public-meta';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Caveat, Montserrat } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const montserrat = Montserrat({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-interna',
  display: 'swap',
  adjustFontFallback: true });

const caveat = Caveat({
  weight: '600',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-caveat',
  display: 'swap',
});

function defaultMetadataBase(): URL {
  return new URL(PUBLIC_SITE_ORIGIN);
}

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const locale = parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  const site = publicSiteMeta(locale);
  return {
    metadataBase: defaultMetadataBase(),
    title: {
      default: site.title,
      template: '%s · AlmaMundi',
    },
    description: site.description,
    alternates: { canonical: './' },
    openGraph: {
      title: site.title,
      description: site.description,
      url: './',
      type: 'website',
      locale: PUBLIC_OG_LOCALE[locale],
      siteName: 'AlmaMundi',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: site.ogAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: site.title,
      description: site.description,
      images: ['/og-image.png'],
    },
    icons: {
      icon: [{ url: '/icon.png', type: 'image/png', sizes: '32x32' }],
      shortcut: '/icon.png',
    },
  };
}

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
      className={`${montserrat.variable} ${caveat.variable}`}
    >
      <body className="antialiased min-h-screen bg-[#E0E5EC] text-gray-800 font-interna">
        <CursorGlobal />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:rounded text-[length:var(--fs-pequeno)] focus:font-bold"
        >
          {locale === 'pt'
            ? 'Ir para o conteúdo principal'
            : locale === 'en'
              ? 'Skip to main content'
              : 'Saltar al contenido principal'}
        </a>
        <noscript>
          <div className="p-8 text-center">
            <h1 className="text-[length:var(--fs-subtitulo)] font-normal text-white/95">{ns.title}</h1>
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
                  <NewsletterBand />
                  <Footer initialLocale={locale} />
                </SiteFontScope>
                <CookieBanner />
              </LocaleProvider>
            </div>
          </SmoothScrollProvider>
        </div>
        <HighContrastToggle />
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
