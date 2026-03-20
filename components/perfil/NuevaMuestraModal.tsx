'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Muestra } from '@/lib/almamundi/perfil-queries';
import { SITE_FONT_STACK } from '@/lib/typography';

const BG = '#e8ecf0';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const SH_DARK = 'rgba(163,177,198,0.6)';
const ORANGE = '#ff6b2b';
const TEXT_1 = '#1a2332';
const TEXT_2 = '#4a5568';
const TEXT_3 = '#8896a5';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (muestra: Muestra) => void;
  autorId: string;
  autorNombre: string;
};

export function NuevaMuestraModal({ isOpen, onClose, onCreated, autorId, autorNombre }: Props) {
  const [titulo, setTitulo] = useState('');
  const [sentido, setSentido] = useState('');
  const [portadaUrl, setPortadaUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tituloError, setTituloError] = useState('');
  const [sentidoError, setSentidoError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const validate = (): boolean => {
    let ok = true;
    if (titulo.trim().length < 3) {
      setTituloError('El título es muy corto');
      ok = false;
    } else setTituloError('');
    if (sentido.trim().length < 20) {
      setSentidoError('Cuéntanos un poco más sobre el sentido');
      ok = false;
    } else setSentidoError('');
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/perfil/muestras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autorId,
          autorNombre,
          titulo: titulo.trim(),
          sentido: sentido.trim(),
          portadaUrl: portadaUrl.trim() || undefined,
          historias: [],
          historiasCount: 0,
          isPublic,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.error || 'Error al crear la muestra');
        setLoading(false);
        return;
      }
      const now = new Date().toISOString();
      const nuevaMuestra: Muestra = {
        id: data.id,
        autorId,
        autorNombre,
        titulo: titulo.trim(),
        sentido: sentido.trim(),
        portadaUrl: portadaUrl.trim() || undefined,
        historias: [],
        historiasCount: 0,
        createdAt: now,
        isPublic,
      };
      onCreated(nuevaMuestra);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const modal = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,35,50,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <div
        id="modal-title"
        style={{
          background: BG,
          borderRadius: 20,
          boxShadow: `12px 12px 24px ${SH_DARK}, -6px -6px 16px ${SH_LIGHT}`,
          padding: '1.8rem',
          width: 360,
          maxWidth: '92vw',
          animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1) forwards',
          fontFamily: SITE_FONT_STACK,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <form onSubmit={handleSubmit}>
          <h2 style={{ margin: '0 0 1.2rem', fontSize: '1.1rem', fontWeight: 600, color: TEXT_1 }}>
            Nueva muestra
          </h2>

          {/* Título */}
          <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', color: TEXT_2 }}>
            Título de la muestra
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Historias que me cambiaron algo..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: BG,
              boxShadow: `inset 3px 3px 6px ${SH_DARK}, inset -3px -3px 6px ${SH_LIGHT}`,
              borderRadius: 10,
              padding: '0.65rem 0.8rem',
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              color: TEXT_1,
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `inset 3px 3px 6px ${SH_DARK}, inset -3px -3px 6px ${SH_LIGHT}, 0 0 0 2px rgba(255,107,43,0.3)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = `inset 3px 3px 6px ${SH_DARK}, inset -3px -3px 6px ${SH_LIGHT}`;
            }}
          />
          {tituloError && (
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#c53030' }}>{tituloError}</p>
          )}

          {/* Sentido */}
          <label style={{ display: 'block', marginTop: '1rem', marginBottom: 4, fontSize: '0.8rem', color: TEXT_2 }}>
            ¿Por qué esta muestra? <span style={{ color: ORANGE }}>*</span>
          </label>
          <textarea
            value={sentido}
            onChange={(e) => setSentido(e.target.value)}
            placeholder={'Cuéntanos el sentido de esta colección.\n¿Qué te llevó a crearla? ¿A quién está dedicada?\n¿Para qué la hiciste?'}
            rows={4}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: BG,
              boxShadow: `inset 3px 3px 6px ${SH_DARK}, inset -3px -3px 6px ${SH_LIGHT}`,
              borderRadius: 10,
              padding: '0.65rem 0.8rem',
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              color: TEXT_1,
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `inset 3px 3px 6px ${SH_DARK}, inset -3px -3px 6px ${SH_LIGHT}, 0 0 0 2px rgba(255,107,43,0.3)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = `inset 3px 3px 6px ${SH_DARK}, inset -3px -3px 6px ${SH_LIGHT}`;
            }}
          />
          <p style={{ margin: '4px 0 0', fontSize: '0.7rem', fontStyle: 'italic', color: TEXT_3 }}>
            Esta es la parte más importante. Una muestra sin sentido es solo una lista.
          </p>
          {sentidoError && (
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#c53030' }}>{sentidoError}</p>
          )}

          {/* Imagen portada (opcional) */}
          <label style={{ display: 'block', marginTop: '1rem', marginBottom: 4, fontSize: '0.8rem', color: TEXT_2 }}>
            Imagen de portada (opcional)
          </label>
          <button
            type="button"
            onClick={() => {}}
            style={{
              width: '100%',
              height: 40,
              background: BG,
              boxShadow: `inset 3px 3px 6px ${SH_DARK}, inset -3px -3px 6px ${SH_LIGHT}`,
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: TEXT_3,
            }}
          >
            Elegir imagen →
          </button>

          {/* Visibilidad */}
          <label style={{ display: 'block', marginTop: '1rem', marginBottom: 6, fontSize: '0.8rem', color: TEXT_2 }}>
            Visibilidad
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              style={{
                flex: 1,
                padding: '0.5rem 0.8rem',
                borderRadius: 50,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: SITE_FONT_STACK,
                background: isPublic ? `linear-gradient(135deg, ${ORANGE}, #ff8c55)` : BG,
                color: isPublic ? '#fff' : TEXT_2,
                boxShadow: isPublic ? `3px 3px 10px rgba(255,107,43,0.35)` : `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
              }}
            >
              Muestra pública
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              style={{
                flex: 1,
                padding: '0.5rem 0.8rem',
                borderRadius: 50,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: SITE_FONT_STACK,
                background: !isPublic ? `linear-gradient(135deg, ${ORANGE}, #ff8c55)` : BG,
                color: !isPublic ? '#fff' : TEXT_2,
                boxShadow: !isPublic ? `3px 3px 10px rgba(255,107,43,0.35)` : `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
              }}
            >
              Solo yo
            </button>
          </div>

          {error && (
            <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: '#c53030' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: SITE_FONT_STACK,
                background: BG,
                color: TEXT_2,
                boxShadow: `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: 12,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontFamily: SITE_FONT_STACK,
                background: `linear-gradient(135deg, ${ORANGE}, #ff8c55)`,
                color: '#fff',
                boxShadow: `5px 5px 12px rgba(255,107,43,0.4), -2px -2px 6px ${SH_LIGHT}`,
              }}
            >
              {loading ? 'Creando...' : 'Crear muestra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
