'use client';

import { useEffect, useState } from 'react';
import { SITE_FONT_STACK } from '@/lib/typography';

export type SenderInfo = {
  alias: string;
  country: string;
  city: string;
  age: string;
  gender: string;
  email: string;
  profilePhotoUrl?: string;
  profilePhotoPath?: string;
  profilePhotoHeic?: boolean;
};

export type ConsentInfo = {
  label: string;
  accepted: boolean;
  at: number | null;
};

const labelStyle = {
  margin: '0 0 2px',
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.55)',
} as const;

const valueStyle = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.45,
  color: 'rgba(255,255,255,0.88)',
} as const;

function dash(value: string | null | undefined): string {
  const text = value?.trim() ?? '';
  return text || '—';
}

function formatWhen(ms: number): string {
  try {
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago',
    }).format(new Date(ms));
  } catch {
    return '';
  }
}

function ProfilePhoto({
  sender,
  token,
}: {
  sender: SenderInfo;
  token?: string | null;
}) {
  const [src, setSrc] = useState(sender.profilePhotoHeic ? '' : sender.profilePhotoUrl || '');

  useEffect(() => {
    if (!sender.profilePhotoHeic || !sender.profilePhotoPath || !token) return;
    let objectUrl = '';
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/stories/heic?path=${encodeURIComponent(sender.profilePhotoPath || '')}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) return;
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setSrc(objectUrl);
      } catch {
        /* Sin foto visible. */
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sender.profilePhotoHeic, sender.profilePhotoPath, token]);

  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, display: 'block', marginTop: 8 }}
    />
  );
}

export function SenderConsentBlocks({
  sender,
  consents,
  consentTextsVersion,
  token,
}: {
  sender?: SenderInfo | null;
  consents?: ConsentInfo[] | null;
  consentTextsVersion?: string | null;
  token?: string | null;
}) {
  const person = sender ?? {
    alias: '',
    country: '',
    city: '',
    age: '',
    gender: '',
    email: '',
  };
  const rows = consents ?? [];
  const lines: Array<[string, string]> = [
    ['Alias', person.alias],
    ['País', person.country],
    ['Ciudad', person.city],
    ['Edad', person.age],
    ['Género', person.gender],
    ['Correo', person.email],
  ];

  return (
    <div style={{ marginTop: 12, fontFamily: SITE_FONT_STACK }}>
      <p style={labelStyle}>Datos de quien envía</p>
      {lines.map(([name, value]) => (
        <p key={name} style={{ ...valueStyle, marginTop: 2 }}>
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{name}: </span>
          {dash(value)}
        </p>
      ))}
      <ProfilePhoto sender={person} token={token} />
      <p style={{ ...labelStyle, marginTop: 12 }}>Consentimientos</p>
      {rows.map((row) => (
        <p key={row.label} style={{ ...valueStyle, marginTop: 2 }}>
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{row.label}: </span>
          {row.accepted ? (
            `Aceptado${row.at ? `, ${formatWhen(row.at)}` : ''}`
          ) : (
            <span style={{ color: '#fbbf24' }}>No registrado</span>
          )}
        </p>
      ))}
      <p style={{ ...valueStyle, marginTop: 2 }}>
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>Versión de los textos: </span>
        {consentTextsVersion?.trim() ? (
          consentTextsVersion
        ) : (
          <span style={{ color: '#fbbf24' }}>No registrado</span>
        )}
      </p>
    </div>
  );
}
