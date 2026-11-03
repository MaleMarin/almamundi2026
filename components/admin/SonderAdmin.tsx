'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type Sub = { email: string; estado: string; idioma: string; origen: string; desde: string };

const ESTADO: Record<string, string> = { confirmed: 'Confirmado', pending: 'Sin confirmar', unsubscribed: 'Se dio de baja' };

/** Pestaña «Sonder»: suscriptores de la newsletter y descarga de los confirmados. */
export default function SonderAdmin({ token }: { token: string }) {
  const [items, setItems] = useState<Sub[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch('/api/admin/sonder', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: Sub[] }) => setItems(Array.isArray(data.items) ? data.items : []))
      .catch(() => setItems([]));
  }, [token]);

  async function descargar() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/sonder?format=csv', { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sonder-suscriptores.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  const lista = items ?? [];
  const confirmados = lista.filter((s) => s.estado === 'confirmed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: '#fff' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 16 }}>
          {items === null ? 'Cargando…' : `${confirmados} suscripciones confirmadas · ${lista.length} en total`}
        </p>
        <button
          type="button"
          onClick={() => void descargar()}
          disabled={busy || confirmados === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)', background: '#FF4A1C', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: busy || confirmados === 0 ? 0.6 : 1 }}
        >
          <Download size={16} /> Descargar confirmados (CSV)
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
        Solo quienes confirmaron su correo deben recibir Sonder. La descarga incluye solo a esas personas.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.7)' }}>
              <th style={{ padding: 8 }}>Correo</th>
              <th style={{ padding: 8 }}>Estado</th>
              <th style={{ padding: 8 }}>Idioma</th>
              <th style={{ padding: 8 }}>Desde</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((s) => (
              <tr key={s.email} style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <td style={{ padding: 8 }}>{s.email}</td>
                <td style={{ padding: 8 }}>{ESTADO[s.estado] ?? s.estado}</td>
                <td style={{ padding: 8 }}>{s.idioma.toUpperCase()}</td>
                <td style={{ padding: 8 }}>{s.desde ? new Date(s.desde).toLocaleDateString('es-CL') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items !== null && lista.length === 0 ? <p style={{ marginTop: 12 }}>Todavía no hay suscripciones.</p> : null}
      </div>
    </div>
  );
}
