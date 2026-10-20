import { notFound } from 'next/navigation';
import { HomePageClient } from '@/components/home/HomePageClient';
import { contarMetadata, isContarFormat } from '@/lib/contar-routes';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ formato: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { formato } = await params;
  if (!isContarFormat(formato)) return {};
  return contarMetadata(formato);
}

export default async function ContarFormatoPage({ params }: Props) {
  const { formato } = await params;
  if (!isContarFormat(formato)) notFound();
  return <HomePageClient />;
}
