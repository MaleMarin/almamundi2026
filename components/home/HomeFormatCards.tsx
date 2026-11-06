'use client';

/**
 * Las 4 tarjetas de formato (home y /contar). Misma pieza: textos, neumorfismo y hover.
 * LOCK visual: no alterar tamaños, sombras ni animaciones sin petición explícita.
 * Efecto por turnos (pedido de Ana, 4 nov 2026): se enciende una tarjeta a la vez, en ronda;
 * si el mouse pasa por una, se enciende esa y la ronda se detiene hasta que sale.
 */
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { contarHref, type ContarPregunta } from '@/lib/contar-routes';
import { SITE_FONT_STACK } from '@/lib/typography';

const APP_FONT = SITE_FONT_STACK;

const soft = {
  flat: {
    backgroundColor: '#FBFAF8',
    borderRadius: '40px',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: [
      '22px 22px 52px rgba(120, 110, 100, 0.58)',
      '-20px -20px 52px rgba(255, 255, 255, 1)',
      'inset 3px 3px 6px rgba(255, 255, 255, 0.92)',
      'inset -5px -5px 14px rgba(120, 110, 100, 0.34)',
    ].join(', ') } } as const;

type HistoriasCardHoverKind = 'video' | 'audio' | 'text' | 'photo';

