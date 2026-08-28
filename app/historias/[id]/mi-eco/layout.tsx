import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'AlmaMundi' },
  description: 'AlmaMundi',
  robots: { index: false, follow: false, nocache: true },
};

export default function MiEcoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
