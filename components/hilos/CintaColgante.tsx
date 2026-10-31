'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HILOS, preguntaAlAzar, type Hilo } from '@/lib/hilos';
import { HILOS_UI, tituloHiloPartes } from '@/lib/i18n/hilos-messages';
import type { AlmaLocale } from '@/lib/i18n/locale';

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]';

const ALTOS = [214, 252, 228, 276, 206, 264, 198, 248, 220, 268, 210, 240];

const RITMO = [
  { periodo: 3.3, freq: 0.42, fase: 0.4, brisa: 4.6, rafaga: 13 },
  { periodo: 4.2, freq: 0.5, fase: 1.8, brisa: 3.8, rafaga: 15 },
  { periodo: 2.9, freq: 0.36, fase: 2.6, brisa: 5.2, rafaga: 12 },
  { periodo: 3.8, freq: 0.55, fase: 0.9, brisa: 4.2, rafaga: 14 },
  { periodo: 4.6, freq: 0.33, fase: 3.4, brisa: 3.6, rafaga: 16 },
  { periodo: 3.1, freq: 0.48, fase: 1.2, brisa: 5.0, rafaga: 13 },
  { periodo: 4.0, freq: 0.4, fase: 4.1, brisa: 4.0, rafaga: 15 },
  { periodo: 2.7, freq: 0.58, fase: 2.1, brisa: 5.4, rafaga: 12 },
  { periodo: 3.6, freq: 0.37, fase: 5.0, brisa: 4.4, rafaga: 14 },
  { periodo: 4.4, freq: 0.46, fase: 0.2, brisa: 3.7, rafaga: 16 },
  { periodo: 3.0, freq: 0.52, fase: 2.9, brisa: 4.8, rafaga: 13 },
  { periodo: 3.9, freq: 0.34, fase: 1.5, brisa: 4.1, rafaga: 15 },
] as const;

const TIRON_MS = 420;

type Dibujo = (now: number, rafagaEn: number) => void;

type Viento = {
  registrar: (dibujo: Dibujo) => () => void;
  viva: boolean;
};

const VientoCtx = createContext<Viento | null>(null);

function sinMovimiento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pintarCinta(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  now: number,
  rafagaEn: number,
  index: number
) {
  const ritmo = RITMO[index % RITMO.length] ?? RITMO[0];
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const pequeno = rect.width < 90;
  const tope = pequeno ? 150 : 170;
  const dpr = Math.min(window.devicePixelRatio || 1, pequeno ? 1.25 : 1.35, tope / rect.height);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  const pad = Math.min(8 * dpr, w * 0.14);
  const drawW = w - pad * 2;
  const t = now / 1000;
  const local = now - rafagaEn - index * 120;
  const gust = local > 0 && local < 1700 ? Math.sin((local / 1700) * Math.PI) : 0;
  const omega = (Math.PI * 2) / ritmo.periodo;
  const step = 1;
  for (let y = 0; y < h; y += step) {
    const fall = (y / (h - 1)) ** 1.7;
    const onda = (y / h) * 8;
    const brisa = Math.sin(t * omega + onda + ritmo.fase) * ritmo.brisa * dpr * fall;
    const ola = Math.sin(t * 2.4 + onda * 1.2 + ritmo.fase) * ritmo.rafaga * dpr * fall * gust;
    const sy = (y / (h - 1)) * (img.naturalHeight - 1);
    ctx.drawImage(img, 0, sy, img.naturalWidth, 1, pad + brisa + ola, y, drawW, 1);
  }
}

export function hrefTema(id: string): string {
  return `/preguntas?tema=${encodeURIComponent(id)}`;
}

export function CintaTema({
  index,
  nombre,
  imagen,
  aspecto,
  href,
  selected = false,
  onPick,
}: {
  index: number;
  nombre: string;
  imagen: string;
  aspecto: number;
  href?: string;
  selected?: boolean;
  onPick?: () => void;
}) {
  const router = useRouter();
  const viento = useContext(VientoCtx);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tirando, setTirando] = useState(false);
  const [mueve, setMueve] = useState(false);
  const alto = ALTOS[index] ?? 220;
  const ancho = Math.round(alto * aspecto) + 16;
  const animar = mueve && Boolean(viento?.viva);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aplicar = () => setMueve(!mq.matches);
    aplicar();
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, []);

  useEffect(() => {
    if (!animar || !viento) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const draw: Dibujo = (now, rafagaEn) => {
      if (!img.complete || !img.naturalWidth) return;
      pintarCinta(canvas, img, now, rafagaEn, index);
    };
    draw(performance.now(), -1e12);
    return viento.registrar(draw);
  }, [animar, index, viento]);

  function ir() {
    if (href) router.push(href);
    else onPick?.();
  }

  function activar(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (sinMovimiento()) {
      if (!href) ir();
      return;
    }
    event.preventDefault();
    if (tirando) return;
    setTirando(true);
    window.setTimeout(ir, TIRON_MS);
  }

  const className = `flex w-[6.4rem] shrink-0 flex-col items-center border-0 bg-transparent px-0.5 pt-0 text-center no-underline md:w-[7.6rem] ${FOCUS}`;
  const cuerpo = (
    <>
      <span className={`cinta-tela-eje${tirando ? ' is-tiron' : ''}`}>
        <span
          className="cinta-tela-caja"
          style={{ '--cinta-alto': `${alto}px`, '--cinta-ancho': `${ancho}px` } as CSSProperties}
        >
          <img
            ref={imgRef}
            src={imagen}
            alt=""
            draggable={false}
            decoding="async"
            className={animar ? 'cinta-tela-img is-oculta' : 'cinta-tela-img'}
          />
          {animar ? <canvas ref={canvasRef} className="cinta-tela-lienzo" aria-hidden /> : null}
        </span>
      </span>
      <span className="mt-2 text-[12px] font-semibold leading-tight text-[#4A5568] md:text-[13px]">{nombre}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={activar} aria-current={selected ? 'true' : undefined}>
        {cuerpo}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={activar} aria-pressed={selected}>
      {cuerpo}
    </button>
  );
}

