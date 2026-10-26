import { NotFoundView } from '@/components/layout/NotFoundView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Esta página se perdió en el camino',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundView />;
}
