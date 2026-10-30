import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NewsletterOutcome } from "@/components/newsletter/NewsletterOutcome";
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from "@/lib/i18n/locale";
import { newsletterPageCopy } from "@/lib/newsletter/copy";
import { confirmNewsletterToken } from "@/lib/newsletter/subscribers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "AlmaMundi" },
  robots: { index: false, follow: false },
};

function tokenFrom(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return "";
}

export default async function ConfirmarNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const sp = await searchParams;
  const result = await confirmNewsletterToken(tokenFrom(sp.t));
  const jar = await cookies();
  const locale =
    result.kind === "invalid" ? parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value) : result.locale;
  const copy = newsletterPageCopy(locale);
  const message =
    result.kind === "confirmed"
      ? copy.confirmed
      : result.kind === "unsubscribed"
        ? copy.unsubscribed
        : copy.invalid;
  return <NewsletterOutcome brand={copy.brand} message={message} mapLabel={copy.map} />;
}
