'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Camera, Mic, PenLine } from 'lucide-react';
import { PreguntaFormForQuestion } from '@/components/pregunta/PreguntaForm';
import { HILOS, preguntaParaFormulario, preguntasDelTema, type Hilo } from '@/lib/hilos';
import { ME_PREGUNTO_ID } from '@/lib/me-pregunto/shared';
import { ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { MePreguntoPanel } from '@/components/hilos/MePreguntoPanel';
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
  // 13: «Me pregunto…» (en la cortina se dibuja multicolor).
  { fondo: '#3C4655', texto: '#fff' },
];

/** Colores de las cintas en la cortina: los 12 colores originales de los temas. */
const VIVO = TELON.map((t) => t.fondo);
/** Capa de atrás: los mismos colores, sin oscurecer. */
const VIVO_ATRAS = VIVO;

/** Fondo del panel. Si el blanco no llega a 4.5 sobre la cinta, el mismo tono baja de luz. Las cintas siguen en TELON. */
const PANEL: { fondo: string; texto: string; boton: string }[] = [
  { fondo: '#FFD000', texto: '#3C2F00', boton: '#3C2F00' },
  { fondo: '#CC4E00', texto: '#fff', boton: '#CC4E00' },
  { fondo: '#EE0000', texto: '#fff', boton: '#EE0000' },
  { fondo: '#FF7EB6', texto: '#4A1A30', boton: '#4A1A30' },
  { fondo: '#A8E000', texto: '#2A3300', boton: '#2A3300' },
  { fondo: '#008932', texto: '#fff', boton: '#008932' },
  { fondo: '#0047FF', texto: '#fff', boton: '#0047FF' },
  { fondo: '#7A12E0', texto: '#fff', boton: '#7A12E0' },
  { fondo: '#B07CFF', texto: '#2A1B47', boton: '#2A1B47' },
  { fondo: '#E60078', texto: '#fff', boton: '#E60078' },
  { fondo: '#008391', texto: '#fff', boton: '#008391' },
  { fondo: '#A0003C', texto: '#fff', boton: '#A0003C' },
  { fondo: '#3C4655', texto: '#fff', boton: '#3C4655' },
];

/** Los 12 temas y «Me pregunto…», la cinta multicolor de las preguntas de la gente. */
const ME_HILO = {
  id: ME_PREGUNTO_ID,
  nombre: { es: ME_PREGUNTO_UI.es.nombre, pt: ME_PREGUNTO_UI.pt.nombre, en: ME_PREGUNTO_UI.en.nombre },
  color: '#3C4655',
  imagen: '',
  aspecto: 1,
} as unknown as Hilo;
const TEMAS: Hilo[] = [...HILOS, ME_HILO];
const ME_INDICE = TEMAS.length - 1;

/** Rayas de la cinta multicolor: seis colores de los temas. */
const MULTI = ['#FFD000', '#FF1A1A', '#FF0A8A', '#7A12E0', '#0047FF', '#00B140'];

function marcaCasilla(color: string) {
  const tinta = color.replace('#', '%23');
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M4.5 10.5l3.2 3.2 7.8-8' fill='none' stroke='${tinta}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;
}

function aplicarPanel(nodo: HTMLElement, indice: number) {
  const tela = PANEL[indice];
  if (!tela) return;
  nodo.style.setProperty('--cortina-fondo', tela.fondo);
  nodo.style.setProperty('--cortina-texto', tela.texto);
  nodo.style.setProperty('--cortina-boton', tela.boton);
  nodo.style.setProperty('--cortina-check', marcaCasilla(tela.texto));
}

type Formato = 'texto' | 'voz' | 'foto';

