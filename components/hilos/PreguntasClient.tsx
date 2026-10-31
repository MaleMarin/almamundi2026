'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlignLeft, Headphones, Image as ImageIcon, Shuffle, Video } from 'lucide-react';
import { CintaMini } from '@/components/hilos/CintaMini';
import { FilaCintas } from '@/components/hilos/CintaColgante';
import { StoryShareMenu } from '@/components/home/StoryShareMenu';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { PreguntaFormForQuestion } from '@/components/pregunta/PreguntaForm';
import RespuestasMosaic from '@/components/pregunta/RespuestasMosaic';
import type { ContarFormat } from '@/lib/contar-routes';
import {
  hiloPorId,
  preguntaAlAzar,
  preguntaDeOtroHilo,
  preguntaDeTema,
  preguntaHiloPorId,
  preguntaParaFormulario,
  type PreguntaHilo,
} from '@/lib/hilos';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { enlacePregunta, HILOS_UI, textoCompartirHilo, tituloHiloPartes } from '@/lib/i18n/hilos-messages';
import { interpolate } from '@/lib/i18n/locale';
import type { StoryPoint } from '@/lib/map-data/stories';
import { resolveQuestionId, type PreguntaSemana } from '@/lib/pregunta-semana';

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]';

function formatKey(story: StoryPoint): ContarFormat {
  const format = (story.format ?? '').toLowerCase();
  if (format === 'video' || story.videoUrl || story.hasVideo) return 'video';
  if (format === 'audio' || story.audioUrl || story.hasAudio) return 'audio';
  if (
    format === 'foto' ||
    format === 'image' ||
    format === 'photos' ||
    format === 'photo' ||
    (story.imagenes?.length ?? 0) > 0 ||
    (story.photos?.length ?? 0) > 0
  ) {
    return 'foto';
  }
  return 'texto';
}

function reduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToId(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  if (reduceMotion()) root.style.scrollBehavior = 'auto';
  node.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
  if (reduceMotion()) root.style.scrollBehavior = previous;
}

function publicarUrl(id: string) {
  const url = `/preguntas?p=${encodeURIComponent(id)}`;
  window.history.replaceState(null, '', url);
}

type PreguntasClientProps = {
  initialId: string | null;
};

