'use client';

import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent } from 'react';
import { Camera, ChevronLeft, ChevronRight, Mic, PenLine } from 'lucide-react';
import { PreguntaFormForQuestion } from '@/components/pregunta/PreguntaForm';
import { HILOS, preguntaParaFormulario, preguntasDelTema } from '@/lib/hilos';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import type { AlmaLocale } from '@/lib/i18n/locale';
import type { PreguntaSemana } from '@/lib/pregunta-semana';

/** Colores del prototipo, en el mismo orden que los 12 temas. */
const TELON: { fondo: string; texto: string }[] = [
  { fondo: '#FFD000', texto: '#3C2F00' },
  { fondo: '#FF6200', texto: '#fff' },
  { fondo: '#FF1A1A', texto: '#fff' },
  { fondo: '#FF7EB6', texto: '#4A1A30' },
  { fondo: '#A8E000', texto: '#2A3300' },
  { fondo: '#00B140', texto: '#fff' },
  { fondo: '#0047FF', texto: '#fff' },
  { fondo: '#7A12E0', texto: '#fff' },
  { fondo: '#B07CFF', texto: '#2A1B47' },
  { fondo: '#FF0A8A', texto: '#fff' },
  { fondo: '#00C2D6', texto: '#fff' },
  { fondo: '#A0003C', texto: '#fff' },
];

type Formato = 'texto' | 'voz' | 'foto';

function indiceDe(tema: string | null, pregunta: string | null) {
  const lista = preguntasDelTema(tema);
  const indice = lista.findIndex((item) => item.id === pregunta);
  return indice >= 0 ? indice : 0;
}

type Cinta = {
  x: number;
  w: number;
  th: number;
  L: number;
  curve: number;
  A: number;
  f: number;
  ph: number;
};

function reduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function aleatorio(): number {
  return Math.floor(Math.random() * HILOS.length);
}

