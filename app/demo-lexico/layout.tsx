import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Léxico afectivo · AlmaMundi',
  robots: { index: false, follow: false },
};

export default function DemoLexicoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
