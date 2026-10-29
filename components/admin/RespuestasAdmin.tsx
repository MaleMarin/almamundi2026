'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, Check, Trash2, X } from 'lucide-react';
import { preguntaAdminResumen } from '@/lib/pregunta-semana';
import { SenderConsentBlocks, type ConsentInfo, type SenderInfo } from '@/components/admin/SenderConsent';
import { SITE_FONT_STACK } from '@/lib/typography';

type Kind = 'texto' | 'voz' | 'foto';
type Status = 'pending' | 'approved' | 'rejected' | 'archived';

type RespuestaItem = {
  id: string;
  questionId: string;
  mode: string;
  kind: Kind;
  contenido: string;
  alias: string;
  city: string;
  country: string;
  sender?: SenderInfo;
  consents?: ConsentInfo[];
  consentTextsVersion?: string | null;
  status: Status;
  createdAt: number | null;
  previewUrl: string | null;
  hasLocation: boolean;
};

const CONFIRM_DELETE = '¿Eliminar esta respuesta y sus archivos? No se puede deshacer.';

const KIND_LABEL: Record<Kind, string> = {
  texto: 'Texto',
  voz: 'Voz',
  foto: 'Foto',
};

const glassCard = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 22,
  padding: '20px 24px',
} as const;

const okBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid rgba(34,197,94,0.5)',
  background: 'rgba(34,197,94,0.2)',
  color: '#86efac',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: SITE_FONT_STACK,
} as const;

const dangerBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid rgba(239,68,68,0.5)',
  background: 'rgba(239,68,68,0.2)',
  color: '#fca5a5',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: SITE_FONT_STACK,
} as const;

const neutralBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: SITE_FONT_STACK,
} as const;

function formatDate(ms: number | null): string {
  if (!ms) return '';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Santiago',
    }).format(new Date(ms));
  } catch {
    return '';
  }
}

