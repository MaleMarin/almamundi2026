'use client';

import type { CSSProperties } from 'react';
import type { AlmaLocale } from '@/lib/i18n/locale';
import {
  REJECTION_REASON_DETAIL_MAX,
  REJECTION_REASON_OPTIONS,
  senderLocaleName,
} from '@/lib/editorial/rejection-reasons';

export function RejectionReasonFields({
  locale,
  reasonId,
  detail,
  disabled,
  onReasonId,
  onDetail,
  tone = 'dark',
}: {
  locale: AlmaLocale;
  reasonId: string;
  detail: string;
  disabled?: boolean;
  onReasonId: (id: string) => void;
  onDetail: (value: string) => void;
  tone?: 'dark' | 'light';
}) {
  const language = senderLocaleName(locale);
  const dark = tone === 'dark';
  const fieldStyle: CSSProperties = dark
    ? {
        width: '100%',
        marginTop: 4,
        padding: '8px 12px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(0,0,0,0.25)',
        color: 'white',
        fontSize: 13,
        fontFamily: 'inherit',
      }
    : {
        width: '100%',
        marginTop: 4,
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: '#fff',
        color: '#111827',
        fontSize: 14,
        fontFamily: 'inherit',
      };

  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.7)' : '#4b5563' }}>
        Motivo del rechazo
        <select
          value={reasonId}
          disabled={disabled}
          onChange={(event) => onReasonId(event.target.value)}
          style={fieldStyle}
        >
          <option value="">Elegir motivo…</option>
          {REJECTION_REASON_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id} style={{ color: '#111' }}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      {reasonId === 'other' ? (
        <>
          <p style={{ margin: 0, fontSize: 12, color: dark ? '#fbbf24' : '#92400e' }}>
            Idioma de quien envió: {language}
          </p>
          <textarea
            value={detail}
            disabled={disabled}
            maxLength={REJECTION_REASON_DETAIL_MAX}
            rows={3}
            onChange={(event) => onDetail(event.target.value)}
            placeholder={`Escríbelo en ${language}`}
            style={{ ...fieldStyle, marginTop: 0, resize: 'vertical' }}
          />
        </>
      ) : null}
    </div>
  );
}