function HistoriasCardHoverDecor({
  kind,
  enMedio = false,
}: {
  kind: HistoriasCardHoverKind;
  /** El efecto llena el hueco entre el título y la frase. */
  enMedio?: boolean;
}) {
  const wrap = enMedio
    ? 'card-hover-decor pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden rounded-[22px] opacity-0'
    : 'card-hover-decor pointer-events-none absolute inset-[5%] z-0 overflow-hidden rounded-[22px] opacity-0';

  if (kind === 'video') {
    return (
      <div className={wrap} aria-hidden>
        <svg
          className="h-full w-full text-[#FF4A1C] drop-shadow-[0_0_12px_rgba(255,74,28,0.35)]"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M6 24V6H24"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.78}
          />
          <path
            d="M76 6H94V24"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.78}
          />
          <path
            d="M6 76V94H24"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.78}
          />
          <path
            d="M94 76V94H76"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.78}
          />
          <rect
            x="13"
            y="13"
            width="74"
            height="74"
            rx="3"
            stroke="currentColor"
            strokeWidth="0.55"
            opacity={0.35}
          />
        </svg>
      </div>
    );
  }

  if (kind === 'audio') {
    const heightsPx = [20, 34, 44, 28, 36];
    return (
      <div className={`${wrap} flex items-end justify-center gap-1.5 pb-[14%]`} aria-hidden>
        {heightsPx.map((h, i) => (
          <span
            key={i}
            className="home-historias-card-audio-bar w-[8px] rounded-full bg-[#FF4A1C]/70 shadow-[0_0_14px_rgba(255,74,28,0.45)]"
            style={{
              height: enMedio ? `${(h / 44) * 100}%` : h,
              animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
    );
  }

  if (kind === 'text') {
    return (
      <div className={`${wrap} flex flex-col items-center justify-center gap-4 pt-[6%]`} aria-hidden>
        <div
          className={
            enMedio
              ? 'relative min-h-0 w-[82%] max-w-[240px] flex-1 rounded-md border-2 border-[#FF4A1C]/35 bg-white/[0.12] shadow-[inset_0_2px_8px_rgba(255,255,255,0.45),0_4px_16px_rgba(74,85,104,0.12)]'
              : 'relative h-11 w-[82%] max-w-[240px] rounded-md border-2 border-[#FF4A1C]/35 bg-white/[0.12] shadow-[inset_0_2px_8px_rgba(255,255,255,0.45),0_4px_16px_rgba(74,85,104,0.12)]'
          }
        >
          <span
            className={
              enMedio
                ? 'home-historias-card-type-cursor absolute bottom-[18%] left-3.5 inline-block h-[36%] w-[3px] rounded-sm bg-[#FF4A1C] shadow-[0_0_10px_rgba(255,74,28,0.65)]'
                : 'home-historias-card-type-cursor absolute bottom-3 left-3.5 inline-block h-4 w-[3px] rounded-sm bg-[#FF4A1C] shadow-[0_0_10px_rgba(255,74,28,0.65)]'
            }
          />
          <span
            className="home-historias-card-type-line absolute bottom-3 left-3.5 h-[2px] rounded-full bg-gray-600/45"
            style={{ width: '48%' }}
          />
        </div>
        <div className="flex w-[76%] max-w-[220px] flex-col gap-2">
          <span className="home-historias-card-float-line h-2 w-[94%] rounded-full bg-gray-600/28 shadow-sm" />
          <span className="home-historias-card-float-line home-historias-card-float-line--delay h-2 w-[72%] rounded-full bg-gray-600/22 shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={wrap} aria-hidden>
      <div className="absolute inset-[5%] rounded-xl bg-white/[0.12] shadow-[inset_0_2px_8px_rgba(255,255,255,0.45),0_4px_16px_rgba(74,85,104,0.12)]" />
      <div className="home-historias-card-photo-shine absolute inset-[5%] rounded-xl" />
    </div>
  );
}

function SoftCard({
  title,
  subtitle,
  children,
  buttonLabel,
  href,
  onClick,
  delay,
  hoverKind,
  fillViewport = false,
  encendida = false,
  onPasar }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  buttonLabel: string;
  href: string;
  onClick: () => void;
  delay: string;
  hoverKind: HistoriasCardHoverKind;
  fillViewport?: boolean;
  /** Le toca el turno del efecto. */
  encendida?: boolean;
  /** El mouse entra (true) o sale (false) de la tarjeta. */
  onPasar?: (dentro: boolean) => void;
}) {
  return (
    <div
      className={
        fillViewport
          ? 'home-historias-card-float-wrap flex h-full min-h-0 w-full min-w-0 justify-center'
          : 'home-historias-card-float-wrap mx-auto flex h-full w-full min-w-0 max-w-[min(100%,26rem)] justify-center sm:max-w-[28rem] md:max-w-[30rem] lg:mx-0 lg:max-w-full'
      }
      style={{ animationDelay: delay }}
      onMouseEnter={() => onPasar?.(true)}
      onMouseLeave={() => onPasar?.(false)}
    >
      <div
        className={
          fillViewport
            ? `home-neu-card home-historias-card-surface${encendida ? ' encendida' : ''} group relative flex h-full min-h-0 w-full min-w-0 flex-col items-stretch overflow-hidden rounded-[28px] p-3 transition-[transform,box-shadow] duration-500 sm:p-4 md:p-5`
            : `home-neu-card home-historias-card-surface${encendida ? ' encendida' : ''} group relative flex min-h-0 aspect-square w-full min-w-0 max-w-full flex-col items-stretch overflow-hidden rounded-[28px] p-4 transition-[transform,box-shadow] duration-500 md:p-5`
        }
        style={{
          ...soft.flat,
          borderRadius: '28px',
          fontFamily: APP_FONT }}
      >
        {fillViewport ? <HistoriasCardHoverDecor kind={hoverKind} /> : null}
        <div
          className={
            fillViewport
              ? 'relative z-[1] flex min-h-0 flex-1 flex-col justify-evenly gap-2 md:gap-3'
              : 'relative z-[1] flex min-h-0 flex-1 flex-col'
          }
        >
          <div className="shrink-0 min-w-0">
            <p
              className="text-[length:var(--fs-subtitulo)] leading-snug text-gray-600"
              style={{ fontWeight: 400 }}
            >
              {title}
            </p>
            <h2
              className="mt-1 text-[length:var(--fs-subtitulo)] leading-snug text-gray-800"
              style={{ fontWeight: 600 }}
            >
              {subtitle}
            </h2>
          </div>
          {fillViewport ? null : (
            <div className="home-historias-card-efecto relative min-h-7 w-full flex-1">
              <HistoriasCardHoverDecor kind={hoverKind} enMedio />
            </div>
          )}
          <div
            className={
              fillViewport
                ? 'flex min-h-0 shrink-0 flex-col gap-3 md:gap-4'
                : 'flex shrink-0 flex-col justify-end gap-3 md:gap-4'
            }
          >
            <p className="shrink-0 overflow-y-auto pr-0.5 text-[length:var(--fs-texto)] font-normal leading-[1.6] text-gray-600 md:leading-[1.62]">
              {children}
            </p>
            <Link
              href={href}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onClick();
              }}
              className="btn-am-principal flex w-full shrink-0 items-center justify-center px-3 py-2.5 text-center text-[length:var(--fs-pequeno)] font-medium normal-case active:scale-[0.98] md:px-4 md:py-3"
              style={{ fontFamily: APP_FONT }}
            >
              {buttonLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export type HomeFormatCardsProps = {
  onRecordVideo: () => void;
  onRecordAudio: () => void;
  onWriteStory: () => void;
  onRecordPhoto: () => void;
  /** En la home: `historias` (ancla). En /subir se omite. */
  sectionId?: string;
  /** /subir: llena el alto visible y reparte el espacio entre tarjetas. No usar en la home. */
  fillViewport?: boolean;
  /** Conserva la pregunta del hilo al abrir un formato. */
  pregunta?: ContarPregunta | null;
  /** Home: el capítulo ya dice la bajada. Las tarjetas no cambian. */
  sinEtiqueta?: boolean;
};

/** Cada tarjeta se queda encendida 4,5 s; el cambio es un fundido largo (Ana, 6 nov 2026). */
const TURNO_MS = 4500;

/** Ronda del efecto: una tarjeta a la vez. El mouse manda mientras está encima. */
function useTurnoTarjetas() {
  /** Siempre hay una encendida: parte la primera, sin esperar el primer turno. */
  const [ronda, setRonda] = useState(0);
  const [mouse, setMouse] = useState<number | null>(null);

  useEffect(() => {
    let quieto = false;
    try {
      quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      quieto = false;
    }
    if (quieto) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setRonda((n) => (n + 1) % 4);
    }, TURNO_MS);
    return () => window.clearInterval(id);
  }, []);

  return {
    encendida: mouse ?? ronda,
    pasar: (indice: number, dentro: boolean) => {
      setMouse(dentro ? indice : null);
      if (!dentro) setRonda(indice);
    },
  };
}

export function HomeFormatCards({
  onRecordVideo,
  onRecordAudio,
  onWriteStory,
  onRecordPhoto,
  sectionId,
  fillViewport = false,
  pregunta = null,
  sinEtiqueta = false }: HomeFormatCardsProps) {
  const { t } = useHomeLocale();
  const turno = useTurnoTarjetas();

  return (
    <section
      id={sectionId}
      aria-label="Formatos para compartir tu historia"
      className={
        fillViewport
          ? 'relative z-[18] flex min-h-0 flex-1 flex-col px-4 py-2 sm:px-6 md:px-10 md:py-3 lg:px-12'
          : sinEtiqueta
          ? 'relative z-[18] px-6 pt-0 md:px-10 lg:flex lg:min-h-0 lg:grow lg:shrink lg:flex-col lg:px-10 lg:pt-0'
          : 'relative z-[18] mb-8 px-6 pb-10 pt-0 sm:pt-1 md:mb-12 md:px-10 md:pb-12 md:pt-2 lg:mb-0 lg:flex lg:min-h-0 lg:grow lg:shrink lg:flex-col lg:px-10 lg:pb-8 lg:pt-0'
      }
    >
      {!fillViewport && !sinEtiqueta ? <div aria-hidden className="home-hero-lead-gap" /> : null}
      {fillViewport ? (
        <p className="home-intro-avenir mx-auto mb-3 max-w-[min(100%,40rem)] shrink-0 px-1 text-center leading-snug tracking-normal md:mb-4 lg:mb-5">
          <span className="block text-[length:var(--fs-subtitulo)] font-medium tracking-normal text-[#FF4A1C] ">
            {t.historiasLead2}
          </span>
          <span className="home-elige-tuya mt-1 block text-[length:var(--fs-subtitulo)] font-semibold tracking-normal">
            {t.historiasLeadHow}
          </span>
        </p>
      ) : sinEtiqueta ? null : (
        <p
          className="home-intro-avenir mx-auto mb-4 max-w-[min(100%,40rem)] shrink-0 px-1 text-center text-[length:var(--fs-etiqueta)] font-semibold uppercase tracking-[0.14em] sm:mb-5 md:mb-6 lg:mb-0 lg:w-full lg:max-w-none"
          style={{ color: '#B8340F' }}
        >
          {t.heroFormatLabel}
        </p>
      )}
      <div
        className={
          fillViewport
            ? 'mx-auto grid h-full min-h-0 w-full max-w-[min(100%,1600px)] flex-1 grid-cols-2 grid-rows-2 items-stretch gap-4 sm:gap-5 md:gap-6 lg:grid-cols-4 lg:grid-rows-1 lg:gap-7 xl:gap-8'
            : sinEtiqueta
              ? 'home-hero-cards-gap mx-auto grid w-full max-w-[min(100%,1560px)] shrink-0 grid-cols-1 gap-y-12 px-1 sm:px-0 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-0 xl:gap-x-9 2xl:gap-x-11'
              : 'mx-auto mt-6 grid w-full max-w-[min(100%,1560px)] shrink-0 grid-cols-1 gap-y-12 px-1 sm:mt-7 sm:px-0 md:mt-8 lg:mt-14 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-0 xl:gap-x-9 2xl:gap-x-11'
        }
      >
        <SoftCard
          title={t.cardVideoTitle}
          subtitle={t.cardVideoSubtitle}
          buttonLabel={t.cardVideoCta}
          href={contarHref('video', pregunta)}
          onClick={onRecordVideo}
          delay="0s"
          hoverKind="video"
          encendida={turno.encendida === 0}
          onPasar={(dentro) => turno.pasar(0, dentro)}
          fillViewport={fillViewport}
        >
          {t.cardVideoBody}
        </SoftCard>
        <SoftCard
          title={t.cardAudioTitle}
          subtitle={t.cardAudioSubtitle}
          buttonLabel={t.cardAudioCta}
          href={contarHref('audio', pregunta)}
          onClick={onRecordAudio}
          delay="0.45s"
          hoverKind="audio"
          encendida={turno.encendida === 1}
          onPasar={(dentro) => turno.pasar(1, dentro)}
          fillViewport={fillViewport}
        >
          {t.cardAudioBody}
        </SoftCard>
        <SoftCard
          title={t.cardWriteTitle}
          subtitle={t.cardWriteSubtitle}
          buttonLabel={t.cardWriteCta}
          href={contarHref('texto', pregunta)}
          onClick={onWriteStory}
          delay="0.9s"
          hoverKind="text"
          encendida={turno.encendida === 2}
          onPasar={(dentro) => turno.pasar(2, dentro)}
          fillViewport={fillViewport}
        >
          {t.cardWriteBody}
        </SoftCard>
        <SoftCard
          title={t.cardPhotoTitle}
          subtitle={t.cardPhotoSubtitle}
          buttonLabel={t.cardPhotoCta}
          href={contarHref('foto', pregunta)}
          onClick={onRecordPhoto}
          delay="1.35s"
          hoverKind="photo"
          encendida={turno.encendida === 3}
          onPasar={(dentro) => turno.pasar(3, dentro)}
          fillViewport={fillViewport}
        >
          {t.cardPhotoBody}
        </SoftCard>
      </div>
    </section>
  );
}
