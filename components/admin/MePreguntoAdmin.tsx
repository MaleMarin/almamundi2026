'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { SITE_FONT_STACK } from '@/lib/typography';

type Item = {
  id: string;
  texto: string;
  alias: string;
  city: string;
  country: string;
  locale: string;
  email: string;
  createdAt: number | null;
};

const btn = (tone: 'ok' | 'danger' | 'neutral') =>
  ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 999,
    border:
      tone === 'ok' ? '1px solid rgba(34,197,94,0.5)' : tone === 'danger' ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.2)',
    background: tone === 'ok' ? 'rgba(34,197,94,0.2)' : tone === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
    color: tone === 'ok' ? '#86efac' : tone === 'danger' ? '#fca5a5' : 'rgba(255,255,255,0.9)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: SITE_FONT_STACK,
  }) as const;

function fecha(ms: number | null): string {
  if (!ms) return '';
  try {
    return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' }).format(
      new Date(ms)
    );
  } catch {
    return '';
  }
}

/** Pestaña «Me pregunto»: aprobar, rechazar o borrar las preguntas que deja la gente. */
export default function MePreguntoAdmin({ token }: { token: string }) {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/me-pregunto?status=${tab}`, { headers: headers(), cache: 'no-store' });
      const data = (await res.json()) as { items?: Item[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/me-pregunto/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ action, texto: draft[id] }),
      });
      setNotice(res.ok ? (action === 'approve' ? 'Pregunta publicada' : 'Pregunta rechazada') : 'No se pudo guardar');
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('¿Eliminar esta pregunta? No se puede deshacer.')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/me-pregunto/${id}`, { method: 'DELETE', headers: headers() });
      setNotice(res.ok ? 'Pregunta eliminada' : 'No se pudo eliminar');
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ fontFamily: SITE_FONT_STACK, color: '#fff' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(
          [
            ['pending', 'Pendientes'],
            ['approved', 'Publicadas'],
            ['rejected', 'Rechazadas'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" style={{ ...btn('neutral'), opacity: tab === id ? 1 : 0.6 }} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {notice ? <p style={{ margin: '0 0 12px', opacity: 0.85 }}>{notice}</p> : null}
      {loading ? <p>Cargando…</p> : null}
      {!loading && items.length === 0 ? <p style={{ opacity: 0.7 }}>No hay preguntas en esta lista.</p> : null}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <li key={item.id} style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
            {tab === 'pending' ? (
              <textarea
                value={draft[item.id] ?? item.texto}
                onChange={(event) => setDraft((prev) => ({ ...prev, [item.id]: event.target.value }))}
                rows={2}
                maxLength={160}
                style={{ width: '100%', fontSize: 18, padding: 10, borderRadius: 10, color: '#111', background: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontFamily: SITE_FONT_STACK }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{item.texto}</p>
            )}
            <p style={{ margin: '8px 0 12px', fontSize: 14, opacity: 0.75 }}>
              {item.alias} · {[item.city, item.country].filter(Boolean).join(', ')} · {item.locale.toUpperCase()} · {fecha(item.createdAt)}
              {item.email ? ` · ${item.email}` : ' · sin correo'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tab !== 'approved' ? (
                <button type="button" style={btn('ok')} disabled={busy === item.id} onClick={() => void act(item.id, 'approve')}>
                  <Check size={16} /> Publicar
                </button>
              ) : null}
              {tab === 'pending' ? (
                <button type="button" style={btn('neutral')} disabled={busy === item.id} onClick={() => void act(item.id, 'reject')}>
                  <X size={16} /> Rechazar
                </button>
              ) : null}
              <button type="button" style={btn('danger')} disabled={busy === item.id} onClick={() => void remove(item.id)}>
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
