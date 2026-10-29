import { HomePageClient } from '@/components/home/HomePageClient';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { PUBLIC_OG_LOCALE, publicSiteMeta } from '@/lib/i18n/public-meta';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const HOME_CANONICAL = `${PUBLIC_SITE_ORIGIN}/`;

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const locale = parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  const site = publicSiteMeta(locale);
  return {
    alternates: { canonical: null },
    openGraph: {
      title: site.title,
      description: site.description,
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
  };
}

export default function Home() {
  return (
    <>
      <link rel="canonical" href={HOME_CANONICAL} />
      <meta property="og:url" content={HOME_CANONICAL} />
      <HomePageClient />
    </>
  );
}
