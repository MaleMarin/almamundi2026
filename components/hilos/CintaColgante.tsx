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
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CapituloHome } from '@/components/home/CapituloHome';
import { CortinaTemas } from '@/components/hilos/CortinaTemas';
import { HILOS, type Hilo } from '@/lib/hilos';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { HOME_MESSAGES } from '@/lib/i18n/home-messages';
import type { AlmaLocale } from '@/lib/i18n/locale';

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]';

const ALTOS = [232, 246, 236, 250, 228, 244, 230, 242, 234, 248, 226, 240, 238, 248, 232, 244];

const RITMO = [
  { periodo: 6.4, fase: 0.4 },
  { periodo: 7.6, fase: 1.8 },
  { periodo: 5.8, fase: 2.6 },
  { periodo: 7.1, fase: 0.9 },
  { periodo: 8.2, fase: 3.4 },
  { periodo: 6.1, fase: 1.2 },
  { periodo: 7.4, fase: 4.1 },
  { periodo: 5.5, fase: 2.1 },
  { periodo: 6.8, fase: 5.0 },
  { periodo: 8.0, fase: 0.2 },
  { periodo: 5.9, fase: 2.9 },
  { periodo: 7.3, fase: 1.5 },
] as const;

const ESTIRA_MS = 500;

type Dibujo = (now: number) => void;

function estira(t: number): number {
  const cae = Math.exp(-3.4 * t);
  return 1 + 0.2 * Math.sin(t * Math.PI) + 0.07 * Math.sin(t * Math.PI * 2.15) * cae;
}

function pose(now: number, index: number, escala: number) {
  const ritmo = RITMO[index % RITMO.length] ?? RITMO[0];
  const t = now / 1000;
  const omega = (Math.PI * 2) / ritmo.periodo;
  const brisa = Math.sin(t * omega + ritmo.fase);
  const onda = Math.sin(t * omega * 0.7 + ritmo.fase + 0.8);
  const rot = brisa * 2.6;
  const skew = onda * 1.15;
  return `scaleY(${escala.toFixed(3)}) rotate(${rot.toFixed(2)}deg) skewX(${skew.toFixed(2)}deg)`;
}

type Viento = {
  registrar: (dibujo: Dibujo) => () => void;
  viva: boolean;
};

const VientoCtx = createContext<Viento | null>(null);

function sinMovimiento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hrefTema(id: string): string {
  return `/preguntas?tema=${encodeURIComponent(id)}`;
}

