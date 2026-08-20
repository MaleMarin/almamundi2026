import { lookupLemma } from '@/lib/huella/almamundi-lexicon';
import { hslCss, storyCenterHue, vadToHsl } from '@/lib/huella/vad-color';

type Row = { lemma: string; label: string };

const GROUPS: Array<{ id: string; title: string; hint: string; words: Row[] }> = [
  {
    id: 'emociones',
    title: 'Emociones',
    hint: 'La valencia baja empuja el tono hacia violetas y magentas. La alta, hacia amarillos y verdes. La activación sube la claridad.',
    words: [
      { lemma: 'alegria', label: 'alegría' },
      { lemma: 'amor', label: 'amor' },
      { lemma: 'esperanza', label: 'esperanza' },
      { lemma: 'calma', label: 'calma' },
      { lemma: 'paz', label: 'paz' },
      { lemma: 'miedo', label: 'miedo' },
      { lemma: 'panico', label: 'pánico' },
      { lemma: 'triste', label: 'triste' },
      { lemma: 'pena', label: 'pena' },
      { lemma: 'dolor', label: 'dolor' },
      { lemma: 'verguenza', label: 'vergüenza' },
      { lemma: 'odio', label: 'odio' },
      { lemma: 'ira', label: 'ira' },
    ],
  },
  {
    id: 'familia',
    title: 'Familia',
    hint: 'Parentesco cercano comparte un ocre cálido (valencia alta, activación media). Bebé sube un poco más y se vuelve verde claro.',
    words: [
      { lemma: 'madre', label: 'madre' },
      { lemma: 'padre', label: 'padre' },
      { lemma: 'abuela', label: 'abuela' },
      { lemma: 'abuelo', label: 'abuelo' },
      { lemma: 'hijo', label: 'hijo' },
      { lemma: 'hermana', label: 'hermana' },
      { lemma: 'nieto', label: 'nieto' },
      { lemma: 'nona', label: 'nona' },
      { lemma: 'nana', label: 'nana' },
      { lemma: 'pololo', label: 'pololo' },
      { lemma: 'guagua', label: 'guagua' },
      { lemma: 'bebe', label: 'bebé' },
    ],
  },
  {
    id: 'lugares',
    title: 'Lugares',
    hint: 'Casa, patio, mercado quedan en tierras rojizas. Pueblo, barrio, ciudad bajan un poco y viran a rosa oscuro. Cementerio es el extremo.',
    words: [
      { lemma: 'casa', label: 'casa' },
      { lemma: 'hogar', label: 'hogar' },
      { lemma: 'patio', label: 'patio' },
      { lemma: 'mercado', label: 'mercado' },
      { lemma: 'plaza', label: 'plaza' },
      { lemma: 'iglesia', label: 'iglesia' },
      { lemma: 'escuela', label: 'escuela' },
      { lemma: 'calle', label: 'calle' },
      { lemma: 'pueblo', label: 'pueblo' },
      { lemma: 'barrio', label: 'barrio' },
      { lemma: 'ciudad', label: 'ciudad' },
      { lemma: 'frontera', label: 'frontera' },
      { lemma: 'cementerio', label: 'cementerio' },
    ],
  },
  {
    id: 'naturaleza',
    title: 'Naturaleza',
    hint: 'Sol y luna son ocres claros. Mar, río, tierra, bosque se agrupan en un rojo-tierra más bajo. Noche se oscurece sin llegar a negro.',
    words: [
      { lemma: 'sol', label: 'sol' },
      { lemma: 'luna', label: 'luna' },
      { lemma: 'cielo', label: 'cielo' },
      { lemma: 'mar', label: 'mar' },
      { lemma: 'rio', label: 'río' },
      { lemma: 'lluvia', label: 'lluvia' },
      { lemma: 'viento', label: 'viento' },
      { lemma: 'arbol', label: 'árbol' },
      { lemma: 'flor', label: 'flor' },
      { lemma: 'tierra', label: 'tierra' },
      { lemma: 'bosque', label: 'bosque' },
      { lemma: 'noche', label: 'noche' },
    ],
  },
];

const SAMPLE_JSON = `{
  "version": "1.0.0",
  "lang": "es",
  "dims": ["valencia", "activacion", "dominancia"],
  "e": {
    "madre": [0.76, 0.50, 0.58]
  }
}`;

function colorFor(v: number, a: number, d: number) {
  const center = storyCenterHue(0.5, 0.5);
  const hsl = vadToHsl(v, a, d, a, center);
  return { ...hsl, css: hslCss(hsl.h, hsl.s, hsl.l), mayBeBlack: v < 0.4 };
}

