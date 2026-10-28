'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { PREGUNTA_COPY } from '@/lib/i18n/pregunta-messages';
import { PREGUNTA_UI, preguntaPageHref, preguntaPorId } from '@/lib/pregunta-semana';
import type { RespuestaPublica } from '@/lib/respuestas/public';

type Filter = 'all' | 'tu' | 'alguien';

function AnswerBody({ item, large }: { item: RespuestaPublica; large?: boolean }) {
  if (item.kind === 'voz' && item.previewUrl) {
    return <audio controls preload="none" src={item.previewUrl} className={large ? 'w-full' : 'w-full'} />;
  }
  if (item.kind === 'foto') {
    return (
      <div className="flex flex-col gap-2">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.contenido}
            className={large ? 'max-h-[70vh] w-full rounded-2xl object-contain' : 'h-40 w-full rounded-xl object-cover'}
          />
        ) : null}
        {item.contenido ? <p className="text-[length:var(--fs-texto)] font-normal leading-relaxed">{item.contenido}</p> : null}
      </div>
    );
  }
  return <p className={large ? 'whitespace-pre-wrap text-[length:var(--fs-texto)] font-normal leading-relaxed' : 'line-clamp-4 whitespace-pre-wrap text-[length:var(--fs-texto)] font-normal leading-relaxed'}>{item.contenido}</p>;
}

export default function RespuestasMosaic({ questionId }: { questionId: string }) {
  const { locale, t } = useHomeLocale();
  const pregunta = preguntaPorId(questionId);
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<RespuestaPublica[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<RespuestaPublica | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (offset: number, replace: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const q = new URLSearchParams({ questionId, offset: String(offset), limit: '24' });
        if (filter !== 'all') q.set('mode', filter);
        const res = await fetch(`/api/respuestas/public?${q.toString()}`);
        const data = (await res.json()) as { items?: RespuestaPublica[]; nextOffset?: number | null };
        if (!res.ok) throw new Error('list');
        const page = data.items ?? [];
        setItems((prev) => (replace ? page : [...prev, ...page]));
        setNextOffset(data.nextOffset ?? null);
      } catch {
        if (replace) setItems([]);
        setNextOffset(null);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [filter, questionId]
  );

  useEffect(() => {
    setItems([]);
    setNextOffset(0);
    void load(0, true);
  }, [load]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || nextOffset == null) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && nextOffset != null) void load(nextOffset, false);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [load, nextOffset]);

  if (!pregunta) return null;
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: PREGUNTA_COPY.all[locale] },
    { id: 'tu', label: PREGUNTA_COPY.you[locale] },
    { id: 'alguien', label: PREGUNTA_COPY.someone[locale] },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 text-[#1C1C2E]">
      <div className="flex flex-col gap-3">
        <p className="m-0 text-[length:var(--fs-pequeno)] font-semibold text-[#FF4A1C]">{pregunta.tema[locale]}</p>
        <h1 className="m-0 text-[length:var(--fs-titular)] font-normal leading-snug">{pregunta.tu[locale]}</h1>
        <p className="m-0 text-[length:var(--fs-pequeno)] leading-relaxed text-[#4A5568]">{pregunta.alguien[locale]}</p>
        <Link href={preguntaPageHref(pregunta.id)} className="btn-am-principal inline-flex min-h-11 w-fit items-center px-5 text-[length:var(--fs-pequeno)] font-semibold">
          {PREGUNTA_UI.responder[locale]}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`${filter === item.id ? 'btn-am-principal' : 'btn-am-neutro'} inline-flex min-h-11 items-center px-4 text-[length:var(--fs-pequeno)] font-semibold`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {!loading && items.length === 0 ? <p className="m-0 text-[length:var(--fs-pequeno)]">{PREGUNTA_COPY.empty[locale]}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpen(item)}
            className="rounded-2xl border border-black/10 bg-white p-4 text-left"
          >
            <p className="m-0 text-[length:var(--fs-pequeno)] font-semibold">{item.alias}</p>
            <p className="mb-2 mt-0.5 text-[length:var(--fs-etiqueta)] text-[#4A5568]">{item.city}</p>
            <AnswerBody item={item} />
          </button>
        ))}
      </div>
      <div ref={sentinelRef} className="h-8" />
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[length:var(--fs-texto)] font-semibold">{open.alias}</p>
                <p className="m-0 text-[length:var(--fs-pequeno)] text-[#4A5568]">{open.city}</p>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="btn-am-neutro inline-flex min-h-11 items-center px-4 text-[length:var(--fs-pequeno)] font-semibold">
                {t.modalClose}
              </button>
            </div>
            <AnswerBody item={open} large />
          </div>
        </div>
      ) : null}
    </div>
  );
}
