'use client';

import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { FilaCintas } from '@/components/hilos/CintaColgante';
import { StoryShareMenu } from '@/components/home/StoryShareMenu';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { PreguntaFormForQuestion } from '@/components/pregunta/PreguntaForm';
import {
  hiloPorId,
  preguntaHiloPorId,
  preguntaParaFormulario,
  preguntasDelTema,
  type PreguntaHilo,
} from '@/lib/hilos';
import { enlacePregunta, HILOS_UI, textoCompartirHilo } from '@/lib/i18n/hilos-messages';
import { interpolate } from '@/lib/i18n/locale';
import type { PreguntaSemana } from '@/lib/pregunta-semana';

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]';

const PREGUNTA =
  'm-0 text-left font-interna text-[20px] font-medium leading-snug text-[#3C4655]';

function reduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToId(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  if (reduceMotion()) root.style.scrollBehavior = 'auto';
  node.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
  if (reduceMotion()) root.style.scrollBehavior = previous;
}

function publicarPregunta(id: string) {
  window.history.replaceState(null, '', `/preguntas?p=${encodeURIComponent(id)}`);
}

function publicarTema(id: string) {
  window.history.replaceState(null, '', `/preguntas?tema=${encodeURIComponent(id)}`);
}

type PreguntasClientProps = {
  initialId: string | null;
  initialTema: string | null;
};

export function PreguntasClient({ initialId, initialTema }: PreguntasClientProps) {
  const { locale, t } = useHomeLocale();
  const copy = HILOS_UI[locale];
  const [temaId, setTemaId] = useState<string | null>(initialTema);
  const [abiertaId, setAbiertaId] = useState<string | null>(initialId);
  const [compartirId, setCompartirId] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');

  const hilo = hiloPorId(temaId);
  const delTema = preguntasDelTema(temaId);
  const abierta = preguntaHiloPorId(abiertaId);
  const preguntas = delTema.length > 0 ? delTema : abierta ? [abierta] : [];
  const compartir = preguntaHiloPorId(compartirId);
  const enlace = compartir ? enlacePregunta(compartir.id) : '';
  const textoCompartir =
    compartir && enlace ? textoCompartirHilo(locale, compartir.texto[locale], enlace) : '';

  useEffect(() => {
    if (!abiertaId) return;
    publicarPregunta(abiertaId);
    scrollToId(`pregunta-${abiertaId}`);
  }, [abiertaId]);

  function elegirTema(id: string) {
    setTemaId(id);
    setAbiertaId(null);
    setAviso('');
    publicarTema(id);
  }

  function abrirPregunta(pregunta: PreguntaHilo) {
    if (pregunta.hiloId) setTemaId(pregunta.hiloId);
    setAbiertaId(pregunta.id);
    setAviso('');
    publicarPregunta(pregunta.id);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <header className="mx-auto max-w-3xl pt-4 text-center md:pt-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF4A1C]">{copy.ceja}</p>
        <h1 className="mx-auto mt-4 text-[length:var(--fs-titular)] font-bold leading-[1.2] whitespace-nowrap text-[#4A5568]">
          {copy.titulo}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[length:var(--fs-texto)] leading-relaxed text-[#4A5568]">
          {copy.bajada}
        </p>
      </header>

      <section id="hilos" className="mt-10 scroll-mt-40 md:mt-14 md:scroll-mt-52">
        <FilaCintas
          locale={locale}
          selectedId={temaId}
          onPick={(item) => elegirTema(item.id)}
        />
      </section>

      {preguntas.length > 0 ? (
        <section id="tema-abierto" className="mt-10 scroll-mt-40 text-center md:scroll-mt-52" aria-labelledby="tema-nombre">
          {hilo ? (
            <h2
              id="tema-nombre"
              className="font-interna text-[length:var(--fs-subtitulo)] font-medium leading-snug"
              style={{ color: hilo.color }}
            >
              {hilo.nombre[locale]}
            </h2>
          ) : null}
          <p className="mx-auto mt-3 max-w-xl text-[length:var(--fs-texto)] leading-relaxed text-[#4A5568]">{copy.invita}</p>
          <ul className="mt-5 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
            {preguntas.map((pregunta) => {
              const abiertaEsta = abiertaId === pregunta.id;
              const preguntaForm = abiertaEsta
                ? (preguntaParaFormulario(pregunta.id) as PreguntaSemana | null)
                : null;
              return (
                <li key={pregunta.id} id={`pregunta-${pregunta.id}`} className={abiertaEsta ? 'scroll-mt-40 md:col-span-2 md:scroll-mt-52' : 'scroll-mt-40 md:scroll-mt-52'}>
                  <article className="flex h-full flex-col gap-4 rounded-[22px] bg-[#FBFAF8] p-5 shadow-[0_8px_24px_rgba(74,85,104,0.08)]">
                    {abiertaEsta ? (
                      <h3 tabIndex={-1} className={PREGUNTA}>
                        {pregunta.texto[locale]}
                      </h3>
                    ) : (
                      <button type="button" className={`${PREGUNTA} ${FOCUS}`} onClick={() => abrirPregunta(pregunta)}>
                        {pregunta.texto[locale]}
                      </button>
                    )}
                    {abiertaEsta && preguntaForm ? <PreguntaFormForQuestion pregunta={preguntaForm} /> : null}
                    <div className="mt-auto flex flex-col gap-2">
                      {abiertaEsta ? null : (
                        <button
                          type="button"
                          className={`btn-am-principal inline-flex min-h-11 w-full items-center justify-center px-4 ${FOCUS}`}
                          onClick={() => abrirPregunta(pregunta)}
                        >
                          {copy.responde}
                        </button>
                      )}
                      <button
                        type="button"
                        className={`btn-am-secundario inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-center leading-tight ${FOCUS}`}
                        onClick={() => {
                          setAviso('');
                          setCompartirId(pregunta.id);
                        }}
                      >
                        <Share2 size={16} aria-hidden />
                        {copy.mandar}
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 min-h-5 text-center text-[length:var(--fs-etiqueta)] font-semibold text-[#FF4A1C]" aria-live="polite">
            {aviso}
          </p>
        </section>
      ) : null}

      {compartir ? (
        <StoryShareMenu
          shareUrl={enlace}
          shareTextShort={textoCompartir}
          shareTextLong={textoCompartir}
          shareTextSocial={textoCompartir}
          emailSubject={copy.asunto}
          labels={{
            title: t.modalShareMenuTitle,
            facebook: t.modalShareFacebook,
            x: t.modalShareX,
            linkedin: t.modalShareLinkedIn,
            instagram: t.modalShareInstagram,
            tiktok: t.modalShareTikTok,
            email: t.modalShareEmail,
            copyLink: t.modalCopyLink,
            download: '',
            close: t.modalClose,
          }}
          showDownload={false}
          showImageApps={false}
          imageFile={null}
          shareTitle="AlmaMundi"
          keepShareUrl
          onCopied={() => {
            setAviso(t.modalShareLinkCopied);
            setCompartirId(null);
          }}
          onTextCopied={() => {
            setAviso(t.modalShareTextCopied);
            setCompartirId(null);
          }}
          onAppHandoff={(app) => {
            setAviso(interpolate(t.modalShareAppHandoff, { app }));
            setCompartirId(null);
          }}
          onCopyFailed={(text) => {
            setAviso(`${t.modalShareCopyFailed} ${text}`);
          }}
          onDownload={() => {}}
          onEmail={() => {
            setAviso(t.modalShareEmailCopied);
          }}
          onClose={() => setCompartirId(null)}
        />
      ) : null}
    </main>
  );
}
