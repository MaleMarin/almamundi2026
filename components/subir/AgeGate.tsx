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

// ─── Identidad visual AlmaMundi ─────────────────────────────────────────────
const FONT_DISPLAY = 'var(--font-bebas), Impact, "Arial Narrow", sans-serif';
const FONT_EDITORIAL = 'var(--font-instrument), Georgia, "Times New Roman", serif';
const FONT_UI = 'var(--font-syne), system-ui, -apple-system, sans-serif';

const BRAND_BLACK = '#0A0C12';
const BRAND_BLUE = '#023661';
const BRAND_ORANGE = '#DB5227';
const BRAND_CREAM = '#F5F2EC';

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
        background: BRAND_CREAM,
        color: BRAND_BLACK,
        padding: '2.75rem 2.5rem 2.25rem',
        borderTop: `1px solid ${BRAND_BLACK}14`,
        borderBottom: `1px solid ${BRAND_BLACK}14`,
        borderRadius: 0,
      }}
    >
      {/* ── Header editorial ── */}
      <header style={{ marginBottom: '2rem' }}>
        <p
          style={{
            fontFamily: FONT_UI,
            fontSize: '0.68rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: `${BRAND_BLUE}AA`,
            margin: 0,
            fontWeight: 500,
          }}
        >
          — Declaración previa
        </p>
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            lineHeight: 0.95,
            letterSpacing: '0.005em',
            color: BRAND_BLACK,
            margin: '0.7rem 0 0.9rem',
            fontWeight: 400,
          }}
        >
          Antes de empezar
        </h2>
        <p
          style={{
            fontFamily: FONT_EDITORIAL,
            fontStyle: 'italic',
            fontSize: '1.0625rem',
            lineHeight: 1.55,
            color: `${BRAND_BLACK}A6`,
            margin: 0,
            maxWidth: '44ch',
          }}
        >
          Necesitamos saber tu edad para mostrarte los formatos que puedes
          compartir en AlmaMundi.
        </p>
      </header>

      <hr
        style={{
          border: 0,
          borderTop: `1px solid ${BRAND_BLACK}1F`,
          margin: '0 0 1.75rem',
        }}
      />

      {!confirmed && (
        <>
          {/* ── Pregunta ── */}
          <p
            role="alert"
            style={{
              fontFamily: FONT_UI,
              fontSize: '0.68rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: `${BRAND_BLACK}80`,
              margin: '0 0 1.1rem',
              fontWeight: 500,
            }}
          >
            ¿Cuántos años tienes?
          </p>

          {/* ── Selector edad ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
              marginBottom: '2.5rem',
              borderTop: `1px solid ${BRAND_BLACK}1F`,
            }}
          >
            {[
              {
                group: 'adult' as AgeGroup,
                numeral: '01',
                label: '18 años o más',
              },
              {
                group: 'minor' as AgeGroup,
                numeral: '02',
                label: 'Menos de 18 años',
              },
            ].map((opt, idx) => {
              const isSelected = selected === opt.group;
              return (
                <button
                  key={opt.group}
                  type="button"
                  onClick={() => handleSelect(opt.group)}
                  aria-pressed={isSelected}
                  style={{
                    background: 'transparent',
                    border: 0,
                    borderBottom: isSelected
                      ? `2px solid ${BRAND_ORANGE}`
                      : `1px solid ${BRAND_BLACK}1F`,
                    borderLeft: idx === 1 ? `1px solid ${BRAND_BLACK}14` : 0,
                    padding: '1.5rem 1.25rem 1.4rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: BRAND_BLACK,
                    transition:
                      'border-color 0.2s ease, color 0.2s ease, background 0.2s ease',
                    borderRadius: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontFamily: FONT_DISPLAY,
                      fontSize: '2.5rem',
                      lineHeight: 1,
                      letterSpacing: '0.02em',
                      color: isSelected ? BRAND_ORANGE : `${BRAND_BLACK}26`,
                      transition: 'color 0.2s ease',
                      fontWeight: 400,
                    }}
                  >
                    {opt.numeral}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: FONT_EDITORIAL,
                      fontStyle: 'italic',
                      fontSize: '1.0625rem',
                      marginTop: '0.6rem',
                      color: isSelected ? BRAND_BLACK : `${BRAND_BLACK}99`,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Formatos disponibles ── */}
          {selected && (
            <>
              <p
                style={{
                  fontFamily: FONT_UI,
                  fontSize: '0.68rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: `${BRAND_BLUE}AA`,
                  margin: '0 0 1rem',
                  fontWeight: 500,
                }}
              >
                — Formatos disponibles para ti
              </p>

              <ul
                style={{
                  listStyle: 'none',
                  margin: '0 0 2rem',
                  padding: 0,
                  borderTop: `1px solid ${BRAND_BLACK}14`,
                }}
              >
                {formats.map((fmt) => (
                  <li
                    key={fmt.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5rem 1fr',
                      gap: '0.9rem',
                      alignItems: 'baseline',
                      padding: '1rem 0',
                      borderBottom: `1px solid ${BRAND_BLACK}14`,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: '1.4rem',
                        lineHeight: 1,
                        color: fmt.allowed ? BRAND_ORANGE : `${BRAND_BLACK}33`,
                        textAlign: 'center',
                      }}
                    >
                      {fmt.allowed ? '·' : '—'}
                    </span>
                    <div>
                      <span
                        style={{
                          fontFamily: FONT_EDITORIAL,
                          fontStyle: 'italic',
                          fontSize: '1.15rem',
                          color: fmt.allowed ? BRAND_BLACK : `${BRAND_BLACK}59`,
                          textDecoration: fmt.allowed ? 'none' : 'line-through',
                          textDecorationColor: `${BRAND_BLACK}33`,
                          textDecorationThickness: '1px',
                        }}
                      >
                        {fmt.label}
                      </span>
                      {fmt.condition && (
                        <p
                          style={{
                            fontFamily: FONT_UI,
                            fontSize: '0.7rem',
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: `${BRAND_BLUE}A6`,
                            margin: '0.45rem 0 0',
                            fontWeight: 500,
                            lineHeight: 1.55,
                          }}
                        >
                          {fmt.condition}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* ── Aviso menor ── */}
              {selected === 'minor' && (
                <aside
                  role="alert"
                  style={{
                    borderLeft: `2px solid ${BRAND_BLUE}`,
                    padding: '0.35rem 0 0.35rem 1.25rem',
                    marginBottom: '2rem',
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONT_UI,
                      fontSize: '0.68rem',
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: BRAND_BLUE,
                      margin: '0 0 0.65rem',
                      fontWeight: 600,
                    }}
                  >
                    Reglas para personas menores de 18
                  </p>
                  <p
                    style={{
                      fontFamily: FONT_EDITORIAL,
                      fontStyle: 'italic',
                      fontSize: '1rem',
                      lineHeight: 1.65,
                      color: `${BRAND_BLACK}CC`,
                      margin: 0,
                    }}
                  >
                    No incluyas tu nombre completo, número de teléfono,
                    dirección, nombre de tu colegio ni ningún dato que permita
                    identificarte o localizarte. Tu historia pasará por
                    revisión especial antes de publicarse. Puedes usar un
                    seudónimo.{' '}
                    <a
                      href="/privacidad#s5"
                      style={{
                        color: BRAND_ORANGE,
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                        fontWeight: 500,
                      }}
                    >
                      Leer política completa →
                    </a>
                  </p>
                </aside>
              )}

              {/* ── Consentimiento explícito ── */}
              <div
                id="age-gate-consent-explicito-bloque"
                style={{
                  borderTop: `1px solid ${BRAND_BLACK}14`,
                  padding: '1.5rem 0 0',
                  marginBottom: '1.5rem',
                }}
              >
                <label
                  htmlFor="age-gate-consent-explicito"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.9rem',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input
                    id="age-gate-consent-explicito"
                    type="checkbox"
                    checked={consentido}
                    onChange={(e) => setConsentido(e.target.checked)}
                    style={{
                      flexShrink: 0,
                      width: '1.05rem',
                      height: '1.05rem',
                      margin: '0.35rem 0 0',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      border: `1px solid ${
                        consentido ? BRAND_ORANGE : `${BRAND_BLACK}66`
                      }`,
                      borderRadius: 0,
                      background: consentido ? BRAND_ORANGE : 'transparent',
                      cursor: 'pointer',
                      transition:
                        'background 0.15s ease, border-color 0.15s ease',
                      backgroundImage: consentido
                        ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 10' fill='none' stroke='%23F5F2EC' stroke-width='2' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpath d='M1.5 5 L4.5 8 L10.5 1.5'/%3E%3C/svg%3E\")"
                        : 'none',
                      backgroundSize: '72% 72%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontFamily: FONT_EDITORIAL,
                      fontStyle: 'italic',
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      color: `${BRAND_BLACK}B3`,
                    }}
                  >
                    Al continuar, acepto que:
                    <span style={{ display: 'block', marginTop: '0.55rem' }}>
                      — El contenido que subo es de mi autoría o tengo los
                      derechos para compartirlo.
                    </span>
                    <span style={{ display: 'block', marginTop: '0.3rem' }}>
                      — AlmaMundi puede publicar mi historia en la plataforma.
                    </span>
                    <span style={{ display: 'block', marginTop: '0.3rem' }}>
                      — Mis datos serán tratados según la{' '}
                      <Link
                        href="/privacidad"
                        style={{
                          color: BRAND_ORANGE,
                          textDecoration: 'underline',
                          textUnderlineOffset: 3,
                          fontWeight: 500,
                        }}
                      >
                        política de privacidad
                      </Link>
                      .
                    </span>
                  </span>
                </label>
              </div>

              {/* ── Botón confirmar ── */}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!consentido}
                autoFocus={Boolean(selected)}
                aria-describedby="age-gate-consent-explicito-bloque"
                style={{
                  width: '100%',
                  padding: '1.15rem 1.5rem',
                  border: consentido ? 'none' : `1px solid ${BRAND_BLACK}33`,
                  background: consentido ? BRAND_ORANGE : 'transparent',
                  color: consentido ? BRAND_CREAM : `${BRAND_BLACK}66`,
                  fontFamily: FONT_UI,
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  cursor: consentido ? 'pointer' : 'not-allowed',
                  transition:
                    'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  borderRadius: 0,
                }}
                onMouseEnter={(e) => {
                  if (!consentido) return;
                  e.currentTarget.style.background = BRAND_BLACK;
                }}
                onMouseLeave={(e) => {
                  if (!consentido) return;
                  e.currentTarget.style.background = BRAND_ORANGE;
                }}
              >
                Confirmar y continuar →
              </button>
            </>
          )}
        </>
      )}

      {/* ── Estado confirmado ── */}
      {confirmed && selected && (
        <div
          style={{
            borderTop: `1px solid ${BRAND_BLACK}14`,
            borderBottom: `1px solid ${BRAND_BLACK}14`,
            padding: '1.4rem 0',
          }}
        >
          <p
            style={{
              fontFamily: FONT_UI,
              fontSize: '0.68rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: BRAND_ORANGE,
              margin: '0 0 0.55rem',
              fontWeight: 600,
            }}
          >
            — Edad declarada
          </p>
          <p
            style={{
              fontFamily: FONT_EDITORIAL,
              fontStyle: 'italic',
              fontSize: '1.0625rem',
              color: BRAND_BLACK,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {selected === 'adult' ? '18 años o más' : 'Menor de 18 años'}
            <span style={{ color: `${BRAND_BLACK}40`, margin: '0 0.55rem' }}>
              ·
            </span>
            {formats.filter((f) => f.allowed).length} formatos disponibles
            <span style={{ color: `${BRAND_BLACK}40`, margin: '0 0.55rem' }}>
              ·
            </span>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setConfirmed(false);
                setConsentido(false);
              }}
              style={{
                background: 'none',
                border: 0,
                color: BRAND_ORANGE,
                cursor: 'pointer',
                fontFamily: FONT_UI,
                fontSize: '0.7rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 600,
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Cambiar
            </button>
          </p>
        </div>
      )}
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
