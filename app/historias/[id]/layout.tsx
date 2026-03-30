import type { Metadata } from 'next';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';

const defaultBase =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:3005');

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const story = await getStoryByIdAsync(id);
  if (!story) {
    return {
      title: 'Historia · AlmaMundi',
      metadataBase: new URL(defaultBase),
    };
  }
  const titulo = story.title ?? story.label ?? 'Historia';
  const autor = story.authorName ?? story.author?.name ?? '';
  const desc = story.quote ?? story.excerpt ?? story.subtitle ?? story.description ?? '';
  const body = (story.body ?? '').trim();
  const description =
    (desc && String(desc).slice(0, 160)) ||
    (body ? body.slice(0, 160) : `${titulo} — ${autor}`.slice(0, 160));
  const ogImage = story.imageUrl ?? story.thumbnailUrl;
  const ogImages =
    ogImage && /^https?:\/\//i.test(ogImage) ? [{ url: ogImage, alt: titulo }] : undefined;

  return {
    metadataBase: new URL(defaultBase),
    title: `${titulo} · AlmaMundi`,
    description,
    openGraph: {
      title: `${titulo} · ${autor}`,
      description: description || undefined,
      type: 'article',
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? 'summary_large_image' : 'summary',
      title: `${titulo} · ${autor}`,
      description: description || undefined,
      ...(ogImages ? { images: [ogImages[0].url] } : {}),
    },
  };
}

export default function HistoriasIdLayout({ children }: Props) {
  return children;
}
