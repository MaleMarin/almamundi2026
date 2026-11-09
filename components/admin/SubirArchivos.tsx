'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pencil, RotateCcw, Upload, X } from 'lucide-react';
import { SITE_FONT_STACK } from '@/lib/typography';
import { TemaSelector } from '@/components/admin/TemaSelector';
import { labelTema } from '@/lib/temas';
import {
  CARGA_MAX_FILAS,
  ETIQUETA_TIPO,
  LIMITES,
  leerArchivo,
  type DatosCarga,
  type TipoCarga,
} from '@/lib/cargas/shared';

type Estado = 'revision' | 'publicado' | 'descartado';

type Item = {
  id: string;
  archivo: string;
  fila: number;
  tipo: TipoCarga | null;
  datos: DatosCarga;
  estado: 'revision' | 'publicando' | 'publicado' | 'descartado';
  createdAt: number;
  updatedAt: number;
  errores: string[];
  duplicado: string | null;
  aviso?: string | null;
  preguntaVinculada: string | null;
  publicadoEn?: { coleccion: string; id: string } | null;
  error?: string | null;
};

const DESTINO: Record<TipoCarga, string> = {
  historia: 'Historias contadas y mapa',
  respuesta: 'su pregunta, Respuestas y mapa',
  pregunta: 'Preguntas de las personas',
};

const btn = (tone: 'ok' | 'danger' | 'neutral' | 'accent', disabled = false) =>
  ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 999,
    border:
      tone === 'ok'
        ? '1px solid rgba(34,197,94,0.5)'
        : tone === 'danger'
          ? '1px solid rgba(239,68,68,0.5)'
          : tone === 'accent'
            ? '1px solid #FF4A1C'
            : '1px solid rgba(255,255,255,0.2)',
    background:
      tone === 'ok'
        ? 'rgba(34,197,94,0.2)'
        : tone === 'danger'
          ? 'rgba(239,68,68,0.2)'
          : tone === 'accent'
            ? '#FF4A1C'
            : 'rgba(255,255,255,0.08)',
    color: tone === 'ok' ? '#86efac' : tone === 'danger' ? '#fca5a5' : tone === 'accent' ? '#fff' : 'rgba(255,255,255,0.9)',
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    fontFamily: SITE_FONT_STACK,
  }) as const;

const input = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 14,
  fontFamily: SITE_FONT_STACK,
  boxSizing: 'border-box',
} as const;

const etiqueta = { display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '10px 0 4px' } as const;

function listo(item: Item): boolean {
  return item.estado === 'revision' && !item.errores.length && !item.duplicado;
}