export function PreguntasClient({ initialId }: PreguntasClientProps) {
  const { locale, t } = useHomeLocale();
  const copy = HILOS_UI[locale];
  const titulo = tituloHiloPartes(copy.titulo);
  const [abierta, setAbierta] = useState<PreguntaHilo | null>(() => preguntaHiloPorId(initialId));
  const [respondiendo, setRespondiendo] = useState(false);
  const [historias, setHistorias] = useState<StoryPoint[]>([]);
  const [compartir, setCompartir] = useState(false);
  const [aviso, setAviso] = useState('');
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancel = false;
    void fetch('/api/historias')
      .then((res) => res.json())
      .then((data: { stories?: StoryPoint[] }) => {
        if (!cancel) setHistorias(Array.isArray(data.stories) ? data.stories : []);
      })
      .catch(() => {
        if (!cancel) setHistorias([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!abierta) return;
    publicarUrl(abierta.id);
    tituloRef.current?.focus();
    scrollToId('hilo-abierta');
  }, [abierta]);

  function abrir(pregunta: PreguntaHilo | null, conFormulario = false) {
    if (!pregunta) return;
    setAbierta(pregunta);
    setRespondiendo(conFormulario);
    setAviso('');
    publicarUrl(pregunta.id);
  }

  const preguntaForm = (abierta ? preguntaParaFormulario(abierta.id) : null) as PreguntaSemana | null;
  const hilo = abierta ? hiloPorId(abierta.hiloId) : null;
  const contadas = abierta
    ? historias.filter(
        (story) => story.questionId === abierta.id || resolveQuestionId(story.questionId) === abierta.id
      )
    : [];
  const enlace = abierta ? enlacePregunta(abierta.id) : '';
  const textoCompartir =
    abierta && enlace ? textoCompartirHilo(locale, abierta.texto[locale], enlace) : '';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <header className="mx-auto max-w-3xl pt-4 text-center md:pt-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF4A1C]">{copy.ceja}</p>
        <h1 className="mx-auto mt-4 max-w-[22ch] text-[length:var(--fs-titular)] font-normal leading-[1.2] text-[#4A5568] md:max-w-none">
          {titulo.antes} <strong className="font-bold">{titulo.cierre}</strong>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[length:var(--fs-texto)] leading-relaxed text-[#4A5568]">
          {copy.bajada}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            className={`btn-am-principal inline-flex min-h-11 items-center justify-center gap-2 px-6 ${FOCUS}`}
            onClick={() => abrir(preguntaAlAzar(abierta?.id ?? null))}
          >
            <Shuffle size={18} aria-hidden />
            {copy.tirar}
          </button>
          <button
            type="button"
            className={`btn-am-neutro inline-flex min-h-11 items-center justify-center px-6 ${FOCUS}`}
            onClick={() => {
              scrollToId('hilos');
              document.getElementById('hilos-titulo')?.focus();
            }}
          >
            {copy.verTemas}
          </button>
        </div>
      </header>

      <section id="hilos" className="mt-14 scroll-mt-40 md:mt-20 md:scroll-mt-52" aria-labelledby="hilos-titulo">
        <h2
          id="hilos-titulo"
          tabIndex={-1}
          className="mb-4 text-center text-[length:var(--fs-pequeno)] font-semibold text-[#4A5568] outline-none focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#FF4A1C] md:sr-only"
        >
          {copy.elige}
        </h2>
        <div className="mt-8">
          <FilaCintas
            locale={locale}
            selectedId={abierta?.hiloId ?? null}
            onPick={(item) =>
              abrir(preguntaDeTema(item.id, abierta?.hiloId === item.id ? abierta.id : null))
            }
          />
        </div>
      </section>

      {abierta ? (
        <section id="hilo-abierta" className="mt-10 scroll-mt-40 md:scroll-mt-52" aria-labelledby="hilo-pregunta-titulo">
          <div
            className="bg-white px-5 py-8 shadow-[0_16px_40px_rgba(20,29,38,0.08)] md:px-10 md:py-10"
            style={{ borderRadius: 32, borderTop: `6px solid ${hilo?.color ?? '#FF4A1C'}` }}
          >
            <div aria-live="polite" aria-atomic="true">
              {hilo ? (
                <p className="flex items-center gap-2 text-[13px] font-semibold text-[#4A5568]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hilo.color }} aria-hidden />
                  {hilo.nombre[locale]}
                </p>
              ) : null}
              <h2
                id="hilo-pregunta-titulo"
                ref={tituloRef}
                tabIndex={-1}
                className={`mt-4 text-[42px] font-semibold leading-[1.15] text-[#1A1916] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#FF4A1C] ${FOCUS}`}
              >
                {abierta.texto[locale]}
              </h2>
            </div>
            <div className="mt-8">
              {respondiendo && preguntaForm ? (
                <PreguntaFormForQuestion pregunta={preguntaForm} />
              ) : (
                <button
                  type="button"
                  className={`btn-am-principal inline-flex min-h-11 items-center justify-center px-6 ${FOCUS}`}
                  onClick={() => setRespondiendo(true)}
                >
                  {copy.responde}
                </button>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`btn-am-neutro inline-flex min-h-11 items-center justify-center px-3 text-center leading-tight whitespace-normal ${FOCUS}`}
                onClick={() => abrir(preguntaDeOtroHilo(abierta.hiloId, abierta.id))}
              >
                {copy.otro}
              </button>
              <button
                type="button"
                className={`btn-am-secundario inline-flex min-h-11 items-center justify-center px-3 text-center leading-tight whitespace-normal ${FOCUS}`}
                onClick={() => {
                  setAviso('');
                  setCompartir(true);
                }}
              >
                {copy.mandar}
              </button>
            </div>
            <p className="mt-3 min-h-5 text-center text-[length:var(--fs-etiqueta)] font-semibold text-[#FF4A1C]" aria-live="polite">
              {aviso}
            </p>
          </div>

          {contadas.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-[length:var(--fs-subtitulo)] font-semibold text-[#4A5568]">
                {copy.otros} ({contadas.length})
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {contadas.map((story) => {
                  const kind = formatKey(story);
                  const place = formatPublicPlace(story.city, story.country, locale);
                  const title = story.title || story.label;
                  return (
                    <li key={story.id}>
                      <Link
                        href={`/historias/${story.id}`}
                        className={`flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_10px_28px_rgba(20,29,38,0.06)] ${FOCUS}`}
                      >
                        <CintaMini
                          storyId={story.id}
                          text={(story.body || story.excerpt || title || ' ').slice(0, 4000)}
                          locale={locale}
                        />
                        <span className="flex flex-1 flex-col gap-1 px-4 py-4">
                          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4A5568]">
                            <FormatoIcono kind={kind} />
                            {copy.formatos[kind]}
                          </span>
                          <span className="text-[length:var(--fs-pequeno)] font-semibold leading-snug text-[#1A1916]">
                            {title}
                          </span>
                          {place ? <span className="text-[13px] text-[#4A5568]">{place}</span> : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <RespuestasMosaic questionId={abierta.id} embedded />
        </section>
      ) : null}

      {compartir && abierta ? (
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
            setCompartir(false);
          }}
          onTextCopied={() => {
            setAviso(t.modalShareTextCopied);
            setCompartir(false);
          }}
          onAppHandoff={(app) => {
            setAviso(interpolate(t.modalShareAppHandoff, { app }));
            setCompartir(false);
          }}
          onCopyFailed={(text) => {
            setAviso(`${t.modalShareCopyFailed} ${text}`);
          }}
          onDownload={() => {}}
          onEmail={() => {
            setAviso(t.modalShareEmailCopied);
          }}
          onClose={() => setCompartir(false)}
        />
      ) : null}
    </main>
  );
}

function FormatoIcono({ kind }: { kind: ContarFormat }) {
  const Icon = kind === 'video' ? Video : kind === 'audio' ? Headphones : kind === 'foto' ? ImageIcon : AlignLeft;
  return <Icon size={16} aria-hidden className="text-[#FF4A1C]" />;
}