export default function RespuestasAdmin({ token }: { token: string }) {
  const [tab, setTab] = useState<'pending' | 'approved' | 'archivo'>('pending');
  const [items, setItems] = useState<RespuestaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [placePrompt, setPlacePrompt] = useState<Record<string, { city: string; country: string }>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const headers = useCallback((): HeadersInit => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statuses: Status[] = tab === 'archivo' ? ['archived', 'rejected'] : [tab];
      const lists = await Promise.all(
        statuses.map(async (status) => {
          const res = await fetch(`/api/admin/respuestas?status=${status}`, { headers: headers() });
          const data = (await res.json()) as { items?: RespuestaItem[]; error?: string };
          if (!res.ok) throw new Error(data.error || 'list');
          return data.items ?? [];
        })
      );
      const merged = lists.flat().sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setItems(merged);
    } catch {
      setItems([]);
      setNotice('No se pudieron cargar las respuestas.');
    } finally {
      setLoading(false);
    }
  }, [headers, tab]);

  useEffect(() => {
    setNotice(null);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (
    id: string,
    action: 'approve' | 'reject' | 'archive',
    place?: { city: string; country: string }
  ) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/respuestas/${id}`, {
        method: 'PATCH',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...(place?.city && place.country ? { city: place.city, country: place.country } : {}),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; code?: string };
      if (data.code === 'location_not_found') {
        const item = items.find((row) => row.id === id);
        setPlacePrompt((prev) => ({
          ...prev,
          [id]: prev[id] ?? { city: item?.city ?? '', country: item?.country ?? '' },
        }));
        setNotice('No encontramos esta ubicación');
      } else {
        setNotice(data.ok ? 'Listo.' : (data.error ?? 'No se pudo actualizar.'));
        if (data.ok) {
          setPlacePrompt((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          await load();
        }
      }
    } catch {
      setNotice('No se pudo actualizar.');
    } finally {
      setActionId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(CONFIRM_DELETE)) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/respuestas/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      setNotice(data.ok ? 'Respuesta eliminada.' : (data.error ?? 'No se pudo eliminar.'));
      if (data.ok) await load();
    } catch {
      setNotice('No se pudo eliminar.');
    } finally {
      setActionId(null);
    }
  };

  const tabs = [
    { id: 'pending' as const, label: 'Pendientes' },
    { id: 'approved' as const, label: 'En el mapa' },
    { id: 'archivo' as const, label: 'Archivo' },
  ];

  return (
    <div style={{ fontFamily: SITE_FONT_STACK }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.14)',
              background: tab === item.id ? 'rgba(255,74,28,0.2)' : 'rgba(255,255,255,0.06)',
              color: tab === item.id ? '#FF6E49' : 'rgba(255,255,255,0.85)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: SITE_FONT_STACK,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {notice && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{notice}</p>}
      {loading && <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 40 }}>Cargando…</p>}
      {!loading && items.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>No hay respuestas en esta lista.</p>
      )}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => {
            const busy = actionId === item.id;
            const place = [item.city, item.country].filter(Boolean).join(', ');
            return (
              <article key={item.id} style={glassCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fdba74' }}>{KIND_LABEL[item.kind]}</span>
                      {item.status === 'rejected' && (
                        <span style={{ fontSize: 11, color: '#fca5a5' }}>Rechazada</span>
                      )}
                      {item.status === 'archived' && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Archivada</span>
                      )}
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{place}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{formatDate(item.createdAt)}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>
                      {preguntaAdminResumen(item.questionId, item.mode) ?? item.questionId}
                    </p>
                    <SenderConsentBlocks
                      sender={item.sender}
                      consents={item.consents}
                      consentTextsVersion={item.consentTextsVersion}
                      token={token}
                    />
                    {item.kind === 'texto' && (
                      <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{item.contenido}</p>
                    )}
                    {item.kind === 'foto' && (
                      <div style={{ marginTop: 10 }}>
                        {item.previewUrl ? (
                          <img src={item.previewUrl} alt="" style={{ maxWidth: 280, width: '100%', borderRadius: 12 }} />
                        ) : (
                          <p style={{ fontSize: 13, color: '#fbbf24' }}>No se pudo abrir la foto.</p>
                        )}
                        <p style={{ margin: '8px 0 0', fontSize: 14 }}>{item.contenido}</p>
                      </div>
                    )}
                    {item.kind === 'voz' && (
                      <div style={{ marginTop: 10 }}>
                        {item.previewUrl ? (
                          <audio controls preload="none" src={item.previewUrl} style={{ width: 'min(100%, 360px)' }} />
                        ) : (
                          <p style={{ fontSize: 13, color: '#fbbf24' }}>No se pudo abrir el audio.</p>
                        )}
                      </div>
                    )}
                    {item.status === 'pending' && (
                      <p
                        style={{
                          margin: '8px 0 0',
                          fontSize: 12,
                          color: item.hasLocation ? 'rgba(255,255,255,0.55)' : '#fbbf24',
                        }}
                      >
                        {item.hasLocation ? 'Ya tiene ubicación' : 'Sin ubicación'}
                      </p>
                    )}
                    {placePrompt[item.id] ? (
                      <div style={{ marginTop: 10 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#fbbf24' }}>No encontramos esta ubicación</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input
                            value={placePrompt[item.id]?.city ?? ''}
                            onChange={(event) =>
                              setPlacePrompt((prev) => ({
                                ...prev,
                                [item.id]: { city: event.target.value, country: prev[item.id]?.country ?? '' },
                              }))
                            }
                            placeholder="Ciudad"
                            aria-label="Ciudad"
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: '1px solid rgba(251,191,36,0.45)',
                              background: 'rgba(0,0,0,0.25)',
                              color: 'white',
                              fontFamily: SITE_FONT_STACK,
                            }}
                          />
                          <input
                            value={placePrompt[item.id]?.country ?? ''}
                            onChange={(event) =>
                              setPlacePrompt((prev) => ({
                                ...prev,
                                [item.id]: { city: prev[item.id]?.city ?? '', country: event.target.value },
                              }))
                            }
                            placeholder="País"
                            aria-label="País"
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: '1px solid rgba(251,191,36,0.45)',
                              background: 'rgba(0,0,0,0.25)',
                              color: 'white',
                              fontFamily: SITE_FONT_STACK,
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {item.status === 'pending' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patch(item.id, 'approve', placePrompt[item.id])}
                        style={okBtn}
                      >
                        <Check size={16} /> Aprobar
                      </button>
                    )}
                    {item.status === 'pending' && (
                      <button type="button" disabled={busy} onClick={() => patch(item.id, 'reject')} style={dangerBtn}>
                        <X size={16} /> Rechazar
                      </button>
                    )}
                    {item.status !== 'archived' && (
                      <button type="button" disabled={busy} onClick={() => patch(item.id, 'archive')} style={neutralBtn}>
                        <Archive size={16} /> Archivar
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => remove(item.id)} style={dangerBtn}>
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
