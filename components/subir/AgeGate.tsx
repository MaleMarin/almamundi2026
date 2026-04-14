'use client';

/**
 * AgeGate — Declaración de edad en el formulario de subida (/subir)
 *
 * Muestra primero la pregunta de edad.
 * Según la respuesta, habilita o bloquea tipos de contenido.
 * Guarda la declaración en el estado del formulario padre.
 *
 * USO:
 *   <AgeGate onChange={(declaration) => setAgeDeclaration(declaration)} />
 */

import { useState } from 'react';
import Link from 'next/link';
import { SITE_FONT_STACK } from '@/lib/typography';

// ─── Types ───────────────────────────────────────────────────────────────────
export type AgeGroup = 'adult' | 'minor';

export type AgeDeclaration = {
  group: AgeGroup;
  declaredAt: string; // ISO
  allowedFormats: FormatoPermitido[];
};

export type FormatoPermitido = {
  id: 'video' | 'audio' | 'texto' | 'foto_propia' | 'foto_otros';
  label: string;
  emoji: string;
  allowed: boolean;
  condition?: string; // texto explicativo si hay condición
};

type Props = {
  onChange: (declaration: AgeDeclaration) => void;
};

// ─── Reglas por grupo de edad ─────────────────────────────────────────────────
const FORMATS_ADULT: FormatoPermitido[] = [
  { id: 'video', emoji: '🎬', label: 'Video', allowed: true },
  { id: 'audio', emoji: '🎙️', label: 'Audio', allowed: true },
  { id: 'texto', emoji: '✍️', label: 'Escritura', allowed: true },
  { id: 'foto_propia', emoji: '📸', label: 'Fotografía propia', allowed: true },
  {
    id: 'foto_otros',
    emoji: '🖼️',
    label: 'Fotografía de terceros',
    allowed: true,
    condition: 'Con autorización de las personas fotografiadas',
  },
];

