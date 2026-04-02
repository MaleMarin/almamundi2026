'use client';

import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  drawHuellaV2OnCanvas,
  getHuellaV2DrawStats,
  type HuellaV2Format,
  type HuellaV2Meta,
} from '@/lib/huella/huellaV2';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600'],
});

const DEFAULT_TEXT =
  'La tarde en que llegamos al pueblo, mi abuela tenía las manos llenas de harina. Nunca olvidé ese olor a pan recién hecho mezclado con el aire del campo.';

const EXAMPLES: { t: string; id: string; h: number }[] = [
  { t: 'cumpleanos_abuela_Mar_del_Plata_2019.jpg', id: 'AM-FOTO01', h: 15 },
  { t: 'viaje_patagonia_torres_del_paine_invierno.jpg', id: 'AM-FOTO02', h: 7 },
  {
    t: 'La tarde en que llegamos al pueblo mi abuela tenía las manos llenas de harina. Nunca olvidé ese olor a pan recién hecho mezclado con el aire del campo y las voces de los vecinos.',
    id: 'AM-TX001',
    h: 14,
  },
  {
    t: 'Estudié medicina para ayudar a las personas pero terminé entendiendo que la enfermedad más difícil de curar es la soledad. Cada paciente me enseñó algo que ningún libro menciona.',
    id: 'AM-TX002',
    h: 21,
  },
  {
    t: 'Cuando el barco salió del puerto supe que no iba a volver en mucho tiempo. El mar tiene esa cosa extraña de hacerte sentir libre y perdido al mismo tiempo.',
    id: 'AM-TX003',
    h: 3,
  },
  { t: 'retrato_familia_verano_playa_concepcion_chile.jpg', id: 'AM-FOTO03', h: 11 },
  {
    t: 'Mi ciudad cambió tanto que ya no reconozco las calles donde crecí. Los edificios nuevos tapan el sol de la mañana y donde había una plaza ahora hay estacionamiento.',
    id: 'AM-TX004',
    h: 18,
  },
  { t: 'primer_dia_escuela_santiago_1987_uniforme.jpg', id: 'AM-FOTO04', h: 8 },
];

function detectFormat(text: string): HuellaV2Format {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(text.trim()) ? 'foto' : 'texto';
}

function metaFromForm(texto: string, storyId: string, submitHour: number): HuellaV2Meta {
  const format = detectFormat(texto);
  return {
    storyId: storyId.trim() || 'AM-DEMO',
    content: texto,
    format,
    charCount: texto.length,
    submitHour,
    embedSiteFooter: true,
    footerAt: new Date(),
  };
}

function GalleryCard({ t, id, h }: { t: string; id: string; h: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const esFoto = id.includes('FOTO');

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    drawHuellaV2OnCanvas(ctx, {
      storyId: id,
      content: t,
      format: esFoto ? 'foto' : 'texto',
      charCount: t.length * 8,
      submitHour: h,
    });
  }, [t, id, h, esFoto]);

  const preview = t.length > 40 ? `${t.slice(0, 40)}…` : t;

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#D4D4C4] bg-white">
      <canvas ref={ref} width={200} height={250} className="block w-full" />
      <div className="px-2.5 py-2">
        <div className="mb-0.5 text-[9px] font-semibold tracking-wide text-[#E8400A]">{id}</div>
        <div className="text-[10px] leading-snug text-[#8A8A7A]">
          {esFoto ? 'Foto' : 'Texto'} · hora {h}h
          <br />
          <em>{preview}</em>
        </div>
      </div>
    </div>
  );
}

