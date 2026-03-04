import { NextResponse } from 'next/server';

const NEWS_SOURCES = [
  'El País',
  'BBC Mundo',
  'CNN Español',
  'La Tercera',
  'El Mundo',
  'Infobae',
  'El Universal',
  'Clarín',
];

const CATEGORIES = [
  'politics',
  'technology',
  'entertainment',
  'science',
  'sports',
  'health',
  'world',
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? '';
  const query = searchParams.get('q') ?? '';

  try {
    // Intenta con NEWSDATA_API_KEY del .env
    const apiKey = process.env.NEWSDATA_API_KEY;

    if (apiKey) {
      const params = new URLSearchParams({
        apikey: apiKey,
        language: 'es',
        ...(category && category !== 'Todas' ? { category } : {}),
        ...(query ? { q: query } : {}),
      });

      const res = await fetch(`https://newsdata.io/api/1/news?${params}`);
      const data = (await res.json()) as {
        results?: Array<{
          article_id?: string;
          title?: string;
          source_id?: string;
          link?: string;
          pubDate?: string;
          category?: string[];
          lat?: number;
          lon?: number;
          country?: string[];
          description?: string;
        }>;
      };

      if (data.results) {
        const articles = data.results
          .filter((a) => a.lat && a.lon) // solo noticias con ubicación
          .map((a) => ({
            id: a.article_id,
            title: a.title,
            source: a.source_id,
            url: a.link,
            publishedAt: a.pubDate,
            category: a.category?.[0] ?? 'general',
            lat: a.lat,
            lng: a.lon,
            country: a.country?.[0] ?? '',
            description: a.description,
          }));
        return NextResponse.json({ articles });
      }
    }

    // Fallback: GNews
    const gnewsKey = process.env.GNEWS_API_KEY;
    if (gnewsKey) {
      const params = new URLSearchParams({
        token: gnewsKey,
        lang: 'es',
        max: '20',
        ...(query ? { q: query } : { q: 'mundo' }),
      });
      const res = await fetch(`https://gnews.io/api/v4/search?${params}`);
      const data = (await res.json()) as {
        articles?: Array<{
          url?: string;
          title?: string;
          source?: { name?: string };
          publishedAt?: string;
          description?: string;
        }>;
      };

      if (data.articles) {
        return NextResponse.json({
          articles: data.articles.map((a) => ({
            id: a.url,
            title: a.title,
            source: a.source?.name,
            url: a.url,
            publishedAt: a.publishedAt,
            category: 'general',
            lat: null,
            lng: null,
            description: a.description,
          })),
        });
      }
    }

    return NextResponse.json({ articles: [], error: 'No API key configured' });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { articles: [], error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
