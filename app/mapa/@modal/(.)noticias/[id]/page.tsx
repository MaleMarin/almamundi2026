'use client';

import { useParams } from 'next/navigation';
import { NewsObservatoryModalClient } from './NewsObservatoryModalClient';

export default function ObservatorioNoticiaModalPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  return <NewsObservatoryModalClient newsId={id} />;
}
