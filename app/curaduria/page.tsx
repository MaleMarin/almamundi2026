'use client';

/**
 * Página de curaduría: listar envíos pendientes y publicarlos.
 * Requiere ADMIN_PUBLISH_TOKEN en .env.local y usarlo aquí para autorizar.
 */
import { useCallback, useEffect, useState } from 'react';

type Submission = {
  id: string;
  title: string;
  placeLabel: string;
  authorEmail?: string;
  authorName?: string;
  format: string;
  status: string;
  createdAt: string | null;
  text?: string;
  media?: { videoUrl?: string; imageUrl?: string; audioUrl?: string };
  lat?: number;
  lng?: number;
};

const STORAGE_KEY = 'almamundi_curaduria_token';

export default function CuraduriaPage() {
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [list, setList] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) setTokenInput(saved);
  }, []);

  const load = useCallback(async () => {
    const t = token || tokenInput.trim();
    if (!t) {
      setError('Introduce el token de curaduría.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/curate/submissions?status=pending', {
        headers: { 'x-admin-token': t },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No autorizado. Revisa el token.');
        setList([]);
        return;
      }
      setList(data.submissions || []);
      if (t && typeof sessionStorage !== 'undefined') sessionStorage.setItem(STORAGE_KEY, t);
      setToken(t);
    } catch (e) {
      setError('Error de conexión.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [token, tokenInput]);

  const publish = useCallback(async (submissionId: string) => {
    const t = token || tokenInput.trim();
    if (!t) return;
    setPublishingId(submissionId);
    setError('');
    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': t },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Error al publicar.');
        return;
      }
      setList((prev) => prev.filter((s) => s.id !== submissionId));
    } catch {
      setError('Error de conexión.');
    } finally {
      setPublishingId(null);
    }
  }, [token, tokenInput]);

  return (
    <main className="min-h-screen bg-[#0a0f24] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Curaduría Alma Mundi</h1>
        <p className="text-white/70 text-sm mb-6">
          Lista envíos pendientes y publícalos para que aparezcan en el mapa.
        </p>

        {!token ? (
          <div className="mb-6">
            <label className="block text-sm font-bold text-white/80 mb-2">Token de curaduría (ADMIN_PUBLISH_TOKEN)</label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Pega aquí el token"
              className="w-full max-w-md px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40"
            />
            <button
              type="button"
              onClick={load}
              className="mt-3 px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-sm"
            >
              Cargar envíos pendientes
            </button>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold disabled:opacity-50"
            >
              {loading ? 'Cargando…' : 'Actualizar lista'}
            </button>
            <button
              type="button"
              onClick={() => { setToken(''); setTokenInput(''); sessionStorage.removeItem(STORAGE_KEY); setList([]); }}
              className="text-white/60 hover:text-white text-sm"
            >
              Cerrar sesión (borrar token)
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
            {error}
          </div>
        )}

        {list.length === 0 && !loading && token && (
          <p className="text-white/60">No hay envíos pendientes.</p>
        )}

        <ul className="space-y-6">
          {list.map((s) => (
            <li
              key={s.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white">{s.title || 'Sin título'}</div>
                  <div className="text-sm text-white/60 mt-1">
                    {s.placeLabel || '—'} · {s.format} · {s.authorEmail || '—'}
                    {((s.lat == null || s.lng == null) && s.placeLabel) && (
                      <span className="ml-2 text-amber-400">· Falta lat/lng en Firestore</span>
                    )}
                  </div>
                  {s.text && (
                    <div className="mt-3 p-3 rounded-xl bg-black/20 text-sm text-white/90 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {s.text}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3">
                    {s.media?.videoUrl && (
                      <div className="rounded-xl overflow-hidden bg-black/30 max-w-xs">
                        <p className="text-xs text-white/60 px-2 py-1">Vídeo</p>
                        <video src={s.media.videoUrl} controls className="w-full max-h-40" preload="metadata">
                          Tu navegador no soporta vídeo.
                        </video>
                      </div>
                    )}
                    {s.media?.imageUrl && (
                      <div className="rounded-xl overflow-hidden bg-black/30 max-w-xs">
                        <p className="text-xs text-white/60 px-2 py-1">Foto</p>
                        <img src={s.media.imageUrl} alt="" className="w-full max-h-48 object-contain" />
                      </div>
                    )}
                    {s.media?.audioUrl && (
                      <div className="rounded-xl overflow-hidden bg-black/30 max-w-xs p-2">
                        <p className="text-xs text-white/60 mb-1">Audio</p>
                        <audio src={s.media.audioUrl} controls className="w-full max-w-sm" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => publish(s.id)}
                    disabled={publishingId === s.id || (s.lat == null || s.lng == null)}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-sm disabled:opacity-50"
                    title={s.lat == null || s.lng == null ? 'Añade lat y lng en Firestore para publicar en el mapa' : undefined}
                  >
                    {publishingId === s.id ? 'Publicando…' : 'Publicar en mapa'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