export function FilaCintas({
  locale,
  selectedId = null,
  enlazar = false,
  onPick,
}: {
  locale: AlmaLocale;
  selectedId?: string | null;
  enlazar?: boolean;
  onPick?: (hilo: Hilo) => void;
}) {
  const filaRef = useRef<HTMLDivElement>(null);
  const dibujos = useRef<Set<Dibujo>>(new Set());
  const [viva, setViva] = useState(false);
  const registrar = useCallback((dibujo: Dibujo) => {
    dibujos.current.add(dibujo);
    return () => {
      dibujos.current.delete(dibujo);
    };
  }, []);
  const viento = useMemo(() => ({ registrar, viva }), [registrar, viva]);

  useEffect(() => {
    const node = filaRef.current;
    if (!node) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let running = false;
    let visible = false;
    let rafagaEn = -1e12;
    let proxima = 0;
    let ultimo = 0;

    const parar = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const tick = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      if (now - ultimo < 34) return;
      ultimo = now;
      if (now >= proxima) {
        rafagaEn = now;
        proxima = now + 6800 + Math.random() * 8400;
      }
      dibujos.current.forEach((dibujo) => dibujo(now, rafagaEn));
    };
    const seguir = () => {
      if (running || reduce.matches || !visible || document.hidden) return;
      running = true;
      if (!proxima) proxima = performance.now() + 1600 + Math.random() * 2200;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        setViva(visible);
        if (visible) seguir();
        else parar();
      },
      { threshold: 0.12 }
    );
    io.observe(node);
    const alReducir = () => {
      if (reduce.matches) parar();
      else seguir();
    };
    const alOcultar = () => {
      if (document.hidden) parar();
      else seguir();
    };
    reduce.addEventListener('change', alReducir);
    document.addEventListener('visibilitychange', alOcultar);
    return () => {
      parar();
      io.disconnect();
      reduce.removeEventListener('change', alReducir);
      document.removeEventListener('visibilitychange', alOcultar);
    };
  }, []);

  return (
    <VientoCtx.Provider value={viento}>
      <div ref={filaRef} className="overflow-x-auto pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="w-max min-w-full px-1">
          <div className="h-[3px] rounded-full bg-[#B8C0CC]" />
          <div className="flex items-start justify-between gap-2 md:gap-3">
            {HILOS.map((item, index) => (
              <CintaTema
                key={item.id}
                index={index}
                nombre={item.nombre[locale]}
                imagen={item.imagen}
                aspecto={item.aspecto}
                href={enlazar ? hrefTema(item.id) : undefined}
                selected={selectedId === item.id}
                onPick={onPick ? () => onPick(item) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </VientoCtx.Provider>
  );
}

export function BloqueCintasHome({ locale }: { locale: AlmaLocale }) {
  const router = useRouter();
  const copy = HILOS_UI[locale];
  const titulo = tituloHiloPartes(copy.bloqueTitulo);

  function alAzar() {
    const tema = preguntaAlAzar(null);
    if (!tema) return;
    router.push(`/preguntas?p=${encodeURIComponent(tema.id)}`);
  }

  return (
    <section className="relative z-20 mx-auto mt-10 mb-16 w-full max-w-[80rem] scroll-mt-[10.5rem] px-4 sm:px-6 md:mb-24 md:mt-14 md:scroll-mt-[13rem] lg:scroll-mt-[14.75rem]">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF4A1C]">{copy.ceja}</p>
        <h2 className="mx-auto mt-4 max-w-[22ch] text-[length:var(--fs-titular)] font-normal leading-[1.2] text-[#4A5568] md:max-w-none">
          {titulo.antes} <strong className="font-bold">{titulo.cierre}</strong>
        </h2>
      </header>
      <div className="mt-10">
        <FilaCintas locale={locale} enlazar />
      </div>
      <p className="mx-auto mt-6 text-center">
        <button
          type="button"
          onClick={alAzar}
          className={`inline-flex min-h-11 items-center text-[length:var(--fs-pequeno)] font-medium text-[#4A5568] underline decoration-[#FF4A1C]/40 underline-offset-4 hover:text-[#FF4A1C] ${FOCUS}`}
        >
          {copy.azar}
        </button>
      </p>
    </section>
  );
}
