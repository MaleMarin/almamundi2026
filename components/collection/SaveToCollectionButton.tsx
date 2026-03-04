'use client';

import { useState, useEffect } from 'react';
import { addToCollection, isInCollection, type CollectionKind } from '@/lib/collection';

type Props = {
  kind: CollectionKind;
  id: string;
  title: string;
  subtitle: string;
  className?: string;
};

export function SaveToCollectionButton({ kind, id, title, subtitle, className }: Props) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setSaved(isInCollection(kind, id));
  }, [kind, id]);

  const handleClick = () => {
    if (saved) return;
    addToCollection({ kind, id, title, subtitle });
    setSaved(true);
    setToast(true);
    const t = window.setTimeout(() => setToast(false), 2500);
    return () => window.clearTimeout(t);
  };

  return (
    <div className="flex items-center gap-2">
      {toast && (
        <span className="text-[11px] text-emerald-400/90">
          Guardado en tu colección
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={saved}
        className={
          className ??
          'px-3 py-2 rounded-xl text-sm font-medium border transition ' +
            (saved
              ? 'bg-white/10 border-white/20 text-white/60 cursor-default'
              : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10 hover:border-white/25')
        }
      >
        {saved ? 'Guardado' : 'Guardar'}
      </button>
    </div>
  );
}
