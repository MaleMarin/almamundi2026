import { ImageResponse } from 'next/og';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import { resonanceStripeUnits } from '@/lib/huella/resonance-stripes';
import { formatPublicName, formatPublicPlace } from '@/lib/historias/story-ubicacion';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;
const IMG_W = 640;

function photoOf(story: Awaited<ReturnType<typeof getStoryByIdAsync>>): string {
  if (!story) return '';
  const url = story.imagenes?.find((i) => i.url)?.url || story.thumbnailUrl || story.imageUrl || '';
  return /^https:\/\//.test(url) ? url : '';
}

/**
 * Tarjeta para WhatsApp y redes de una historia: a la izquierda su imagen (o su imagen de cintas),
 * a la derecha AlmaMundi, título, autor y lugar.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStoryByIdAsync(id).catch(() => null);
  const title = (story?.title || story?.label || 'Una historia').trim();
  const alias = story ? formatPublicName(story.authorName || story.author?.name) : '';
  const place = story ? formatPublicPlace(story.city, story.country, 'es') : '';
  const photo = photoOf(story);
  const units = photo
    ? []
    : resonanceStripeUnits({ storyId: id, text: story?.body || story?.excerpt || title, locale: 'es' });

  const stripes: { hex: string; width: number }[] = [];
  let x = 0;
  for (let guard = 0; x < IMG_W && units.length > 0 && guard < 400; guard++) {
    for (const u of units) {
      const w = Math.min(Math.max(1, Math.round(u.width * 1.4)), IMG_W - x);
      if (w <= 0) break;
      stripes.push({ hex: u.hex, width: w });
      x += w;
      if (x >= IMG_W) break;
    }
  }

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', background: '#F5F4F2', fontFamily: 'sans-serif' }}>
        <div style={{ width: IMG_W, height: H, display: 'flex', overflow: 'hidden', background: '#F7F4EE' }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={IMG_W} height={H} style={{ objectFit: 'cover', width: IMG_W, height: H }} alt="" />
          ) : (
            stripes.map((s, i) => <div key={i} style={{ width: s.width, height: H, background: s.hex }} />)
          )}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 56px 48px',
          }}
        >
          <div style={{ fontSize: 26, letterSpacing: 8, fontWeight: 700, color: '#FF4A1C' }}>ALMAMUNDI</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 58, lineHeight: 1.1, color: '#3C4655', fontWeight: 600 }}>
              {title.length > 60 ? `${title.slice(0, 58)}…` : title}
            </div>
            <div style={{ marginTop: 20, fontSize: 28, color: '#616C7C' }}>
              {[alias ? `Por ${alias}` : '', place].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div style={{ fontSize: 24, color: '#616C7C' }}>Historias de vida de todo el mundo · almamundi.org</div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } }
  );
}
