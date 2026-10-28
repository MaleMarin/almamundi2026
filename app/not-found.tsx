import { NotFoundView } from '@/components/layout/NotFoundView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Esta página no está en el mapa',
  robots: { index: false, follow: false } };

export default function NotFound() {
  return <NotFoundView />;
}
