import Link from 'next/link';
import type { AlmaLocale } from '@/lib/i18n/locale';
import {
  LEGAL_CHROME,
  LEGAL_DOCS,
  trozosLegales,
  type LegalDoc,
  type LegalKey,
} from '@/lib/i18n/legal-documents';

function Texto({ texto, locale }: { texto: string; locale: AlmaLocale }) {
  return (
    <>
      {trozosLegales(texto, locale).map((trozo, indice) => {
        const clave = `${indice}-${trozo.texto.slice(0, 12)}`;
        const cuerpo = trozo.fuerte ? <strong>{trozo.texto}</strong> : trozo.texto;
        if (!trozo.href) return <span key={clave}>{cuerpo}</span>;
        if (trozo.href.startsWith('mailto:')) {
          return (
            <a key={clave} href={trozo.href} className="font-medium text-[#b8340f] underline underline-offset-2">
              {cuerpo}
            </a>
          );
        }
        return (
          <Link key={clave} href={trozo.href} className="font-medium text-[#b8340f] underline underline-offset-2">
            {cuerpo}
          </Link>
        );
      })}
    </>
  );
}

export function DocumentosLegalesNav({ locale, actual }: { locale: AlmaLocale; actual: LegalKey }) {
  const chrome = LEGAL_CHROME[locale];
  return (
    <nav className="mt-12 border-t border-black/10 pt-6" aria-label={chrome.documents}>
      <p className="text-[length:var(--fs-etiqueta)] font-semibold uppercase tracking-[0.12em] text-[#646E7E]">
        {chrome.documents}
      </p>
      <p className="mt-3 text-[length:var(--fs-pequeno)] leading-relaxed text-[#3c4655]">
        {chrome.nav.map((item, indice) => (
          <span key={item.key}>
            {indice > 0 ? <span aria-hidden> · </span> : null}
            {item.key === actual ? (
              <span aria-current="page" className="font-semibold">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="underline-offset-2 hover:underline">
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </p>
      <p className="mt-3 text-[length:var(--fs-pequeno)]">
        <a href="mailto:hola@almamundi.org" className="font-medium text-[#b8340f] underline underline-offset-2">
          hola@almamundi.org
        </a>
      </p>
    </nav>
  );
}

export function DocumentoLegal({
  locale,
  doc,
  actual,
}: {
  locale: AlmaLocale;
  doc: LegalDoc;
  actual: LegalKey;
}) {
  const chrome = LEGAL_CHROME[locale];
  const indice = doc.sections.length > 5;
  return (
    <main className="min-h-svh bg-[#F5F4F2] px-6 py-10" style={{ fontFamily: 'inherit' }}>
      <article className="mx-auto w-full max-w-[720px] text-[#3c4655]">
        <h1 className="text-[length:var(--fs-titular)] font-normal text-[#1a2332]">{doc.title}</h1>
        <p className="mt-2 text-[length:var(--fs-pequeno)] text-[#646E7E]">{doc.updated}</p>
        {indice ? (
          <nav className="mt-6" aria-label={doc.title}>
            <ol className="list-decimal space-y-1 pl-5 text-[length:var(--fs-pequeno)]">
              {doc.sections.map((seccion) => (
                <li key={seccion.id}>
                  <a href={`#${seccion.id}`} className="underline-offset-2 hover:underline">
                    {seccion.title.replace(/^\d+\.\s*/, '')}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {doc.lede ? (
          <p className="mt-6 text-[length:var(--fs-pequeno)] leading-relaxed">
            <Texto texto={doc.lede} locale={locale} />
          </p>
        ) : null}
        {doc.sections.map((seccion) => (
          <section key={seccion.id} id={seccion.id} className="mt-8">
            <h2 className="text-[length:var(--fs-texto)] font-semibold text-[#1a2332]">{seccion.title}</h2>
            {seccion.blocks.map((bloque, indiceBloque) =>
              bloque.kind === 'p' ? (
                <p key={indiceBloque} className="mt-3 text-[length:var(--fs-pequeno)] leading-relaxed">
                  <Texto texto={bloque.text} locale={locale} />
                </p>
              ) : (
                <ul key={indiceBloque} className="mt-3 list-disc space-y-2 pl-5 text-[length:var(--fs-pequeno)] leading-relaxed">
                  {bloque.items.map((item) => (
                    <li key={item}>
                      <Texto texto={item} locale={locale} />
                    </li>
                  ))}
                </ul>
              )
            )}
          </section>
        ))}
        <DocumentosLegalesNav locale={locale} actual={actual} />
      </article>
    </main>
  );
}

export function documento(locale: AlmaLocale, clave: 'privacidad' | 'terminos' | 'contacto' | 'conducta') {
  return LEGAL_DOCS[locale][clave];
}
