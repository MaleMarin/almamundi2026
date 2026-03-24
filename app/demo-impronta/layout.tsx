import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo Impronta (histórica) · AlmaMundi',
  robots: { index: false, follow: false },
};

export default function DemoImprontaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
