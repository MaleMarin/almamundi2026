'use client';

/**
 * CurationPanel — Panel de curación para /admin
 *
 * Muestra las historias pendientes y permite al curador:
 *   1. Ver el contenido de la historia
 *   2. Confirmar/editar los temas sugeridos por IA
 *   3. Completar ubicación y cita si faltan
 *   4. Publicar (→ POST /api/curate/publish) o Rechazar
 *
 * Una vez publicada, la historia aparece automáticamente en:
 *   /historias/video | audio | texto | foto
 *   /temas/[slug]    para cada tema asignado
 *   /#mapa (home)    si tiene ubicación
 */

import { useState } from 'react';
import { TEMAS, detectarTemas } from '@/lib/temas';
import type { StoryData } from '@/lib/story-schema';
import {
  REJECTION_REASON_DETAIL_MAX,
  REJECTION_REASON_OPTIONS,
  resolvePublicRejectionText,
} from '@/lib/editorial/rejection-reasons';

// ─── Tipos UI ────────────────────────────────────────────────────────────────
type CurationState = 'idle' | 'publishing' | 'rejecting' | 'done' | 'error';

type Props = {
  story: StoryData;
  curadorId: string;
  onDone: (storyId: string, action: 'published' | 'rejected') => void;
  /** Cabeceras Authorization (Firebase ID token) para rutas /api/curate/*. */
  getAuthHeaders?: () => HeadersInit;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const FORMATO_LABEL: Record<string, string> = {
  video: '🎬 Video',
  audio: '🎙️ Audio',
  texto: '✍️ Texto',
  foto: '📸 Foto',
};

// ─── Component ───────────────────────────────────────────────────────────────
function mergeHeaders(base: Record<string, string>, extra?: HeadersInit): Record<string, string> {
  const out = { ...base };
  if (!extra) return out;
  const h = new Headers(extra);
  h.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export function CurationPanel({ story, curadorId, onDone, getAuthHeaders }: Props) {
  // Temas: pre-sugeridos por IA, el curador confirma/edita
  const sugeridos = detectarTemas(
    `${story.titulo} ${story.subtitulo ?? ''} ${story.descripcion ?? ''} ${story.tags?.join(' ') ?? ''}`
  );
  const [temasSeleccionados, setTemasSeleccionados] = useState<string[]>(
    story.temas?.length ? story.temas : sugeridos
  );
  const [quote, setQuote] = useState(story.quote ?? '');
  const [ciudad, setCiudad] = useState(story.ubicacion?.ciudad ?? '');
  const [pais, setPais] = useState(story.ubicacion?.pais ?? '');
  const [nota, setNota] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [state, setState] = useState<CurationState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleTema = (slug: string) => {
    setTemasSeleccionados((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  // ── Publicar ─────────────────────────────────────────────────────────────
  const publicar = async () => {
    if (temasSeleccionados.length === 0) {
      setErrorMsg('Asigna al menos un tema antes de publicar.');
      return;
    }
    setState('publishing');
    setErrorMsg('');
    try {
      const res = await fetch('/api/curate/publish', {
        method: 'POST',
        headers: mergeHeaders({ 'Content-Type': 'application/json' }, getAuthHeaders?.()),
        body: JSON.stringify({
          storyId: story.id,
          temas: temasSeleccionados,
          curadorNota: nota || undefined,
          quote: quote || undefined,
          ubicacion:
            ciudad || pais
              ? { ciudad: ciudad || undefined, pais: pais || undefined }
              : story.ubicacion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
      setState('done');
      onDone(story.id, 'published');
    } catch (e: unknown) {
      setState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Error al publicar');
    }
  };

  // ── Rechazar ─────────────────────────────────────────────────────────────
  const rechazar = async () => {
    const resolved = resolvePublicRejectionText(reasonId, reasonDetail);
    if (!resolved.ok) {
      setErrorMsg(resolved.error);
      return;
    }
    setState('rejecting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/curate/reject', {
        method: 'POST',
        headers: mergeHeaders({ 'Content-Type': 'application/json' }, getAuthHeaders?.()),
        body: JSON.stringify({
          storyId: story.id,
          nota: nota || undefined,
          reasonId: resolved.reasonId,
          reasonDetail: resolved.detail || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
      setState('done');
      onDone(story.id, 'rejected');
    } catch (e: unknown) {
      setState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Error al rechazar');
    }
  };

  if (state === 'done') return null;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '720px',
        width: '100%',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        {story.imageUrl && (
          <img
            src={story.imageUrl}
            alt=""
            style={{
              width: '80px',
              height: '56px',
              objectFit: 'cover',
              borderRadius: '6px',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6b7280',
              }}
            >
              {FORMATO_LABEL[story.formato] ?? story.formato}
            </span>
            <span style={{ color: '#d1d5db' }}>·</span>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              {new Date(story.createdAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
            {story.titulo}
          </h3>
          {story.subtitulo && (
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.2rem 0 0' }}>
              {story.subtitulo}
            </p>
          )}
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.3rem 0 0' }}>
            por <strong style={{ color: '#374151' }}>{story.autor.nombre}</strong>
          </p>
        </div>
      </div>

      {/* ── Formato (solo lectura, auto-detectado) ── */}
      <Section titulo="Formato detectado">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#f3f4f6',
            borderRadius: '6px',
            padding: '0.4rem 0.8rem',
            fontSize: '0.85rem',
            color: '#374151',
          }}
        >
          {FORMATO_LABEL[story.formato] ?? story.formato}
          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
            (detectado automáticamente)
          </span>
        </div>
      </Section>

      {/* ── Temas ── */}
      <Section
        titulo="Temas"
        subtitulo={`Sugeridos por IA: ${sugeridos.length > 0 ? sugeridos.join(', ') : 'ninguno detectado'} · Selecciona los que correspondan`}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {TEMAS.map((tema) => {
            const activo = temasSeleccionados.includes(tema.slug);
            const esSugerido = sugeridos.includes(tema.slug);
            return (
              <button
                key={tema.slug}
                type="button"
                onClick={() => toggleTema(tema.slug)}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: '20px',
                  border: activo ? `2px solid ${tema.color}` : '1.5px solid #e5e7eb',
                  background: activo ? `${tema.color}18` : '#fff',
                  color: activo ? tema.color : '#6b7280',
                  fontSize: '0.78rem',
                  fontWeight: activo ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {tema.titulo.split(' ').slice(0, 3).join(' ')}…
                {esSugerido && !activo && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        {temasSeleccionados.length > 0 && (
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.6rem' }}>
            ✓ {temasSeleccionados.length} tema(s) seleccionado(s): {temasSeleccionados.join(', ')}
          </p>
        )}
      </Section>

      {/* ── Ubicación ── */}
      <Section titulo="Ubicación" subtitulo="Completa si el autor no la especificó">
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ciudad"
            style={inputStyle}
          />
          <input
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            placeholder="País"
            style={inputStyle}
          />
        </div>
      </Section>

      {/* ── Cita destacada ── */}
      <Section
        titulo="Cita destacada"
        subtitulo="Aparece en el end screen del player de video/audio"
      >
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Frase memorable de la historia (opcional)..."
          rows={2}
          style={{
            ...inputStyle,
            width: '100%',
            resize: 'vertical',
            fontStyle: quote ? 'italic' : 'normal',
          }}
        />
      </Section>

      {/* ── Motivo público de rechazo ── */}
      <Section
        titulo="Motivo si rechazas"
        subtitulo="La persona lo recibe por correo, en tono claro. Si hay duda (menores, terceros), pide más información y deja pendiente; no apruebes ni rechaces de inmediato."
      >
        <select
          value={reasonId}
          onChange={(e) => setReasonId(e.target.value)}
          style={{ ...inputStyle, width: '100%', marginBottom: '0.5rem' }}
        >
          <option value="">Elegir motivo…</option>
          {REJECTION_REASON_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {reasonId === 'minors' && (
          <p style={{ fontSize: '0.75rem', color: '#b45309', margin: '0 0 0.5rem' }}>
            Si hay duda, no rechaces aún: pide más información y deja la historia pendiente.
          </p>
        )}
        <textarea
          value={reasonDetail}
          onChange={(e) => setReasonDetail(e.target.value)}
          maxLength={REJECTION_REASON_DETAIL_MAX}
          placeholder={
            reasonId === 'other'
              ? 'Escribe el motivo que verá la persona…'
              : 'Detalle opcional (también lo verá la persona)'
          }
          rows={2}
          style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
        />
      </Section>

      {/* ── Nota interna ── */}
      <Section
        titulo="Nota del curador"
        subtitulo="Respaldo interno: por qué se aprobó o rechazó. No se envía a la persona"
      >
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Por qué se decidió así (fecha, si se pidió más información, segunda opinión…)"
          rows={2}
          style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
        />
      </Section>

      {/* ── Error ── */}
      {errorMsg && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            color: '#dc2626',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* ── Actions ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end',
          marginTop: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={rechazar}
          disabled={state !== 'idle' || !reasonId}
          style={{
            padding: '0.6rem 1.4rem',
            border: '1.5px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            color: '#6b7280',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
            (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
            (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
          }}
        >
          {state === 'rejecting' ? 'Rechazando…' : 'Rechazar'}
        </button>

        <button
          type="button"
          onClick={publicar}
          disabled={state !== 'idle' || temasSeleccionados.length === 0}
          style={{
            padding: '0.6rem 1.8rem',
            border: 'none',
            borderRadius: '8px',
            background: temasSeleccionados.length === 0 ? '#d1d5db' : '#FF4A1C',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: temasSeleccionados.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (temasSeleccionados.length > 0)
              (e.currentTarget as HTMLButtonElement).style.background = '#B53514';
          }}
          onMouseLeave={(e) => {
            if (temasSeleccionados.length > 0)
              (e.currentTarget as HTMLButtonElement).style.background = '#FF4A1C';
          }}
        >
          {state === 'publishing' ? 'Publicando…' : '✓ Publicar historia'}
        </button>
      </div>

      {/* ── Destinos preview ── */}
      {temasSeleccionados.length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: '#166534',
          }}
        >
          Al publicar aparecerá en: <strong>/historias/{story.formato}</strong>
          {' · '}
          {temasSeleccionados.map((s) => (
            <span key={s}>
              <strong>/temas/{s}</strong>{' '}
            </span>
          ))}
          {(ciudad || pais || story.ubicacion) && (
            <span>
              · <strong>/#mapa</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <p style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151', margin: 0 }}>
          {titulo}
        </p>
        {subtitulo && (
          <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.15rem 0 0' }}>
            {subtitulo}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1.5px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '0.85rem',
  color: '#374151',
  background: '#fff',
  outline: 'none',
  flex: 1,
  fontFamily: 'inherit',
};