export function CortinaTemas({
  locale,
  initialTema = null,
  initialPregunta = null,
  enPagina = false,
  titulo = 'h2',
}: {
  locale: AlmaLocale;
  initialTema?: string | null;
  initialPregunta?: string | null;
  enPagina?: boolean;
  titulo?: 'h1' | 'h2';
}) {
  const copy = HILOS_UI[locale];
  const raizRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detrasRef = useRef<HTMLElement>(null);
  const nombreRef = useRef<HTMLDivElement>(null);
  const volverRef = useRef<HTMLButtonElement>(null);
  const cintasRef = useRef<Cinta[]>([]);
  const anchoRef = useRef(0);
  const altoRef = useRef(0);
  const semillaRef = useRef(7);
  const hoverRef = useRef(-1);
  const abiertoRef = useRef(initialTema ? HILOS.findIndex((hilo) => hilo.id === initialTema) : -1);
  const centroRef = useRef(0);
  const progresoRef = useRef(initialTema ? 1 : 0);
  const metaRef = useRef(initialTema ? 1 : 0);
  const inicioRef = useRef(0);
  const seguirRef = useRef<(() => void) | null>(null);
  const contenidoRef = useRef<HTMLDivElement>(null);
  const toqueRef = useRef<{ x: number; y: number } | null>(null);
  const pasoRef = useRef(indiceDe(initialTema, initialPregunta));
  const moverRef = useRef<(delta: number) => void>(() => {});
  const [temaId, setTemaId] = useState<string | null>(initialTema);
  const [preguntaId, setPreguntaId] = useState<string | null>(null);
  const [pasoIndice, setPasoIndice] = useState(() => indiceDe(initialTema, initialPregunta));
  const [formato, setFormato] = useState<Formato | null>(null);
  const [marcada, setMarcada] = useState(initialTema ? HILOS.findIndex((hilo) => hilo.id === initialTema) : -1);

  function publicar(id: string | null) {
    if (!enPagina) return;
    const url = id ? `/preguntas?p=${encodeURIComponent(id)}` : '/preguntas';
    window.history.replaceState(null, '', url);
  }

  function abrir(indice: number, x?: number) {
    const hilo = HILOS[indice];
    const tela = TELON[indice];
    if (!hilo || !tela) return;
    abiertoRef.current = indice;
    centroRef.current = x ?? anchoRef.current / 2;
    metaRef.current = 1;
    hoverRef.current = -1;
    setMarcada(-1);
    if (nombreRef.current) nombreRef.current.hidden = true;
    const detras = detrasRef.current;
    if (detras) {
      detras.style.setProperty('--cortina-fondo', tela.fondo);
      detras.style.setProperty('--cortina-texto', tela.texto);
      detras.style.visibility = 'visible';
      detras.scrollTop = 0;
    }
    setTemaId(hilo.id);
    setPreguntaId(null);
    setFormato(null);
    pasoRef.current = 0;
    setPasoIndice(0);
    publicar(hilo.id);
    const lienzo = canvasRef.current;
    if (lienzo) {
      lienzo.style.visibility = 'visible';
      lienzo.style.pointerEvents = 'none';
    }
    seguirRef.current?.();
    mostrarCaja();
  }

  function cerrar() {
    metaRef.current = 0;
    hoverRef.current = -1;
    setMarcada(-1);
    if (nombreRef.current) nombreRef.current.hidden = true;
    const lienzo = canvasRef.current;
    if (lienzo) lienzo.style.visibility = 'visible';
    seguirRef.current?.();
    fijarAlto(false);
  }

  function altoCortina() {
    return Math.max(380, Math.min(520, window.innerHeight * 0.7));
  }

  function altoContenido() {
    const detras = detrasRef.current;
    const cuerpo = contenidoRef.current;
    if (!detras || !cuerpo) return altoCortina();
    const estilo = getComputedStyle(detras);
    const relleno = parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom);
    return Math.ceil(cuerpo.getBoundingClientRect().height + relleno);
  }

  function fijarAlto(abierta: boolean) {
    const stage = stageRef.current;
    if (!stage) return;
    const destino = abierta ? Math.max(altoCortina(), altoContenido()) : altoCortina();
    if (reduceMotion()) {
      stage.style.height = abierta ? `${Math.round(destino)}px` : '';
      return;
    }
    const actual = stage.getBoundingClientRect().height;
    if (Math.abs(actual - destino) < 1) {
      stage.style.height = abierta ? `${Math.round(destino)}px` : '';
      return;
    }
    stage.style.height = `${actual}px`;
    stage.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (stageRef.current) stageRef.current.style.height = `${Math.round(destino)}px`;
    });
  }

  function mostrarCaja() {
    const stage = stageRef.current;
    if (!stage) return;
    const menu = document.querySelector('header');
    const altoMenu = menu?.getBoundingClientRect().height ?? 0;
    const top = stage.getBoundingClientRect().top + window.scrollY - altoMenu - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  useEffect(() => {
    if (!temaId) return;
    const volver = volverRef.current;
    const espera = window.setTimeout(() => volver?.focus({ preventScroll: true }), reduceMotion() ? 0 : 500);
    return () => window.clearTimeout(espera);
  }, [temaId]);

  useEffect(() => {
    function alTeclado(event: KeyboardEvent) {
      if (event.key === 'Escape' && metaRef.current === 1) cerrar();
      if (metaRef.current !== 1 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      const campo = event.target as HTMLElement | null;
      const etiqueta = campo?.tagName;
      if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT' || campo?.isContentEditable) return;
      event.preventDefault();
      moverRef.current(event.key === 'ArrowRight' ? 1 : -1);
    }
    window.addEventListener('keydown', alTeclado);
    return () => window.removeEventListener('keydown', alTeclado);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const detras = detrasRef.current;
    if (!stage || !canvas || !detras) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    inicioRef.current = performance.now();
    let marco = 0;
    let viva = true;
    let corriendo = false;

    function azar() {
      semillaRef.current = (semillaRef.current * 16807) % 2147483647;
      return (semillaRef.current - 1) / 2147483646;
    }

    function armar() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ancho = stage.clientWidth;
      const alto = Math.max(380, Math.min(520, window.innerHeight * 0.7));
      if (cintasRef.current.length && ancho === anchoRef.current && alto === altoRef.current) return;
      anchoRef.current = ancho;
      altoRef.current = alto;
      canvas.width = Math.max(1, Math.floor(ancho * dpr));
      canvas.height = Math.max(1, Math.floor(alto * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      semillaRef.current = 7;
      const cintas: Cinta[] = [];
      let x = -6;
      const base = ancho < 640 ? 9 : 13;
      while (x < ancho + 10) {
        const w = base * (0.8 + azar() * 0.9);
        cintas.push({
          x: x + w / 2,
          w,
          th: Math.floor(azar() * 12),
          L: alto * (0.86 + azar() * 0.16),
          curve: (azar() - 0.5) * 50,
          A: 3 + azar() * 6,
          f: 0.6 + azar() * 0.7,
          ph: azar() * 6.28,
        });
        x += w * (0.62 + azar() * 0.25);
      }
      cintasRef.current = cintas;
      if (centroRef.current === 0) centroRef.current = ancho / 2;
    }

    function xEn(cinta: Cinta, y: number, tiempo: number, quieto: boolean) {
      const avance = Math.pow(y / cinta.L, 1.6);
      let desplazamiento = cinta.curve * avance;
      if (!quieto) {
        desplazamiento += cinta.A * Math.sin(tiempo * cinta.f + cinta.ph) * avance;
        const rafaga = ((tiempo * 0.18) % 1.6) * (anchoRef.current + 600) - 300;
        const distancia = (cinta.x - rafaga) / 160;
        desplazamiento += 14 * Math.exp(-(distancia * distancia)) * avance;
      }
      const lado = cinta.x < centroRef.current ? -1 : 1;
      const avanceApertura = progresoRef.current * progresoRef.current;
      const salida = anchoRef.current + cinta.w + Math.abs(cinta.curve) + cinta.A + 14;
      const apertura = avanceApertura * salida;
      return cinta.x + desplazamiento + lado * apertura;
    }

    function temaEn(mx: number, my: number, tiempo: number, quieto: boolean) {
      const cintas = cintasRef.current;
      for (let i = cintas.length - 1; i >= 0; i -= 1) {
        const cinta = cintas[i];
        if (!cinta || my > cinta.L) continue;
        if (Math.abs(mx - xEn(cinta, my, tiempo, quieto)) <= cinta.w / 2) return cinta.th;
      }
      return -1;
    }

    let previo = performance.now();

    function pintar(ahora: number) {
      const quieto = reduceMotion();
      const tiempo = (ahora - inicioRef.current) / 1000;
      const meta = metaRef.current;
      const paso = Math.max(0, Math.min(ahora - previo, 2000));
      previo = ahora;
      let progreso = progresoRef.current;
      const avance = quieto ? 1 : 1 - Math.exp(-paso / 180);
      const restante = Math.abs(meta - progreso);
      if (restante <= 0.001) progreso = meta;
      else {
        const siguiente = progreso + (meta - progreso) * avance;
        progreso = Math.abs(meta - siguiente) <= 0.001 ? meta : siguiente;
      }
      progresoRef.current = progreso;
      if (progreso === 0 && meta === 0 && abiertoRef.current >= 0) {
        abiertoRef.current = -1;
        detras.style.visibility = 'hidden';
        canvas.style.visibility = 'visible';
        setTemaId(null);
        setPreguntaId(null);
        publicar(null);
      }
      if (progreso === 1 && meta === 1) {
        canvas.style.visibility = 'hidden';
        canvas.style.pointerEvents = 'none';
        detras.style.visibility = 'visible';
        return;
      }
      canvas.style.visibility = 'visible';
      ctx.clearRect(0, 0, anchoRef.current, altoRef.current);
      const hover = hoverRef.current;
      for (const cinta of cintasRef.current) {
        const tela = TELON[cinta.th];
        if (!tela) continue;
        ctx.globalAlpha = hover >= 0 && cinta.th !== hover && progreso < 0.05 ? 0.28 : 1;
        ctx.beginPath();
        const pasos = 18;
        for (let i = 0; i <= pasos; i += 1) {
          const y = (cinta.L * i) / pasos;
          ctx.lineTo(xEn(cinta, y, tiempo, quieto) - cinta.w / 2, y);
        }
        for (let i = pasos; i >= 0; i -= 1) {
          const y = (cinta.L * i) / pasos;
          ctx.lineTo(xEn(cinta, y, tiempo, quieto) + cinta.w / 2, y);
        }
        ctx.closePath();
        ctx.fillStyle = tela.fondo;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.07)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      canvas.style.pointerEvents = progreso > 0.5 ? 'none' : 'auto';
      detras.style.visibility = progreso > 0.02 || meta > 0 ? 'visible' : 'hidden';
    }

    function enCurso() {
      return Math.abs(metaRef.current - progresoRef.current) > 0.001;
    }

    function enPantalla() {
      return viva && document.visibilityState !== 'hidden';
    }

    let tipoMarco = '';

    function cancelarMarco() {
      if (tipoMarco === 'timeout') window.clearTimeout(marco);
      else cancelAnimationFrame(marco);
      tipoMarco = '';
    }

    function programar() {
      if (enCurso()) {
        corriendo = true;
        tipoMarco = 'timeout';
        marco = window.setTimeout(() => cuadro(performance.now()), 16);
        return;
      }
      if (enPantalla()) {
        corriendo = true;
        tipoMarco = 'frame';
        marco = requestAnimationFrame(cuadro);
        return;
      }
      corriendo = false;
    }

    function cuadro(ahora: number) {
      corriendo = true;
      pintar(ahora);
      programar();
    }

    function seguir() {
      if (!corriendo && (enCurso() || enPantalla())) programar();
    }

    function forzar() {
      cancelarMarco();
      corriendo = false;
      programar();
    }

    seguirRef.current = forzar;
    armar();
    if (metaRef.current === 1 && progresoRef.current === 1) {
      canvas.style.visibility = 'hidden';
      canvas.style.pointerEvents = 'none';
    }
    if (abiertoRef.current >= 0) {
      const tela = TELON[abiertoRef.current];
      if (tela) {
        detras.style.setProperty('--cortina-fondo', tela.fondo);
        detras.style.setProperty('--cortina-texto', tela.texto);
        detras.style.visibility = 'visible';
      }
    } else {
      detras.style.visibility = 'hidden';
    }
    seguir();

    const vista = new IntersectionObserver((entradas) => {
      viva = entradas.some((entrada) => entrada.isIntersecting);
      seguir();
    });
    vista.observe(stage);
    const tamanos = new ResizeObserver(() => armar());
    tamanos.observe(stage);
    document.addEventListener('visibilitychange', seguir);

    function mover(event: PointerEvent) {
      if (metaRef.current > 0) return;
      const caja = canvas.getBoundingClientRect();
      const mx = event.clientX - caja.left;
      const my = event.clientY - caja.top;
      const quieto = reduceMotion();
      const tiempo = (performance.now() - inicioRef.current) / 1000;
      const tema = temaEn(mx, my, tiempo, quieto);
      hoverRef.current = tema;
      setMarcada(tema);
      const nombre = nombreRef.current;
      const hilo = HILOS[tema];
      if (!nombre) return;
      if (tema >= 0 && hilo) {
        nombre.hidden = false;
        nombre.textContent = hilo.nombre[locale];
        nombre.style.left = `${mx}px`;
        nombre.style.top = `${my}px`;
      } else {
        nombre.hidden = true;
      }
    }

    function salir() {
      hoverRef.current = -1;
      setMarcada(-1);
      if (nombreRef.current) nombreRef.current.hidden = true;
    }

    function clic(event: MouseEvent) {
      if (metaRef.current > 0) return;
      const caja = canvas.getBoundingClientRect();
      const mx = event.clientX - caja.left;
      const my = event.clientY - caja.top;
      const quieto = reduceMotion();
      const tiempo = (performance.now() - inicioRef.current) / 1000;
      const tema = temaEn(mx, my, tiempo, quieto);
      if (tema >= 0) abrir(tema, mx);
    }

    canvas.addEventListener('pointermove', mover);
    canvas.addEventListener('pointerleave', salir);
    canvas.addEventListener('click', clic);

    return () => {
      cancelarMarco();
      vista.disconnect();
      tamanos.disconnect();
      seguirRef.current = null;
      document.removeEventListener('visibilitychange', seguir);
      canvas.removeEventListener('pointermove', mover);
      canvas.removeEventListener('pointerleave', salir);
      canvas.removeEventListener('click', clic);
    };
  }, [enPagina, locale]);

  const hilo = HILOS.find((item) => item.id === temaId) ?? null;
  const preguntas = preguntasDelTema(temaId);
  const preguntaActual = preguntas[pasoIndice] ?? null;
  const formulario =
    formato && preguntaActual ? (preguntaParaFormulario(preguntaActual.id) as PreguntaSemana | null) : null;

  function verTema(indice: number) {
    abrir(indice, anchoRef.current / 2);
  }

  function moverPaso(delta: number) {
    const total = preguntasDelTema(temaId).length;
    if (!total) return;
    const siguiente = (pasoRef.current + delta + total) % total;
    pasoRef.current = siguiente;
    setPasoIndice(siguiente);
    setPreguntaId(null);
    setFormato(null);
    if (temaId) publicar(temaId);
  }

  moverRef.current = moverPaso;

  function elegirFormato(kind: Formato) {
    const pregunta = preguntasDelTema(temaId)[pasoIndice];
    if (!pregunta) return;
    setFormato(kind);
    setPreguntaId(pregunta.id);
    publicar(pregunta.id);
  }

  function soltarDedo(event: TouchEvent) {
    const inicio = toqueRef.current;
    toqueRef.current = null;
    if (!inicio) return;
    const dedo = event.changedTouches[0];
    if (!dedo) return;
    const dx = dedo.clientX - inicio.x;
    const dy = dedo.clientY - inicio.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    moverPaso(dx < 0 ? 1 : -1);
  }

  useLayoutEffect(() => {
    const cuerpo = contenidoRef.current;
    if (!temaId || metaRef.current !== 1) return;
    fijarAlto(true);
    if (!cuerpo) return;
    const obs = new ResizeObserver(() => {
      if (metaRef.current === 1) fijarAlto(true);
    });
    obs.observe(cuerpo);
    return () => obs.disconnect();
  }, [temaId, preguntaId, locale]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    function fin(event: TransitionEvent) {
      if (event.propertyName !== 'height' || event.target !== stage) return;
      if (metaRef.current === 0 && stage) stage.style.height = '';
    }
    stage.addEventListener('transitionend', fin);
    return () => stage.removeEventListener('transitionend', fin);
  }, []);

  useEffect(() => {
    if (initialTema) mostrarCaja();
  }, []);

  return (
    <div className="cortina font-interna" ref={raizRef}>
      <p className="cortina-ceja">{copy.ceja}</p>
      {titulo === 'h1' ? (
        <h1 className="cortina-titulo">{copy.bloqueTitulo}</h1>
      ) : (
        <h2 className="cortina-titulo">{copy.bloqueTitulo}</h2>
      )}
      <p className="cortina-sub">{copy.descubre}</p>
      <div className={temaId ? 'cortina-stage abierta' : 'cortina-stage'} ref={stageRef}>
        <section
          ref={detrasRef}
          className="cortina-detras"
          aria-live="polite"
          aria-hidden={temaId ? undefined : true}
          style={
            temaId
              ? {
                  visibility: 'visible',
                  ['--cortina-fondo' as string]: TELON[HILOS.findIndex((item) => item.id === temaId)]?.fondo,
                  ['--cortina-texto' as string]: TELON[HILOS.findIndex((item) => item.id === temaId)]?.texto,
                }
              : undefined
          }
        >
          <div className="cortina-cuerpo" ref={contenidoRef}>
            <div className="cortina-cabecera">
              {hilo ? <h2>{hilo.nombre[locale]}</h2> : null}
              <button ref={volverRef} className="cortina-volver" type="button" onClick={cerrar}>
                {copy.volver}
              </button>
            </div>
            <p className="cortina-paso">{copy.paso}</p>
            {preguntaActual ? (
              <div
                className="cortina-pregunta"
                onTouchStart={(event) => {
                  const dedo = event.changedTouches[0];
                  if (dedo) toqueRef.current = { x: dedo.clientX, y: dedo.clientY };
                }}
                onTouchEnd={soltarDedo}
              >
                <p key={preguntaActual.id}>{preguntaActual.texto[locale]}</p>
              </div>
            ) : null}
            {formulario ? (
              <PreguntaFormForQuestion pregunta={formulario} formato={formato ?? 'texto'} />
            ) : (
              <div className="cortina-formatos">
                <button type="button" className="cortina-formato" onClick={() => elegirFormato('texto')}>
                  <PenLine size={20} strokeWidth={1.75} aria-hidden />
                  {copy.escribir}
                </button>
                <button type="button" className="cortina-formato" onClick={() => elegirFormato('voz')}>
                  <Mic size={20} strokeWidth={1.75} aria-hidden />
                  {copy.contarVoz}
                </button>
                <button type="button" className="cortina-formato" onClick={() => elegirFormato('foto')}>
                  <Camera size={20} strokeWidth={1.75} aria-hidden />
                  {copy.conFoto}
                </button>
              </div>
            )}
            <div className="cortina-pasador">
              <button type="button" className="cortina-flecha" aria-label={copy.previa} onClick={() => moverPaso(-1)}>
                <ChevronLeft size={26} strokeWidth={1.75} aria-hidden />
              </button>
              <div className="cortina-puntos">
                {preguntas.map((pregunta, indice) => (
                  <button
                    key={pregunta.id}
                    type="button"
                    className={indice === pasoIndice ? 'cortina-punto ahora' : 'cortina-punto'}
                    aria-label={`${indice + 1}`}
                    aria-current={indice === pasoIndice ? 'true' : undefined}
                    onClick={() => {
                      pasoRef.current = indice;
                      setPasoIndice(indice);
                      setPreguntaId(null);
                      setFormato(null);
                      if (temaId) publicar(temaId);
                    }}
                  />
                ))}
              </div>
              <button type="button" className="cortina-flecha" aria-label={copy.proxima} onClick={() => moverPaso(1)}>
                <ChevronRight size={26} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </div>
        </section>
        <canvas ref={canvasRef} className="cortina-lienzo" aria-hidden />
        <div ref={nombreRef} className="cortina-nombre" hidden />
      </div>
      {temaId ? null : <p className="cortina-pista">{copy.pista}</p>}
      <div className="cortina-leyenda">
        {HILOS.map((hiloTema, indice) => (
          <button
            key={hiloTema.id}
            type="button"
            className={marcada === indice ? 'cortina-etiqueta esta' : 'cortina-etiqueta'}
            style={{ ['--cortina-fondo' as string]: TELON[indice]?.fondo }}
            onMouseEnter={() => {
              if (metaRef.current !== 0) return;
              hoverRef.current = indice;
              setMarcada(indice);
            }}
            onFocus={() => {
              if (metaRef.current !== 0) return;
              hoverRef.current = indice;
              setMarcada(indice);
            }}
            onMouseLeave={() => {
              hoverRef.current = -1;
              setMarcada(-1);
            }}
            onBlur={() => {
              hoverRef.current = -1;
              setMarcada(-1);
            }}
            onClick={() => verTema(indice)}
          >
            <i aria-hidden />
            {hiloTema.nombre[locale]}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="cortina-azar"
        onClick={() => verTema(aleatorio())}
      >
        {copy.azar}
      </button>
    </div>
  );
}
