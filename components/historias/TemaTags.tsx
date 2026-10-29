'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { getTema } from '@/lib/temas';

export function TemaTags({
  ids,
  tone,
  className,
}: {
  ids?: string[];
  tone: 'light' | 'dark';
  className?: string;
}) {
  const { locale } = useHomeLocale();
  const items = (ids ?? [])
    .map((id) => {
      const tema = getTema(id);
      if (!tema) return null;
      return { id, label: tema[locale], eje: tema.eje };
    })
    .filter((item) => item !== null);
  if (!items.length) return null;
  const light = tone === 'light';
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/historias?eje=${item.eje}`}
          className="inline-flex min-h-7 items-center rounded-full px-2.5 py-0.5 text-[length:var(--fs-etiqueta)] font-semibold"
          style={{
            color: light ? '#4A5568' : 'rgba(255,255,255,0.9)',
            border: light ? '1px solid rgba(74,85,104,0.28)' : '1px solid rgba(255,255,255,0.28)',
            background: light ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.08)',
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
