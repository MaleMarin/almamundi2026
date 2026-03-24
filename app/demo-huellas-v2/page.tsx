'use client';

import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { useCallback, useEffect, useRef, useState } from 'react';
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
          Más líneas, más densidad, más color. Cada huella es irrepetible. Código en{' '}
          <code className="rounded bg-[#E8E8D8] px-1.5 py-0.5 font-mono text-[11px]">lib/huella/huellaV2.ts</code>
          .
        </p>

        <section className="mb-10">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8400A]">
            01 · Cómo las palabras generan colores
          </div>
          <p className="mb-2 text-[1.05rem] font-semibold">Cada palabra tiene un color propio. La historia compone la paleta.</p>
          <p className="mb-4 max-w-3xl text-[0.83rem] leading-relaxed text-[#8A8A7A]">
            Se extraen palabras significativas del contenido (o del nombre del archivo en fotos). Cada palabra genera un color HSL:
            la suma de caracteres define el matiz, las vocales la saturación, las consonantes la luminosidad. El canvas superpone
            trazos curvos con semilla fija por <code className="font-mono text-[11px]">storyId</code>.
          </p>
        </section>

        <section className="mb-10">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8400A]">
            02 · Generador interactivo
          </div>

          <div className="mb-4 rounded-xl border border-[#D4D4C4] bg-white p-5">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8A8A7A]">
              Texto de la historia (o nombre de archivo para fotos)
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={5}
              className="mb-3 w-full resize-y rounded-lg border border-[#D4D4C4] bg-[#F0EFE9] px-2.5 py-2 text-sm text-[#141D26] outline-none focus:border-[#243447]"
            />
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8A8A7A]">
                  Story ID
                </label>
                <input
                  value={storyId}
                  onChange={(e) => setStoryId(e.target.value)}
                  className="w-full rounded-lg border border-[#D4D4C4] bg-[#F0EFE9] px-2.5 py-2 text-sm outline-none focus:border-[#243447]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8A8A7A]">
                  Hora de envío
                </label>
                <select
                  value={submitHour}
                  onChange={(e) => setSubmitHour(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#D4D4C4] bg-[#F0EFE9] px-2.5 py-2 text-sm outline-none focus:border-[#243447]"
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
                className="rounded-lg border-[1.5px] border-[#D4D4C4] px-4 py-2 text-sm font-medium text-[#243447] hover:border-[#243447]"
              >
                Texto aleatorio
              </button>
              <button
                type="button"
                onClick={nombreFoto}
                className="rounded-lg border-[1.5px] border-[#D4D4C4] px-4 py-2 text-sm font-medium text-[#243447] hover:border-[#243447]"
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
                  <InfoRow k="Número de líneas" v={`${stats.numLineas}`} />
                  <InfoRow k="Ángulo base" v={`${stats.anguloBase.toFixed(1)}°`} />
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
            03 · Galería de ejemplos
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
            {EXAMPLES.map((m) => (
              <GalleryCard key={m.id} {...m} />
            ))}
          </div>
        </section>
      </div>
    </div>
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