function preguntaInicial(tema: string | null, pregunta: string | null) {
  if (!tema || !pregunta) return null;
  return preguntasDelTema(tema).some((item) => item.id === pregunta) ? pregunta : null;
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

/** Las demás cintas bajan a este nivel. El camino se recorre casi entero en 400 ms. */
/** Cuánto se mecen las cintas con el viento (1 = movimiento original). */
const VIENTO = 1.6;
const ATENUAR = 0.75;
const ATENUAR_MS = 170;
const ESPERA_TEMA_MS = 120;

function aleatorio(): number {
  return Math.floor(Math.random() * HILOS.length);
}

export function CortinaTemas({
  locale,
  initialTema = null,
  initialPregunta = null,
  enPagina = false,
  titulo = 'h2',
  capitulo = false,
}: {
  locale: AlmaLocale;
  initialTema?: string | null;
  initialPregunta?: string | null;
  enPagina?: boolean;
  titulo?: 'h1' | 'h2';
  /** En la home el capítulo ya trae el título y las cintas no muestran etiquetas. */
  capitulo?: boolean;
}) {
  const copy = HILOS_UI[locale];
  const raizRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detrasRef = useRef<HTMLElement>(null);
  const nombreRef = useRef<HTMLDivElement>(null);
  const volverRef = useRef<HTMLButtonElement>(null);
  const cintasRef = useRef<Cinta[]>([]);
  const atrasRef = useRef<Cinta[]>([]);
  const anchoRef = useRef(0);
  const altoRef = useRef(0);
  const semillaRef = useRef(7);
  const hoverRef = useRef(-1);
  const abiertoRef = useRef(initialTema ? TEMAS.findIndex((hilo) => hilo.id === initialTema) : -1);
  const centroRef = useRef(0);
  const progresoRef = useRef(initialTema ? 1 : 0);
  const metaRef = useRef(initialTema ? 1 : 0);
  const inicioRef = useRef(0);
  const seguirRef = useRef<(() => void) | null>(null);
  const contenidoRef = useRef<HTMLDivElement>(null);
  const [temaId, setTemaId] = useState<string | null>(initialTema);
  const [preguntaId, setPreguntaId] = useState<string | null>(null);
  const [abiertaId, setAbiertaId] = useState<string | null>(() =>
    preguntaInicial(initialTema, initialPregunta)
  );
  const [formato, setFormato] = useState<Formato | null>(null);
  const [marcada, setMarcada] = useState(initialTema ? TEMAS.findIndex((hilo) => hilo.id === initialTema) : -1);

  function publicar(id: string | null) {
    if (!enPagina) return;
    const url = id ? `/preguntas?p=${encodeURIComponent(id)}` : '/preguntas';
    window.history.replaceState(null, '', url);
  }

  function abrir(indice: number, x?: number) {
    const hilo = TEMAS[indice];
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
      aplicarPanel(detras, indice);
      detras.style.visibility = 'visible';
      detras.scrollTop = 0;
    }
    setTemaId(hilo.id);
    setPreguntaId(null);
    setFormato(null);
    setAbiertaId(null);
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
    return Math.max(640, Math.min(960, window.innerHeight * 0.9));
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
    const destino = abierta ? altoContenido() : altoCortina();
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
    }
    window.addEventListener('keydown', alTeclado);
    return () => window.removeEventListener('keydown', alTeclado);
  }, []);

  useLayoutEffect(() => {
    const stageNode = stageRef.current;
    const canvasNode = canvasRef.current;
    const detrasNode = detrasRef.current;
    if (!stageNode || !canvasNode || !detrasNode) return;
    const ctxNode = canvasNode.getContext('2d');
    if (!ctxNode) return;
    const stage = stageNode;
    const canvas = canvasNode;
    const detras = detrasNode;
    const ctx = ctxNode;
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
      const alto = Math.max(640, Math.min(960, window.innerHeight * 0.9));
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
          L: alto * (0.92 + azar() * 0.08),
          curve: (azar() - 0.5) * 50,
          A: 3 + azar() * 6,
          f: 0.6 + azar() * 0.7,
          ph: azar() * 6.28,
        });
        // Con aire entre cintas para que se vea la capa de atrás.
        x += w * (1.05 + azar() * 0.5);
      }
      // «Me pregunto…»: pocas cintas multicolor, repartidas a lo ancho y un poco más anchas.
      const puntos = ancho < 640 ? [0.25, 0.75] : [0.17, 0.5, 0.83];
      for (const punto of puntos) {
        const meta = ancho * punto;
        let mejor = 0;
        cintas.forEach((cinta, i) => {
          if (Math.abs(cinta.x - meta) < Math.abs(cintas[mejor].x - meta)) mejor = i;
        });
        if (cintas[mejor]) {
          cintas[mejor].th = ME_INDICE;
          cintas[mejor].w = base * 2.8;
        }
      }
      cintasRef.current = cintas;
      semillaRef.current = 31;
      const atras: Cinta[] = [];
      let xa = -6;
      while (xa < ancho + 10) {
        const w = base * 0.75 * (0.8 + azar() * 0.9);
        atras.push({
          x: xa + w / 2,
          w,
          th: Math.floor(azar() * 12),
          L: alto * (0.92 + azar() * 0.08),
          curve: (azar() - 0.5) * 60,
          A: (3 + azar() * 6) * 1.4,
          f: (0.6 + azar() * 0.7) * 0.6,
          ph: azar() * 6.28,
        });
        xa += w * (0.62 + azar() * 0.25);
      }
      atrasRef.current = atras;
      if (centroRef.current === 0) centroRef.current = ancho / 2;
    }

    function xEn(cinta: Cinta, y: number, tiempo: number, quieto: boolean) {
      const avance = Math.pow(y / cinta.L, 1.6);
      let desplazamiento = cinta.curve * avance;
      if (!quieto) {
        desplazamiento += cinta.A * VIENTO * Math.sin(tiempo * cinta.f + cinta.ph) * avance;
        const rafaga = ((tiempo * 0.18) % 1.6) * (anchoRef.current + 600) - 300;
        const distancia = (cinta.x - rafaga) / 160;
        desplazamiento += 22 * Math.exp(-(distancia * distancia)) * avance;
      }
      const lado = cinta.x < centroRef.current ? -1 : 1;
      const avanceApertura = progresoRef.current * progresoRef.current;
      const salida = anchoRef.current + cinta.w + Math.abs(cinta.curve) + cinta.A * VIENTO + 22;
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

    const alfas = TEMAS.map(() => 1);
    let esperaTema = 0;
    let temaPendiente = -1;
    let punteroX = 0;
    let punteroY = 0;

    function mostrarNombre(tema: number) {
      const nombre = nombreRef.current;
      const hilo = TEMAS[tema];
      if (!nombre) return;
      if (tema >= 0 && hilo) {
        nombre.hidden = false;
        nombre.textContent = hilo.nombre[locale];
        nombre.style.left = `${punteroX}px`;
        nombre.style.top = `${punteroY}px`;
      } else {
        nombre.hidden = true;
      }
    }

    function comprometer(tema: number) {
      hoverRef.current = tema;
      setMarcada(tema);
      mostrarNombre(tema);
    }

    function pedirTema(tema: number) {
      if (tema === hoverRef.current) {
        window.clearTimeout(esperaTema);
        temaPendiente = tema;
        return;
      }
      if (tema === temaPendiente) return;
      temaPendiente = tema;
      window.clearTimeout(esperaTema);
      esperaTema = window.setTimeout(() => {
        if (metaRef.current > 0 || temaPendiente !== tema) return;
        comprometer(tema);
      }, ESPERA_TEMA_MS);
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
        setAbiertaId(null);
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
      const atenuar = !quieto && hover >= 0 && progreso < 0.05;
      const avanceAlfa = quieto ? 1 : 1 - Math.exp(-paso / ATENUAR_MS);
      for (let tema = 0; tema < alfas.length; tema += 1) {
        const meta = atenuar && tema !== hover ? ATENUAR : 1;
        if (quieto) {
          alfas[tema] = 1;
          continue;
        }
        const siguiente = alfas[tema] + (meta - alfas[tema]) * avanceAlfa;
        alfas[tema] = Math.abs(meta - siguiente) <= 0.004 ? meta : siguiente;
      }
      const dibujar = (cinta: Cinta, color: string) => {
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
        ctx.fillStyle = color;
        ctx.fill();
      };
      // Capa de atrás: más oscura, más angosta y más lenta.
      for (const cinta of atrasRef.current) {
        ctx.globalAlpha = alfas[cinta.th] ?? 1;
        dibujar(cinta, VIVO_ATRAS[cinta.th] ?? '#666');
      }
      // Las cintas multicolor de «Me pregunto…» van encima, para que se vean completas.
      const orden = cintasRef.current.filter((c) => c.th !== ME_INDICE).concat(cintasRef.current.filter((c) => c.th === ME_INDICE));
      for (const cinta of orden) {
        const tela = TELON[cinta.th];
        if (!tela) continue;
        ctx.globalAlpha = alfas[cinta.th] ?? 1;
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
        ctx.fillStyle = VIVO[cinta.th] ?? tela.fondo;
        ctx.fill();
        if (cinta.th === ME_INDICE) {
          // Rayas verticales con los colores de los temas, a lo largo de la cinta.
          const rayas = MULTI.length;
          const ancho = cinta.w / rayas;
          for (let k = 0; k < rayas; k += 1) {
            const izquierda = -cinta.w / 2 + k * ancho;
            ctx.beginPath();
            for (let i = 0; i <= pasos; i += 1) {
              const y = (cinta.L * i) / pasos;
              ctx.lineTo(xEn(cinta, y, tiempo, quieto) + izquierda, y);
            }
            for (let i = pasos; i >= 0; i -= 1) {
              const y = (cinta.L * i) / pasos;
              ctx.lineTo(xEn(cinta, y, tiempo, quieto) + izquierda + ancho + 0.5, y);
            }
            ctx.closePath();
            ctx.fillStyle = MULTI[k];
            ctx.fill();
          }
        }
        ctx.strokeStyle = 'rgba(0,0,0,.07)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const fundido = 140;
      const alto = altoRef.current;
      if (alto > fundido) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        const degrade = ctx.createLinearGradient(0, alto - fundido, 0, alto);
        degrade.addColorStop(0, 'rgba(0,0,0,0)');
        degrade.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = degrade;
        ctx.fillRect(0, alto - fundido, anchoRef.current, fundido);
        // Arriba las cintas nacen del fondo, sin corte recto.
        const nace = ctx.createLinearGradient(0, 0, 0, 40);
        nace.addColorStop(0, 'rgba(0,0,0,1)');
        nace.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = nace;
        ctx.fillRect(0, 0, anchoRef.current, 40);
        ctx.restore();
      }
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
      aplicarPanel(detras, abiertoRef.current);
      detras.style.visibility = 'visible';
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
      punteroX = mx;
      punteroY = my;
      pedirTema(tema);
      const nombre = nombreRef.current;
      if (nombre && !nombre.hidden) {
        nombre.style.left = `${mx}px`;
        nombre.style.top = `${my}px`;
      }
    }

    function salir() {
      window.clearTimeout(esperaTema);
      temaPendiente = -1;
      comprometer(-1);
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
      window.clearTimeout(esperaTema);
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

  const hilo = TEMAS.find((item) => item.id === temaId) ?? null;
  const esMe = temaId === ME_PREGUNTO_ID;
  const preguntas = preguntasDelTema(temaId);
  const preguntaAbierta = preguntas.find((item) => item.id === abiertaId) ?? null;
  const formulario =
    formato && preguntaAbierta
      ? (preguntaParaFormulario(preguntaAbierta.id) as PreguntaSemana | null)
      : null;

  function verTema(indice: number) {
    abrir(indice, anchoRef.current / 2);
  }

  function alternarPregunta(id: string) {
    setFormato(null);
    setPreguntaId(null);
    setAbiertaId((actual) => (actual === id ? null : id));
    if (temaId) publicar(temaId);
  }

  function elegirFormato(kind: Formato) {
    if (!preguntaAbierta) return;
    setFormato(kind);
    setPreguntaId(preguntaAbierta.id);
    publicar(preguntaAbierta.id);
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
  }, [temaId, preguntaId, abiertaId, locale]);

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
    <div className={capitulo ? 'cortina cortina-en-capitulo font-interna' : 'cortina font-interna'} ref={raizRef}>
      {capitulo ? null : (
        <>
          <p className="cortina-ceja">{copy.ceja}</p>
          {titulo === 'h1' ? (
            <h1 className="cortina-titulo">{copy.bloqueTitulo}</h1>
          ) : (
            <h2 className="cortina-titulo">{copy.bloqueTitulo}</h2>
          )}
          <p className="cortina-sub">{copy.descubre}</p>
        </>
      )}
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
                  ['--cortina-fondo' as string]: PANEL[TEMAS.findIndex((item) => item.id === temaId)]?.fondo,
                  ['--cortina-texto' as string]: PANEL[TEMAS.findIndex((item) => item.id === temaId)]?.texto,
                  ['--cortina-boton' as string]: PANEL[TEMAS.findIndex((item) => item.id === temaId)]?.boton,
                  ['--cortina-check' as string]: marcaCasilla(
                    PANEL[TEMAS.findIndex((item) => item.id === temaId)]?.texto ?? '#fff'
                  ),
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
            {esMe ? (
              <MePreguntoPanel
                key={`me-${locale}`}
                locale={locale}
                initialPregunta={initialPregunta && initialTema === ME_PREGUNTO_ID ? initialPregunta : null}
                onClose={cerrar}
              />
            ) : null}
            {esMe ? null : <p className="cortina-indice-ayuda">{copy.indice}</p>}
            <ul className="cortina-indice" hidden={esMe}>
              {preguntas.map((pregunta) => {
                const abierta = pregunta.id === abiertaId;
                return (
                  <li key={pregunta.id}>
                    <button
                      type="button"
                      className="cortina-indice-pregunta"
                      aria-expanded={abierta}
                      onClick={() => alternarPregunta(pregunta.id)}
                    >
                      {pregunta.texto[locale]}
                    </button>
                    {abierta ? (
                      <div className="cortina-indice-respuesta">
                        {formulario ? (
                          <PreguntaFormForQuestion
                            pregunta={formulario}
                            formato={formato ?? 'texto'}
                            onAnother={cerrar}
                          />
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
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
        <canvas ref={canvasRef} className="cortina-lienzo" aria-hidden />
        <div ref={nombreRef} className="cortina-nombre" hidden />
      </div>
      {temaId || capitulo ? null : <p className="cortina-pista">{copy.pista}</p>}
      <div className={capitulo ? 'cortina-leyenda cortina-leyenda-teclado' : 'cortina-leyenda'}>
        {TEMAS.map((hiloTema, indice) => (
          <button
            key={hiloTema.id}
            type="button"
            className={marcada === indice ? 'cortina-etiqueta esta' : 'cortina-etiqueta'}
            style={{ ['--cortina-fondo' as string]: indice === ME_INDICE ? 'conic-gradient(#FFD000, #FF6200, #FF1A1A, #FF7EB6, #A8E000, #00B140, #00C2D6, #0047FF, #7A12E0, #B07CFF, #FF0A8A, #A0003C, #FFD000)' : TELON[indice]?.fondo }}
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
      {capitulo ? null : (
        <button
          type="button"
          className="cortina-azar"
          onClick={() => verTema(aleatorio())}
        >
          {copy.azar}
        </button>
      )}
    </div>
  );
}
