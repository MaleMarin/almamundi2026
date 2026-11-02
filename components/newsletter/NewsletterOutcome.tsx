import { HomeHardLink } from "@/components/layout/HomeHardLink";
import { MAPA_HOME_LINK_HREF } from "@/lib/mapa-home-nav";
import { SITE_FONT_STACK } from "@/lib/typography";

/**
 * Página de resultado de Sonder (confirmar suscripción o darse de baja).
 * Con `title` se muestra la tarjeta de bienvenida: Sonder, título, texto, dos botones y nota de baja.
 */
export function NewsletterOutcome({
  brand,
  message,
  mapLabel,
  eyebrow,
  title,
  tellLabel,
  note,
}: {
  brand: string;
  message: string;
  mapLabel: string;
  eyebrow?: string;
  title?: string;
  tellLabel?: string;
  note?: string;
}) {
  if (!title) {
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

  return (
    <main
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 pb-12 pt-16 md:pt-20"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      <section
        className="w-full rounded-[28px] border border-[#8A847C]/40 bg-[#FBFAF8] px-6 py-10 text-center md:px-12 md:py-12"
        style={{ boxShadow: "0 18px 40px rgba(120, 110, 100, 0.14)" }}
      >
        <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#B8340F]">{eyebrow}</p>
        <h1 className="mx-auto mt-4 max-w-[22ch] text-[length:var(--fs-subtitulo)] font-semibold leading-tight text-[#3C4655] [text-wrap:balance]">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[17px] leading-relaxed text-[#4A5568]">{message}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <HomeHardLink
            href={MAPA_HOME_LINK_HREF}
            className="btn-am-principal inline-flex min-h-11 items-center justify-center px-6 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
          >
            {mapLabel}
          </HomeHardLink>
          {tellLabel ? (
            <HomeHardLink
              href="/contar"
              className="btn-am-secundario inline-flex min-h-11 items-center justify-center px-6 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
            >
              {tellLabel}
            </HomeHardLink>
          ) : null}
        </div>
        {note ? <p className="mt-6 text-[13px] leading-relaxed text-[#646E7E]">{note}</p> : null}
      </section>
    </main>
  );
}