const FORMATS_MINOR: FormatoPermitido[] = [
  {
    id: 'video',
    emoji: '🎬',
    label: 'Video',
    allowed: false,
    condition: 'No disponible para personas menores de 18 años',
  },
  {
    id: 'audio',
    emoji: '🎙️',
    label: 'Audio',
    allowed: true,
    condition: 'Sin datos personales identificables',
  },
  {
    id: 'texto',
    emoji: '✍️',
    label: 'Escritura',
    allowed: true,
    condition: 'Sin datos personales identificables',
  },
  {
    id: 'foto_propia',
    emoji: '📸',
    label: 'Fotografía propia',
    allowed: false,
    condition: 'No disponible para personas menores de 18 años',
  },
  {
    id: 'foto_otros',
    emoji: '🖼️',
    label: 'Fotografía de terceros',
    allowed: true,
    condition: 'Sin menores visibles · Con autorización del fotógrafo',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function AgeGate({ onChange }: Props) {
  const [selected, setSelected] = useState<AgeGroup | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [consentido, setConsentido] = useState(false);

  const formats =
    selected === 'adult' ? FORMATS_ADULT : selected === 'minor' ? FORMATS_MINOR : [];

  const handleSelect = (group: AgeGroup) => {
    setSelected(group);
    setConfirmed(false);
    setConsentido(false);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
    onChange({
      group: selected,
      declaredAt: new Date().toISOString(),
      allowedFormats: formats,
    });
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        fontFamily: SITE_FONT_STACK,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: '#0d0b09',
          padding: '1.4rem 1.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🔒</span>
        <div>
          <p
            style={{
              fontFamily: SITE_FONT_STACK,
              fontWeight: 500,
              fontSize: '0.88rem',
              color: '#f5f0e8',
              margin: 0,
              letterSpacing: '0.03em',
            }}
          >
            Declaración de edad
          </p>
          <p
            style={{
              fontFamily: SITE_FONT_STACK,
              fontWeight: 300,
              fontSize: '0.75rem',
              color: 'rgba(245,240,232,0.5)',
              margin: '0.15rem 0 0',
            }}
          >
            Requerida antes de continuar · Determina qué formatos puedes compartir
          </p>
        </div>
      </div>

      <div style={{ padding: '1.8rem' }}>
        {/* ── Pregunta ── */}
        {!confirmed && (
          <>
            <p
              role="alert"
              style={{
                fontWeight: 400,
                fontSize: '0.9rem',
                color: '#374151',
                marginBottom: '1rem',
              }}
            >
              ¿Cuántos años tienes?
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              {[
                {
                  group: 'adult' as AgeGroup,
                  label: '18 años o más',
                  emoji: '🧑',
                  color: '#ff4500',
                },
                {
                  group: 'minor' as AgeGroup,
                  label: 'Menos de 18 años',
                  emoji: '🌱',
                  color: '#059669',
                },
              ].map((opt) => (
                <button
                  key={opt.group}
                  type="button"
                  onClick={() => handleSelect(opt.group)}
                  style={{
                    padding: '1.1rem',
                    borderRadius: '8px',
                    border:
                      selected === opt.group
                        ? `2px solid ${opt.color}`
                        : '1.5px solid #e5e7eb',
                    background: selected === opt.group ? `${opt.color}0d` : '#fafafa',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
                    {opt.emoji}
                  </div>
                  <p
                    style={{
                      fontWeight: selected === opt.group ? 500 : 400,
                      fontSize: '0.85rem',
                      color: selected === opt.group ? opt.color : '#374151',
                      margin: 0,
                    }}
                  >
                    {opt.label}
                  </p>
                </button>
              ))}
            </div>

            {/* ── Formatos disponibles preview ── */}
            {selected && (
              <>
                <p
                  style={{
                    fontWeight: 400,
                    fontSize: '0.78rem',
                    color: '#6b7280',
                    marginBottom: '0.8rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Formatos disponibles para ti:
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {formats.map((fmt) => (
                    <div
                      key={fmt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.7rem 0.9rem',
                        borderRadius: '6px',
                        background: fmt.allowed ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${fmt.allowed ? '#bbf7d0' : '#fecaca'}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1rem',
                          flexShrink: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {fmt.emoji}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 500,
                              fontSize: '0.83rem',
                              color: fmt.allowed ? '#166534' : '#991b1b',
                            }}
                          >
                            {fmt.label}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              padding: '0.1rem 0.5rem',
                              borderRadius: '10px',
                              background: fmt.allowed ? '#dcfce7' : '#fee2e2',
                              color: fmt.allowed ? '#166534' : '#991b1b',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {fmt.allowed ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                        {fmt.condition && (
                          <p
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              margin: '0.15rem 0 0',
                              fontWeight: 300,
                            }}
                          >
                            {fmt.condition}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Aviso menor ── */}
                {selected === 'minor' && (
                  <div
                    role="alert"
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '0.9rem 1rem',
                      marginBottom: '1.2rem',
                      fontSize: '0.78rem',
                      color: '#92400e',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '0.3rem' }}>
                      ⚠️ Reglas importantes para personas menores de 18 años
                    </strong>
                    No incluyas tu nombre completo, número de teléfono, dirección, nombre
                    de tu colegio ni ningún dato que permita identificarte o localizarte. Tu
                    historia pasará por revisión especial antes de publicarse. Puedes usar
                    un seudónimo.{' '}
                    <a
                      href="/privacidad#s5"
                      style={{ color: '#b45309', fontWeight: 500 }}
                    >
                      Leer política completa →
                    </a>
                  </div>
                )}

                {/* ── Consentimiento explícito (antes de confirmar edad) ── */}
                <div
                  style={{
                    background: 'rgba(255,74,28,0.04)',
                    border: '1px solid rgba(255,74,28,0.15)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginTop: 16,
                    fontSize: 13,
                    color: '#5a6070',
                    lineHeight: 1.7,
                  }}
                >
                  <label
                    htmlFor="age-gate-consent-explicito"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      cursor: 'pointer',
                      margin: 0,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        marginTop: 2,
                        borderRadius: 10,
                        background: '#eef0f4',
                        boxShadow:
                          'inset 3px 3px 6px rgba(163,177,198,0.45), inset -3px -3px 6px rgba(255,255,255,0.95)',
                        border: '1px solid rgba(255,255,255,0.55)',
                      }}
                    >
                      <input
                        id="age-gate-consent-explicito"
                        type="checkbox"
                        checked={consentido}
                        onChange={(e) => setConsentido(e.target.checked)}
                        style={{
                          width: 16,
                          height: 16,
                          margin: 0,
                          accentColor: '#FF4A1C',
                          cursor: 'pointer',
                        }}
                      />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      Al continuar, acepto que:
                      <br />
                      <span style={{ display: 'block', marginTop: 6 }}>
                        — El contenido que subo es de mi autoría o tengo los derechos para compartirlo.
                      </span>
                      <span style={{ display: 'block', marginTop: 4 }}>
                        — AlmaMundi puede publicar mi historia en la plataforma.
                      </span>
                      <span style={{ display: 'block', marginTop: 4 }}>
                        — Mis datos serán tratados según la{' '}
                        <Link
                          href="/privacidad"
                          style={{ color: '#FF4A1C', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2 }}
                        >
                          política de privacidad
                        </Link>
                        .
                      </span>
                    </span>
                  </label>
                </div>

                {/* ── Confirm button ── */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!consentido}
                  autoFocus={Boolean(selected)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    marginTop: 16,
                    borderRadius: '8px',
                    border: 'none',
                    background: consentido ? '#0d0b09' : '#9ca3af',
                    color: '#f5f0e8',
                    fontFamily: SITE_FONT_STACK,
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    letterSpacing: '0.08em',
                    cursor: consentido ? 'pointer' : 'not-allowed',
                    transition: 'background 0.15s',
                    opacity: consentido ? 1 : 0.85,
                  }}
                  onMouseEnter={(e) => {
                    if (!consentido) return;
                    e.currentTarget.style.background = '#1a1612';
                  }}
                  onMouseLeave={(e) => {
                    if (!consentido) return;
                    e.currentTarget.style.background = '#0d0b09';
                  }}
                >
                  Confirmar y continuar →
                </button>
              </>
            )}
          </>
        )}

        {/* ── Confirmed state ── */}
        {confirmed && selected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '0.9rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <div>
              <p
                style={{
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  color: '#166534',
                  margin: 0,
                }}
              >
                Declaración registrada
              </p>
              <p
                style={{
                  fontWeight: 300,
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: '0.1rem 0 0',
                }}
              >
                {selected === 'adult' ? '18 años o más' : 'Menor de 18 años'} ·{' '}
                {formats.filter((f) => f.allowed).length} formatos disponibles ·{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setConfirmed(false);
                    setConsentido(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c9a96e',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  Cambiar
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook para verificar si un formato está permitido según la declaración de edad.
 * Úsalo en el formulario para deshabilitar opciones no disponibles.
 *
 * const { isAllowed } = useFormatoPermitido(ageDeclaration)
 * isAllowed('video') → false si es menor de edad
 */
export function useFormatoPermitido(declaration: AgeDeclaration | null) {
  const isAllowed = (formatoId: FormatoPermitido['id']): boolean => {
    if (!declaration) return false;
    return declaration.allowedFormats.find((f) => f.id === formatoId)?.allowed ?? false;
  };
  const getCondition = (formatoId: FormatoPermitido['id']): string | undefined => {
    return declaration?.allowedFormats.find((f) => f.id === formatoId)?.condition;
  };
  return { isAllowed, getCondition };
}