/** Excel en español a veces guarda en Windows-1252: si UTF-8 no calza, se lee así. */
async function leerTexto(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

function Editor({
  item,
  onGuardar,
  onCancelar,
  ocupado,
}: {
  item: Item;
  onGuardar: (tipo: TipoCarga, datos: DatosCarga) => void;
  onCancelar: () => void;
  ocupado: boolean;
}) {
  const [tipo, setTipo] = useState<TipoCarga>(item.tipo ?? 'historia');
  const [d, setD] = useState<DatosCarga>(item.datos);
  const set = (k: keyof DatosCarga, v: string | string[]) => setD((prev) => ({ ...prev, [k]: v }));
  const max = tipo === 'historia' ? LIMITES.historiaMax : tipo === 'respuesta' ? LIMITES.respuestaMax : LIMITES.preguntaMax;
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <label style={etiqueta}>Tipo</label>
      <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCarga)} style={{ ...input, width: 'auto' }}>
        <option value="historia">Historia</option>
        <option value="respuesta">Respuesta</option>
        <option value="pregunta">Pregunta</option>
      </select>
      {tipo === 'historia' && (
        <>
          <label style={etiqueta}>Título</label>
          <input style={input} value={d.titulo} maxLength={LIMITES.tituloMax} onChange={(e) => set('titulo', e.target.value)} />
        </>
      )}
      {tipo === 'respuesta' && (
        <>
          <label style={etiqueta}>Pregunta a la que responde (texto o identificador)</label>
          <input style={input} value={d.pregunta} onChange={(e) => set('pregunta', e.target.value)} />
        </>
      )}
      <label style={etiqueta}>
        {tipo === 'pregunta' ? 'Pregunta' : 'Texto'} ({d.texto.length}/{max})
      </label>
      <textarea
        style={{ ...input, minHeight: tipo === 'pregunta' ? 60 : 140, resize: 'vertical' }}
        value={d.texto}
        onChange={(e) => set('texto', e.target.value)}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <div>
          <label style={etiqueta}>Nombre</label>
          <input style={input} value={d.alias} onChange={(e) => set('alias', e.target.value)} />
        </div>
        <div>
          <label style={etiqueta}>Ciudad</label>
          <input style={input} value={d.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
        </div>
        <div>
          <label style={etiqueta}>País</label>
          <input style={input} value={d.pais} onChange={(e) => set('pais', e.target.value)} />
        </div>
        <div>
          <label style={etiqueta}>Idioma</label>
          <select value={d.idioma} onChange={(e) => set('idioma', e.target.value)} style={input}>
            <option value="es">Español</option>
            <option value="pt">Portugués</option>
            <option value="en">Inglés</option>
          </select>
        </div>
      </div>
      {tipo !== 'pregunta' && <TemaSelector value={d.temas} onChange={(ids) => set('temas', ids)} />}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button type="button" disabled={ocupado} style={btn('ok', ocupado)} onClick={() => onGuardar(tipo, d)}>
          <Check size={16} /> Guardar cambios
        </button>
        <button type="button" disabled={ocupado} style={btn('neutral', ocupado)} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/** Pestaña «Subir archivos»: cargar JSON o CSV, revisar, corregir y aprobar. Nada se publica sin aprobación. */
export default function SubirArchivos({ token }: { token: string }) {
  const [tab, setTab] = useState<Estado>('revision');
  const [items, setItems] = useState<Item[]>([]);
  const [conteo, setConteo] = useState<Record<Estado, number>>({ revision: 0, publicado: 0, descartado: 0 });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState('');
  const [progreso, setProgreso] = useState('');
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  /** Hora de la última lectura: sirve para ver si una publicación quedó interrumpida. */
  const [leidoEn, setLeidoEn] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = useCallback(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cargas?estado=${tab}`, { headers: headers(), cache: 'no-store' });
      const data = (await res.json()) as { items?: Item[]; conteo?: Record<Estado, number>; error?: string };
      if (!res.ok) throw new Error(data.error || 'No se pudo leer la lista.');
      setItems(Array.isArray(data.items) ? data.items : []);
      setLeidoEn(Date.now());
      if (data.conteo) setConteo(data.conteo);
    } catch (err) {
      setItems([]);
      setAviso(err instanceof Error ? err.message : 'No se pudo leer la lista.');
    } finally {
      setLoading(false);
    }
  }, [tab, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const cambiarTab = (next: Estado) => {
    if (next === tab) return;
    setSeleccion(new Set());
    setEditando(null);
    setTab(next);
  };

  const resumen = useMemo(() => {
    const revision = items.filter((i) => i.estado === 'revision');
    return {
      listos: revision.filter(listo).length,
      errores: revision.filter((i) => i.errores.length).length,
      duplicados: revision.filter((i) => !i.errores.length && i.duplicado).length,
    };
  }, [items]);

  const subir = async (files: FileList | null) => {
    if (!files?.length) return;
    setAviso('');
    const mensajes: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const filas = leerArchivo(file.name, await leerTexto(file));
        if (!filas.length) {
          mensajes.push(`«${file.name}»: no tiene registros.`);
          continue;
        }
        if (filas.length > CARGA_MAX_FILAS) {
          mensajes.push(`«${file.name}»: tiene ${filas.length} registros; el máximo es ${CARGA_MAX_FILAS}.`);
          continue;
        }
        setProgreso(`Leyendo «${file.name}»…`);
        const res = await fetch('/api/admin/cargas', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ archivo: file.name, filas }),
        });
        const data = (await res.json().catch(() => ({}))) as { total?: number; error?: string };
        if (!res.ok) throw new Error(data.error || 'No se pudo guardar.');
        mensajes.push(`«${file.name}»: ${data.total} registros listos para revisar. Nada se publicó todavía.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        mensajes.push(
          `«${file.name}»: ${
            msg === 'formato'
              ? 'usa un archivo .json o .csv.'
              : msg === 'json' || err instanceof SyntaxError
                ? 'el JSON no se puede leer. Revisa comas y corchetes.'
                : msg || 'no se pudo leer.'
          }`
        );
      }
    }
    setProgreso('');
    setAviso(mensajes.join(' '));
    if (fileRef.current) fileRef.current.value = '';
    if (tab === 'revision') void load();
    else cambiarTab('revision');
  };

  const accion = async (id: string, body: Record<string, unknown>): Promise<{ ok: boolean; error: string }> => {
    const res = await fetch(`/api/admin/cargas/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    return { ok: res.ok && Boolean(data.ok), error: data.error || 'No se pudo completar la acción.' };
  };

  const aprobar = async (ids: string[]) => {
    if (!ids.length) return;
    const texto =
      ids.length === 1
        ? 'Este registro se publicará en el sitio. ¿Continuar?'
        : `Se publicarán ${ids.length} registros en el sitio. ¿Continuar?`;
    if (!window.confirm(texto)) return;
    setAviso('');
    let ok = 0;
    const fallos: string[] = [];
    for (const [i, id] of ids.entries()) {
      setBusy(id);
      setProgreso(ids.length > 1 ? `Publicando ${i + 1} de ${ids.length}…` : 'Publicando…');
      const r = await accion(id, { accion: 'aprobar' });
      const item = items.find((it) => it.id === id);
      if (r.ok) ok += 1;
      else fallos.push(`fila ${item?.fila ?? '?'} de «${item?.archivo ?? ''}»: ${r.error}`);
    }
    setBusy(null);
    setProgreso('');
    setSeleccion(new Set());
    setAviso(
      [ok ? `${ok} ${ok === 1 ? 'registro publicado' : 'registros publicados'}.` : '', fallos.length ? `No se publicó: ${fallos.join(' · ')}` : '']
        .filter(Boolean)
        .join(' ')
    );
    await load();
  };

  const descartar = async (ids: string[]) => {
    if (!ids.length) return;
    if (ids.length > 1 && !window.confirm(`¿Descartar ${ids.length} registros? Puedes devolverlos a revisión después.`)) return;
    for (const id of ids) {
      setBusy(id);
      await accion(id, { accion: 'descartar' });
    }
    setBusy(null);
    setSeleccion(new Set());
    await load();
  };

  const restaurar = async (id: string) => {
    setBusy(id);
    const r = await accion(id, { accion: 'restaurar' });
    setBusy(null);
    if (!r.ok) setAviso(r.error);
    await load();
  };

  const guardar = async (id: string, tipo: TipoCarga, datos: DatosCarga) => {
    setBusy(id);
    const r = await accion(id, { accion: 'editar', tipo, datos });
    setBusy(null);
    if (!r.ok) {
      setAviso(r.error);
      return;
    }
    setEditando(null);
    await load();
  };

  const listosIds = items.filter(listo).map((i) => i.id);
  const seleccionados = [...seleccion].filter((id) => items.some((i) => i.id === id && i.estado === 'revision'));
  const seleccionadosListos = seleccionados.filter((id) => listosIds.includes(id));
  const trabajando = Boolean(busy) || Boolean(progreso);

  const toggle = (id: string) =>
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: SITE_FONT_STACK }}>
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          border: '1px dashed rgba(255,255,255,0.25)',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
          Sube archivos JSON o CSV con historias, respuestas o preguntas. Quedan aquí para revisar: solo se publican
          cuando los apruebas.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          multiple
          disabled={trabajando}
          onChange={(e) => void subir(e.target.files)}
          style={{ display: 'none' }}
          id="subir-archivos-input"
        />
        <label htmlFor="subir-archivos-input" style={btn('accent', trabajando)}>
          <Upload size={16} /> Elegir archivos
        </label>
        <details style={{ marginTop: 14 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Formato de los archivos</summary>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginTop: 8 }}>
            <p style={{ margin: '0 0 6px' }}>
              Columnas (CSV) o campos (JSON): <b>tipo</b> (historia, respuesta o pregunta), <b>titulo</b>, <b>texto</b>,{' '}
              <b>pregunta</b>, <b>nombre</b>, <b>ciudad</b>, <b>pais</b>, <b>temas</b> e <b>idioma</b> (es, pt o en; si falta,
              es español).
            </p>
            <p style={{ margin: '0 0 6px' }}>
              Historia: titulo, texto (hasta {LIMITES.historiaMax} caracteres), nombre, ciudad, pais y de 1 a 3 temas.
              Respuesta: pregunta (escrita igual que en el sitio), texto (hasta {LIMITES.respuestaMax}), nombre, ciudad,
              pais y de 1 a 3 temas. Pregunta: texto (de {LIMITES.preguntaMin} a {LIMITES.preguntaMax}), nombre, ciudad y
              pais.
            </p>
            <p style={{ margin: 0 }}>
              Los temas se escriben con su nombre, separados por punto y coma (por ejemplo «infancia; familia»). Un JSON
              puede ser una lista de registros o tener las listas «historias», «respuestas» y «preguntas».
            </p>
          </div>
        </details>
      </div>

      {(aviso || progreso) && (
        <p
          role="status"
          style={{
            margin: 0,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {progreso || aviso}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(
          [
            ['revision', 'Por revisar'],
            ['publicado', 'Publicados'],
            ['descartado', 'Descartados'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => cambiarTab(id)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.14)',
              background: tab === id ? 'rgba(255,74,28,0.2)' : 'rgba(255,255,255,0.04)',
              color: tab === id ? '#FF6E49' : 'rgba(255,255,255,0.8)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: SITE_FONT_STACK,
            }}
          >
            {label} ({conteo[id] ?? 0})
          </button>
        ))}
      </div>

      {tab === 'revision' && items.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            {resumen.listos} listos · {resumen.errores} con errores · {resumen.duplicados} duplicados
          </span>
          <button
            type="button"
            disabled={trabajando || !listosIds.length}
            style={btn('neutral', trabajando || !listosIds.length)}
            onClick={() =>
              setSeleccion(seleccionadosListos.length === listosIds.length ? new Set() : new Set(listosIds))
            }
          >
            {seleccionadosListos.length === listosIds.length && listosIds.length ? 'Quitar selección' : 'Seleccionar los listos'}
          </button>
          <button
            type="button"
            disabled={trabajando || !seleccionadosListos.length}
            style={btn('ok', trabajando || !seleccionadosListos.length)}
            onClick={() => void aprobar(seleccionadosListos)}
          >
            <Check size={16} /> Aprobar y publicar ({seleccionadosListos.length})
          </button>
          <button
            type="button"
            disabled={trabajando || !seleccionados.length}
            style={btn('danger', trabajando || !seleccionados.length)}
            onClick={() => void descartar(seleccionados)}
          >
            <X size={16} /> Descartar ({seleccionados.length})
          </button>
        </div>
      )}

      {loading && <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 30 }}>Cargando…</p>}
      {!loading && !items.length && (
        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 30 }}>
          {tab === 'revision' ? 'No hay registros por revisar.' : 'No hay registros aquí.'}
        </p>
      )}

      {!loading &&
        items.map((item) => {
          const ok = listo(item);
          const publicando = item.estado === 'publicando';
          const trabado = publicando && leidoEn - item.updatedAt > 180_000;
          const abierto = abiertos.has(item.id);
          const largo = item.datos.texto.length > 320;
          const estadoColor = publicando
            ? '#93c5fd'
            : item.errores.length
              ? '#fca5a5'
              : item.duplicado
                ? '#fcd34d'
                : '#86efac';
          const estadoTexto = publicando
            ? 'Publicándose'
            : item.errores.length
              ? 'Con errores'
              : item.duplicado
                ? 'Duplicado'
                : 'Listo';
          return (
            <article
              key={item.id}
              style={{
                padding: 16,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${item.estado === 'revision' && !ok ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                {item.estado === 'revision' && (
                  <input
                    type="checkbox"
                    checked={seleccion.has(item.id)}
                    onChange={() => toggle(item.id)}
                    aria-label={`Seleccionar fila ${item.fila}`}
                    style={{ width: 18, height: 18, accentColor: '#FF4A1C' }}
                  />
                )}
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,74,28,0.18)',
                    color: '#FF6E49',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {item.tipo ? ETIQUETA_TIPO[item.tipo] : 'Sin tipo'}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  Fila {item.fila} · {item.archivo}
                </span>
                {tab === 'revision' && (
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: estadoColor }}>{estadoTexto}</span>
                )}
                {item.estado === 'publicado' && item.tipo && (
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#86efac' }}>Publicado en {DESTINO[item.tipo]}</span>
                )}
              </div>

              {item.tipo === 'historia' && item.datos.titulo && (
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600 }}>{item.datos.titulo}</h3>
              )}
              {item.tipo === 'respuesta' && (
                <p style={{ margin: '0 0 6px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  Responde a: {item.preguntaVinculada || item.datos.pregunta || '—'}
                </p>
              )}
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 14,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  color: 'rgba(255,255,255,0.88)',
                }}
              >
                {largo && !abierto ? `${item.datos.texto.slice(0, 320)}…` : item.datos.texto || '—'}
              </p>
              {largo && (
                <button
                  type="button"
                  onClick={() =>
                    setAbiertos((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                  style={{ background: 'none', border: 0, color: '#FF6E49', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 8 }}
                >
                  {abierto ? 'Ver menos' : 'Ver todo'}
                </button>
              )}
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                {[item.datos.alias, [item.datos.ciudad, item.datos.pais].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || '—'}
                {item.datos.temas.length > 0 && ` · ${item.datos.temas.map((t) => labelTema(t, 'es')).join(', ')}`}
                {item.datos.idioma !== 'es' && ` · ${item.datos.idioma.toUpperCase()}`}
              </p>

              {item.estado === 'revision' && (item.errores.length > 0 || item.duplicado || item.aviso || item.error) && (
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
                  {item.errores.map((e) => (
                    <li key={e} style={{ color: '#fca5a5' }}>
                      {e}
                    </li>
                  ))}
                  {item.duplicado && <li style={{ color: '#fcd34d' }}>{item.duplicado}</li>}
                  {item.aviso && <li style={{ color: '#93c5fd' }}>{item.aviso}</li>}
                  {item.error && !item.errores.length && (
                    <li style={{ color: '#fca5a5' }}>Último intento: {item.error}</li>
                  )}
                </ul>
              )}

              {editando === item.id ? (
                <Editor
                  item={item}
                  ocupado={busy === item.id}
                  onCancelar={() => setEditando(null)}
                  onGuardar={(tipo, datos) => void guardar(item.id, tipo, datos)}
                />
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {item.estado === 'revision' && (
                    <>
                      <button
                        type="button"
                        disabled={trabajando || !ok}
                        style={btn('ok', trabajando || !ok)}
                        onClick={() => void aprobar([item.id])}
                      >
                        <Check size={16} /> Aprobar y publicar
                      </button>
                      <button type="button" disabled={trabajando} style={btn('neutral', trabajando)} onClick={() => setEditando(item.id)}>
                        <Pencil size={16} /> Corregir
                      </button>
                      <button type="button" disabled={trabajando} style={btn('danger', trabajando)} onClick={() => void descartar([item.id])}>
                        <X size={16} /> Descartar
                      </button>
                    </>
                  )}
                  {(item.estado === 'descartado' || trabado) && (
                    <button type="button" disabled={trabajando} style={btn('neutral', trabajando)} onClick={() => void restaurar(item.id)}>
                      <RotateCcw size={16} /> Devolver a revisión
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
    </div>
  );
}