export function CintaTema({
  id,
  index,
  nombre,
  imagen,
  aspecto,
  href,
  selected = false,
  atenuada = false,
  onPick,
}: {
  id: string;
  index: number;
  nombre: string;
  imagen: string;
  aspecto: number;
  href?: string;
  selected?: boolean;
  atenuada?: boolean;
  onPick?: () => void;
}) {
  const router = useRouter();
  const viento = useContext(VientoCtx);
  const imgRef = useRef<HTMLImageElement>(null);
  const escalaRef = useRef(1);
  const animando = useRef(false);
  const trago = useRef(false);
  const puntero = useRef<{ id: number; x: number; y: number; arrastre: boolean } | null>(null);
  const [mueve, setMueve] = useState(false);
  const alto = ALTOS[index] ?? 232;
  const ancho = Math.round(alto * aspecto);
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
    const draw: Dibujo = (now) => {
      const el = imgRef.current;
      if (!el) return;
      el.style.transform = pose(now, index, escalaRef.current);
    };
    const stop = viento.registrar(draw);
    return () => {
      stop();
      if (imgRef.current) imgRef.current.style.transform = '';
    };
  }, [animar, index, viento]);

  function pintar(now = performance.now()) {
    const el = imgRef.current;
    if (!el) return;
    el.style.transform = pose(now, index, escalaRef.current);
  }

  function ir() {
    escalaRef.current = 1;
    if (href) router.push(href);
    else onPick?.();
  }

  function jugarEstiron() {
    if (animando.current) return;
    animando.current = true;
    const inicio = performance.now();
    const paso = (now: number) => {
      const t = Math.min(1, (now - inicio) / ESTIRA_MS);
      escalaRef.current = estira(t);
      pintar(now);
      if (t < 1) {
        requestAnimationFrame(paso);
        return;
      }
      animando.current = false;
      escalaRef.current = 1;
      ir();
    };
    requestAnimationFrame(paso);
  }

  function alBajar(event: ReactPointerEvent<HTMLAnchorElement | HTMLButtonElement>) {
    if (event.button !== 0) return;
    trago.current = false;
    puntero.current = { id: event.pointerId, x: event.clientX, y: event.clientY, arrastre: false };
  }

  function alMover(event: ReactPointerEvent<HTMLAnchorElement | HTMLButtonElement>) {
    const p = puntero.current;
    if (!p || p.id !== event.pointerId || animando.current) return;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    if (!p.arrastre) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        puntero.current = null;
        trago.current = true;
        return;
      }
      if (dy > 8 && dy > Math.abs(dx)) {
        p.arrastre = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    if (!p.arrastre) return;
    escalaRef.current = 1 + Math.min(dy, 96) / 320;
    pintar();
  }

  function alSoltar(event: ReactPointerEvent<HTMLAnchorElement | HTMLButtonElement>) {
    const p = puntero.current;
    puntero.current = null;
    if (!p || p.id !== event.pointerId) return;
    if (!p.arrastre) return;
    trago.current = true;
    const dy = event.clientY - p.y;
    escalaRef.current = 1;
    pintar();
    if (dy > 36) ir();
  }

  function activar(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (sinMovimiento()) {
      if (!href) ir();
      return;
    }
    event.preventDefault();
    if (trago.current) {
      trago.current = false;
      return;
    }
    jugarEstiron();
  }

  const className = `cinta-tema flex w-[6.2rem] shrink-0 flex-col items-center border-0 bg-transparent px-1 pt-0 text-center no-underline transition-opacity duration-200 md:w-[6.4rem] ${atenuada ? 'opacity-50' : 'opacity-100'}`;
  const cuerpo = (
    <>
      <span
        className="cinta-tela-caja"
        style={{ '--cinta-ancho': `${ancho}px` } as CSSProperties}
      >
        <img
          ref={imgRef}
          src={imagen}
          alt=""
          draggable={false}
          decoding="async"
          className="cinta-tela-img"
        />
      </span>
      <span className="mt-2 text-[14px] font-semibold leading-tight text-[#4A5568] md:text-[15px]">{nombre}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        data-hilo={id}
        className={className}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onClick={activar}
        aria-current={selected ? 'true' : undefined}
      >
        {cuerpo}
      </Link>
    );
  }

  return (
    <button
      type="button"
      data-hilo={id}
      className={className}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      onClick={activar}
      aria-pressed={selected}
    >
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
  const [enInicio, setEnInicio] = useState(true);
  const [enFin, setEnFin] = useState(false);
  const copy = HILOS_UI[locale];
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
      dibujos.current.forEach((dibujo) => dibujo(now));
    };
    const seguir = () => {
      if (running || reduce.matches || !visible || document.hidden) return;
      running = true;
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

  useEffect(() => {
    const node = filaRef.current;
    if (!node) return;
    const medir = () => {
      const max = node.scrollWidth - node.clientWidth;
      setEnInicio(node.scrollLeft <= 1);
      setEnFin(max <= 1 || node.scrollLeft >= max - 1);
    };
    medir();
    node.addEventListener('scroll', medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(node);
    return () => {
      node.removeEventListener('scroll', medir);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const fila = filaRef.current;
    if (!fila || !selectedId) return;
    const el = fila.querySelector<HTMLElement>(`[data-hilo="${selectedId}"]`);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const filaRect = fila.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const left = elRect.left - filaRect.left + fila.scrollLeft - (fila.clientWidth - elRect.width) / 2;
    fila.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
  }, [selectedId]);

  function mover(direccion: -1 | 1) {
    const node = filaRef.current;
    if (!node) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollBy({
      left: direccion * Math.max(160, node.clientWidth * 0.72),
      behavior: reduce ? 'auto' : 'smooth',
    });
  }

  return (
    <VientoCtx.Provider value={viento}>
      <div className="cinta-marco">
        <button
          type="button"
          className={`cinta-flecha ${FOCUS}`}
          aria-label={copy.anterior}
          disabled={enInicio}
          onClick={() => mover(-1)}
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        <div className="cinta-ventana">
          {enInicio ? null : <div className="cinta-fade cinta-fade-izq" aria-hidden />}
          {enFin ? null : <div className="cinta-fade cinta-fade-der" aria-hidden />}
          <div ref={filaRef} className="cinta-fila" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="cinta-carril w-max">
              <div
                className="cinta-vidrio"
                style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
                aria-hidden
              />
              <div className="flex items-start gap-3 md:gap-4">
                {HILOS.map((item, index) => (
                  <CintaTema
                    key={item.id}
                    id={item.id}
                    index={index}
                    nombre={item.nombre[locale]}
                    imagen={item.imagen}
                    aspecto={item.aspecto}
                    href={enlazar ? hrefTema(item.id) : undefined}
                    selected={selectedId === item.id}
                    atenuada={selectedId != null && selectedId !== item.id}
                    onPick={onPick ? () => onPick(item) : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className={`cinta-flecha ${FOCUS}`}
          aria-label={copy.siguiente}
          disabled={enFin}
          onClick={() => mover(1)}
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </VientoCtx.Provider>
  );
}

export function BloqueCintasHome({ locale }: { locale: AlmaLocale }) {
  const copy = HILOS_UI[locale];
  const home = HOME_MESSAGES[locale];
  return (
    <section id="cintas" className="home-capitulo-bloque relative z-20 w-full scroll-mt-[10.5rem] md:scroll-mt-[var(--header-h)]">
      <CapituloHome
        ceja={home.cejaInspira}
        titulo={home.inspiraTitulo}
        tituloFuerte={home.inspiraFuerte}
        cita={home.inspiraCita}
        bajada={home.bajadaInspira}
        bajadaTactil={home.bajadaInspiraTactil}
        bajadaFuerte={home.inspiraLlamada}
        bajadaEnDosLineas
        llamadoPrimero
      />
      <div className="home-capitulo-ancho">
        <CortinaTemas locale={locale} capitulo />
      </div>
    </section>
  );
}
