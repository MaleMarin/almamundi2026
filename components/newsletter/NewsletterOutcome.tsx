import { HomeHardLink } from "@/components/layout/HomeHardLink";
import { MAPA_HOME_LINK_HREF } from "@/lib/mapa-home-nav";
import { SITE_FONT_STACK } from "@/lib/typography";

export function NewsletterOutcome({
  brand,
  message,
  mapLabel,
}: {
  brand: string;
  message: string;
  mapLabel: string;
}) {
  return (
    <main
      className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      <p className="m-0 text-[length:var(--fs-pequeno)] font-semibold leading-snug text-[#1A1916]">{brand}</p>
      <p className="mt-4 text-[length:var(--fs-subtitulo)] font-semibold leading-snug text-[#1A1916]">{message}</p>
      <HomeHardLink
        href={MAPA_HOME_LINK_HREF}
        className="btn-am-principal mt-8 inline-flex min-h-11 items-center justify-center px-6 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
      >
        {mapLabel}
      </HomeHardLink>
    </main>
  );
}