export default function DemoHuellasV2Page() {
  const [texto, setTexto] = useState(DEFAULT_TEXT);
  const [storyId, setStoryId] = useState('AM-MN4OPFKT');
  const [submitHour, setSubmitHour] = useState(14);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paleta, setPaleta] = useState<string[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getHuellaV2DrawStats> | null>(null);

  const generar = useCallback(() => {
    const meta = metaFromForm(texto, storyId, submitHour);
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = 400;
    cv.height = 500;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const p = drawHuellaV2OnCanvas(ctx, meta);
    setPaleta(p);
    setStats(getHuellaV2DrawStats(meta));
  }, [texto, storyId, submitHour]);

  useEffect(() => {
    generar();
  }, [generar]);

  const textoAleatorio = () => {
    const pick = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]!;
    setTexto(pick.t);
    setStoryId(pick.id);
    setSubmitHour(pick.h);
  };

  const nombreFoto = () => {
    const fotos = EXAMPLES.filter((x) => x.id.includes('FOTO'));
    const pick = fotos[Math.floor(Math.random() * fotos.length)]!;
    setTexto(pick.t);
    setStoryId(pick.id);
  };

  return (
    <div className={`min-h-screen bg-[#F0EFE9] px-6 py-8 pb-16 text-[#141D26] ${jakarta.className}`}>
      <div className="mx-auto max-w-[960px]">
        <h1 className={`mb-1 text-[2rem] font-semibold leading-tight ${fraunces.className}`}>
          Sistema de Huellas v2 · AlmaMundi
        </h1>
        <p className="mb-10 max-w-3xl text-sm leading-relaxed text-[#8A8A7A]">
          Los colores nacen de las palabras de la historia — no del formato.
          <br />
          Más líneas, más densidad, más color. Cada huella es irrepetible. Implementación en{' '}
          <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">lib/huella/huellaV2.ts</code>
          .
        </p>

        <section className="mb-10">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8400A]">
            01 · Cómo las palabras generan colores
          </div>
          <p className="mb-2 text-[1.05rem] font-semibold">Cada palabra tiene un color propio. La historia compone la paleta.</p>
          <p className="mb-4 max-w-3xl text-[0.83rem] leading-relaxed text-[#8A8A7A]">
            Se extraen hasta 14 palabras significativas del contenido (o del nombre del archivo en el caso de fotos). Cada palabra
            genera un color HSL a partir de su valor numérico: suma de caracteres → matiz; vocales → saturación; consonantes →
            luminosidad. El resultado es una paleta de hasta 14 colores irrepetible para esa historia. La tabla describe el export
            SVG (<code className="font-mono text-[11px]">generateHuella</code> / <code className="font-mono text-[11px]">generateHuellaSvg</code>
            ); la vista previa de abajo usa canvas con más líneas y trazos Bézier.
          </p>
          <div className="mb-4 overflow-x-auto rounded-xl border border-[#D4D4C4] bg-white">
            <table className="w-full min-w-[520px] border-collapse text-[0.82rem]">
              <thead>
                <tr>
                  <th className="bg-[#9a3412] px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-white">
                    Propiedad visual
                  </th>
                  <th className="bg-[#9a3412] px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-white">
                    Fuente
                  </th>
                  <th className="bg-[#9a3412] px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-white">
                    Cálculo
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-b-0">
                <DocRow
                  prop="Matiz (hue 0–360°)"
                  fuente="Suma de códigos de caracteres de la palabra"
                  calc={<code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">charSum % 360</code>}
                />
                <DocRow
                  prop="Saturación (60–100%)"
                  fuente="Número de vocales en la palabra"
                  calc={<code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">60 + (vocales / largo) × 40</code>}
                />
                <DocRow
                  prop="Luminosidad (30–65%)"
                  fuente="Número de consonantes"
                  calc={<code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">30 + (consonantes / largo) × 35</code>}
                />
                <DocRow
                  prop="Número de líneas"
                  fuente="Longitud total del contenido"
                  calc={
                    <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">
                      80 + (charCount / 4500) × 120 (80–200 líneas, SVG)
                    </code>
                  }
                />
                <DocRow
                  prop="Ángulo de cada línea"
                  fuente="Semilla del storyId + índice"
                  calc={<code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">anguloBase ± variación aleatoria seeded</code>}
                />
                <DocRow
                  prop="Ancho de línea"
                  fuente="Posición de la palabra en el texto"
                  calc={<code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">1.5 – 18px según importancia</code>}
                />
                <DocRow
                  prop="Opacidad"
                  fuente="Frecuencia de la palabra"
                  calc={<code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">0.35 – 1.0</code>}
                />
              </tbody>
            </table>
          </div>
          <p className="max-w-3xl text-[0.8rem] leading-relaxed text-[#8A8A7A]">
            Canvas (esta página y el modal de confirmación):{' '}
            <code className="font-mono text-[11px]">⌊150 + (charCount / 4500) × 150⌋</code> líneas, ángulo base{' '}
            <code className="font-mono text-[11px]">((hora/23) − 0.5) × 22</code>, pasadas gruesas/medias/finas y acentos anchos; con{' '}
            <code className="font-mono text-[11px]">embedSiteFooter</code> se dibuja la franja con URL y fecha.
          </p>
        </section>

        <section className="mb-10">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8400A]">
            02 · Fotos: el nombre del archivo como texto
          </div>
          <p className="mb-2 text-[1.05rem] font-semibold">Para imágenes, las palabras vienen del nombre del archivo</p>
          <p className="mb-1 max-w-3xl text-[0.83rem] leading-relaxed text-[#8A8A7A]">
            Si el archivo se llama{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">cumpleanos_abuela_Mar_del_Plata_2019.jpg</code>
            , las palabras son <strong className="font-medium text-[#141D26]">cumpleanos, abuela, Mar, del, Plata, 2019</strong> — y las
            que pasan el filtro (más de tres letras y no stop-word) entran en la paleta. Si el nombre es genérico como{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">IMG_4521.jpg</code>, se usa el{' '}
            <code className="font-mono text-[11px]">storyId</code> como texto base. Siempre se limpia el nombre: se eliminan extensiones,
            guiones y tokens genéricos (IMG, DSC, DCIM, números largos).
          </p>
        </section>

        <section className="mb-10">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8400A]">
            03 · Generador interactivo
          </div>

          <div className="mb-4 rounded-xl border border-[#D4D4C4] bg-white p-5">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8A8A7A]">
              Texto de la historia (o nombre de archivo para fotos)
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={5}
              className="mb-3 w-full resize-y rounded-lg border border-[#D4D4C4] bg-[#F0EFE9] px-2.5 py-2 text-sm text-[#141D26] outline-none focus:border-[#9a3412]"
            />
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8A8A7A]">
                  Story ID
                </label>
                <input
                  value={storyId}
                  onChange={(e) => setStoryId(e.target.value)}
                  className="w-full rounded-lg border border-[#D4D4C4] bg-[#F0EFE9] px-2.5 py-2 text-sm outline-none focus:border-[#9a3412]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8A8A7A]">
                  Hora de envío
                </label>
                <select
                  value={submitHour}
                  onChange={(e) => setSubmitHour(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#D4D4C4] bg-[#F0EFE9] px-2.5 py-2 text-sm outline-none focus:border-[#9a3412]"
                >
                  <option value={3}>Madrugada (3am)</option>
                  <option value={9}>Mañana (9am)</option>
                  <option value={14}>Tarde (2pm)</option>
                  <option value={22}>Noche (10pm)</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generar}
                className="rounded-lg bg-[#E8400A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c73308]"
              >
                Generar huella →
              </button>
              <button
                type="button"
                onClick={textoAleatorio}
                className="rounded-lg border-[1.5px] border-[#D4D4C4] px-4 py-2 text-sm font-medium text-[#9a3412] hover:border-[#9a3412]"
              >
                Texto aleatorio
              </button>
              <button
                type="button"
                onClick={nombreFoto}
                className="rounded-lg border-[1.5px] border-[#D4D4C4] px-4 py-2 text-sm font-medium text-[#9a3412] hover:border-[#9a3412]"
              >
                Simular nombre de foto
              </button>
            </div>
          </div>

          {paleta.length > 0 ? (
            <div className="mb-3">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A8A7A]">
                Paleta generada
              </div>
              <div className="flex flex-wrap gap-1.5">
                {paleta.map((c, idx) => (
                  <div
                    key={`${idx}-${c}`}
                    title={c}
                    className="h-7 w-7 rounded-md border border-black/10"
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-[#D4D4C4] bg-white">
              <canvas ref={canvasRef} width={400} height={500} className="block w-full max-w-full" />
            </div>
            <div className="rounded-xl border border-[#D4D4C4] bg-white p-4 text-[0.8rem]">
              {stats ? (
                <>
                  <InfoRow k="Story ID" v={stats.storyId} />
                  <InfoRow k="Palabras clave" v={stats.palabrasPreview} />
                  <InfoRow k="Colores generados" v={`${stats.numColores} colores únicos`} />
                  <InfoRow
                    k="Número de líneas"
                    v={`${stats.numLineas} (canvas) · ${stats.numLineasSvg} (SVG)`}
                  />
                  <InfoRow
                    k="Ángulo base"
                    v={`${stats.anguloBase.toFixed(1)}° (canvas) · ${stats.anguloBaseSvg.toFixed(1)}° (SVG)`}
                  />
                  <InfoRow k="Semilla" v={String(stats.seed)} />
                </>
              ) : (
                <p className="text-[#8A8A7A]">Generá una huella para ver los datos.</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8400A]">
            04 · Ejemplos — historias reales generan huellas diferentes
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
            {EXAMPLES.map((m) => (
              <GalleryCard key={m.id} {...m} />
            ))}
          </div>
        </section>

        <section className="mt-12 border-t border-[#D4D4C4] pt-10">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8400A]">
            05 · Código para Cursor —{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px] text-[#141D26]">lib/huella/huellaV2.ts</code>
          </div>
          <p className="max-w-3xl text-[0.83rem] leading-relaxed text-[#8A8A7A]">
            Equivalente TypeScript al snippet <code className="font-mono text-[11px]">utils/huella.js</code> de la spec:{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">drawHuellaV2OnCanvas</code>,{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">generateHuellaSvg</code>, alias{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">generateHuella</code>,{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">buildPaletteFromMeta</code>,{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">extraerPalabras</code>,{' '}
            <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">limpiarNombreFoto</code>, etc.
          </p>
        </section>
      </div>
    </div>
  );
}

function DocRow({ prop, fuente, calc }: { prop: string; fuente: string; calc: ReactNode }) {
  return (
    <tr className="even:bg-white odd:bg-[#F0EFE9]/60">
      <td className="border-b border-[#D4D4C4] px-3 py-2 align-top leading-snug">{prop}</td>
      <td className="border-b border-[#D4D4C4] px-3 py-2 align-top leading-snug">{fuente}</td>
      <td className="border-b border-[#D4D4C4] px-3 py-2 align-top leading-snug">{calc}</td>
    </tr>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-[#F0EFE9] py-1.5 last:border-b-0">
      <span className="shrink-0 text-[#8A8A7A]">{k}</span>
      <span className="max-w-[60%] text-right font-medium">{v}</span>
    </div>
  );
}