export default function DemoLexicoPage() {
  const rows = GROUPS.flatMap((g) =>
    g.words.map((w) => {
      const hit = lookupLemma(w.lemma, 'es');
      if (!hit) return null;
      const color = colorFor(hit.v, hit.a, hit.d);
      return { group: g.id, groupTitle: g.title, label: w.label, ...hit, ...color };
    })
  ).filter((r): r is NonNullable<typeof r> => r != null);

  return (
    <main className="min-h-screen bg-[#F7F4EE] px-5 py-10 text-[#1a1a1a] md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] tracking-[0.18em] text-[#8A8A7A] uppercase">AlmaMundi · léxico v1.0.0</p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight md:text-4xl">
          Qué color elige cada palabra
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#444]">
          El léxico no guarda colores. Guarda tres números de 0 a 1: valencia (desagradable →
          agradable), activación (calma → intensidad) y dominancia (fragilidad → control). Esta
          página pasa esos números por la misma fórmula VAD → HSL del envío,{' '}
          <strong className="font-medium">sin estirar</strong> respecto a otras palabras, para que
          se vea el color propio de cada tipo.
        </p>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#666]">
          En un relato real la valencia se normaliza dentro del texto: la palabra más negativa y la
          más positiva del relato ocupan los extremos, aunque en el léxico estén cerca. Si la más
          negativa tiene valencia menor a 0.40, esa sola franja puede pintarse negra.
        </p>

        <section className="mt-10 rounded-lg border border-black/8 bg-white p-5">
          <h2 className="text-sm font-medium tracking-wide text-[#333]">Dónde vive y cómo se ve una entrada</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#555]">
            Tres archivos compactos (una línea, 5.000 lemas cada uno):{' '}
            <code className="rounded bg-[#F7F4EE] px-1 text-[12px]">lib/huella/lexicon/es.json</code>
            {', '}
            <code className="rounded bg-[#F7F4EE] px-1 text-[12px]">pt.json</code>
            {' y '}
            <code className="rounded bg-[#F7F4EE] px-1 text-[12px]">en.json</code>. El mapa{' '}
            <code className="rounded bg-[#F7F4EE] px-1 text-[12px]">e</code> es lema → [V, A, D].
          </p>
          <pre className="mt-4 overflow-x-auto rounded-md bg-[#1e1c18] p-4 text-[12px] leading-relaxed text-[#F7F4EE]">
            {SAMPLE_JSON}
          </pre>
          <p className="mt-2 text-[12px] text-[#777]">
            Ejemplo: <em>madre</em> vale 0.76 / 0.50 / 0.58 — agradable, activación media, control
            medio-alto.
          </p>
        </section>

        {GROUPS.map((g) => (
          <section key={g.id} className="mt-12">
            <h2 className="font-serif text-2xl font-normal">{g.title}</h2>
            <p className="mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-[#666]">{g.hint}</p>
            <div className="overflow-x-auto rounded-lg border border-black/8 bg-white">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-black/8 text-[11px] tracking-wide text-[#888] uppercase">
                    <th className="px-3 py-2 font-medium">Color</th>
                    <th className="px-3 py-2 font-medium">Palabra</th>
                    <th className="px-3 py-2 font-medium">V</th>
                    <th className="px-3 py-2 font-medium">A</th>
                    <th className="px-3 py-2 font-medium">D</th>
                    <th className="px-3 py-2 font-medium">HSL</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter((r) => r.group === g.id)
                    .map((r) => (
                      <tr key={r.label} className="border-b border-black/5 last:border-0">
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-9 w-14 shrink-0 rounded-sm border border-black/10"
                              style={{ background: r.css }}
                              title={r.css}
                            />
                            {r.mayBeBlack ? (
                              <span
                                className="inline-block h-9 w-6 shrink-0 rounded-sm border border-black/20 bg-black"
                                title="En un relato, si esta es la más negativa y V < 0.40, puede ser negra"
                              />
                            ) : null}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">{r.label}</td>
                        <td className="px-3 py-2 tabular-nums">{r.v.toFixed(2)}</td>
                        <td className="px-3 py-2 tabular-nums">{r.a.toFixed(2)}</td>
                        <td className="px-3 py-2 tabular-nums">{r.d.toFixed(2)}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[#555]">{r.css}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <p className="mt-10 text-[12px] text-[#888]">
          {rows.length} palabras del léxico español. La barrita negra al lado aparece cuando V &lt;
          0.40: en el relato, solo la más negativa puede usar ese negro. Esta ruta no se indexa.
        </p>
      </div>
    </main>
  );
}
