import { ImageResponse } from 'next/og';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import { getAdminDb } from '@/lib/firebase/admin';
import { franjasValidas, resonanceStripeUnits, RESONANCE_BG } from '@/lib/huella/resonance-stripes';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';

export const runtime = 'nodejs';

const W = 1080;
const H = 1080;
// Mismas medidas que el pie de la pantalla final (drawResonancePieceFooter a 1080 px).
const PIE = 40 + 44 + 16 + 28 + 16 + 24 + 48;

type Franjas = { hex: string; width: number }[];

let fuentes: Promise<{ name: string; data: ArrayBuffer; weight: 500 | 600; style: 'normal' }[]> | null = null;

/** DM Sans, la misma letra de la imagen que la persona recibe al enviar su historia. */
function cargarFuentes() {
  if (!fuentes) {
    fuentes = (async () => {
      const css = await fetch('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600').then((r) => r.text());
      const urls = [...css.matchAll(/font-weight:\s*(\d+);[\s\S]*?src:\s*url\(([^)]+)\)/g)];
      return Promise.all(
        urls.map(async ([, peso, url]) => ({
          name: 'DM Sans',
          data: await fetch(url).then((r) => r.arrayBuffer()),
          weight: (peso === '600' ? 600 : 500) as 500 | 600,
          style: 'normal' as const,
        }))
      );
    })().catch(() => {
      fuentes = null;
      return [];
    });
  }
  return fuentes;
}

function nombreArchivo(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return base || 'mi-historia';
}

function anio(v: unknown): string {
  const d =
    v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: unknown }).toDate === 'function'
      ? (v as { toDate: () => Date }).toDate()
      : typeof v === 'string' || typeof v === 'number'
        ? new Date(v)
        : null;
  return d && !Number.isNaN(d.getTime()) ? String(d.getFullYear()) : '';
}

/** Franjas y año guardados con el envío: son los de la pantalla final. */
async function delEnvio(id: string): Promise<{ franjas: Franjas | null; anio: string }> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('stories').doc(id).get();
    const d = (doc.data() ?? {}) as Record<string, unknown>;
    let franjas = franjasValidas(d.huellaUnits);
    let fecha = anio(d.createdAt);
    const subId = typeof d.sourceSubmissionId === 'string' ? d.sourceSubmissionId : '';
    if (subId && /^[A-Za-z0-9_-]{6,60}$/.test(subId)) {
      for (const col of ['submissions', 'story_submissions']) {
        const sub = await db.collection(col).doc(subId).get();
        if (!sub.exists) continue;
        const s = (sub.data() ?? {}) as Record<string, unknown>;
        franjas = franjas ?? franjasValidas(s.huellaUnits);
        fecha = fecha || anio(s.createdAt);
        break;
      }
    }
    return { franjas, anio: fecha };
  } catch {
    return { franjas: null, anio: '' };
  }
}

/**
 * La imagen de cintas de una historia publicada, igual a la de la pantalla final:
 * franjas arriba y, abajo, título, lugar · año y almamundi.org. Va en el correo de historia publicada.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valido = /^[A-Za-z0-9_-]{6,60}$/.test(id);
  const story = valido ? await getStoryByIdAsync(id).catch(() => null) : null;
  const envio = story ? await delEnvio(id) : { franjas: null, anio: '' };
  const title = (story?.title || story?.label || '').trim();
  const units =
    franjasValidas(story?.huellaUnits) ??
    envio.franjas ??
    resonanceStripeUnits({ storyId: id, text: story?.body || story?.excerpt || title || id, locale: 'es' });
  const lugar = formatPublicPlace(story?.city, story?.country, 'es');
  const meta = [lugar, envio.anio || anio(story?.publishedAt)].filter(Boolean).join(' · ');
  const fonts = await cargarFuentes();

  const campo = H - PIE;
  const total = units.reduce((s, u) => s + u.width, 0) || 1;
  const stripes: Franjas = [];
  let acumulado = 0;
  for (const u of units) {
    const x0 = Math.round((acumulado / total) * W);
    acumulado += u.width;
    const x1 = Math.round((acumulado / total) * W);
    if (x1 > x0) stripes.push({ hex: u.hex, width: x1 - x0 });
  }
  const corto = title.length > 48 ? `${title.slice(0, 46)}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          background: RESONANCE_BG,
          fontFamily: fonts.length ? 'DM Sans' : 'sans-serif',
        }}
      >
        <div style={{ width: W, height: campo, display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          {stripes.map((s, i) => (
            <div key={i} style={{ width: s.width, height: campo, background: s.hex }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', height: PIE, padding: '40px 64px 48px', color: '#1A1916' }}>
          {corto ? <div style={{ fontSize: 44, lineHeight: 1, fontWeight: 600 }}>{corto}</div> : null}
          {meta ? <div style={{ marginTop: 16, fontSize: 28, lineHeight: 1, fontWeight: 500 }}>{meta}</div> : null}
          <div style={{ marginTop: 16, fontSize: 24, lineHeight: 1, fontWeight: 500 }}>almamundi.org</div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      ...(fonts.length ? { fonts } : {}),
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        // ?descargar=1: el botón del correo baja el archivo en vez de abrir la imagen.
        ...(new URL(req.url).searchParams.has('descargar')
          ? { 'Content-Disposition': `attachment; filename="almamundi-${nombreArchivo(title)}.png"` }
          : {}),
      },
    }
  );
}
