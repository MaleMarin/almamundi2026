/**
 * Neumorfismo fuerte para páginas /historias y /temas.
 * Misma paleta que home (soft UI) pero sombras más marcadas.
 */
export const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

export const neu = {
  APP_FONT: `'Avenir Light', Avenir, sans-serif`,
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  orange: '#E8490A',
  gold: '#C4A035',
  /** Card elevada (relieve hacia fuera) */
  card: {
    position: 'relative' as const,
    backgroundColor: '#E0E5EC',
    boxShadow:
      '14px 14px 28px rgba(163,177,198,0.65), -14px -14px 28px rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '24px',
  },
  /** Card hundida (inset) */
  cardInset: {
    backgroundColor: '#E0E5EC',
    boxShadow:
      'inset 8px 8px 14px rgba(163,177,198,0.7), inset -8px -8px 14px rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '20px',
  },
  /** Botón / CTA */
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow:
      '10px 10px 20px rgba(163,177,198,0.6), -10px -10px 20px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    fontFamily: APP_FONT,
  },
  /** Badge "En el mapa" */
  badge: {
    backgroundColor: '#E0E5EC',
    boxShadow:
      'inset 4px 4px 8px rgba(163,177,198,0.6), inset -4px -4px 8px rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '9999px',
  },
} as const;
