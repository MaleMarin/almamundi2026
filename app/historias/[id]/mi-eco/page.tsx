import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MiEcoClient } from '@/components/historias/MiEcoClient';
import { loadAuthorEcoPage } from '@/lib/author-eco-story';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
};

export const metadata: Metadata = {
  title: { absolute: 'AlmaMundi' },
  description: 'AlmaMundi',
  robots: { index: false, follow: false, nocache: true },
};

function tokenFromSearch(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return undefined;
}

export default async function MiEcoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const data = await loadAuthorEcoPage(id, tokenFromSearch(sp.t));
  if (!data) notFound();

  return (
    <MiEcoClient
      title={data.title}
      narrativeText={data.narrativeText}
      submissionId={data.submissionId}
      format={data.format}
      city={data.city}
      country={data.country}
      footerAtIso={data.footerAtIso}
      resonanceCount={data.resonanceCount}
    />
  );
}
