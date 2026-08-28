'use client';

/**
 * Curaduría: mismo modelo de auth que /admin (Firebase + allowlist en adminEmails).
 */
import { useCallback, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import { isAdminEmail } from '@/lib/adminEmails';
import { hardNavigateTo } from '@/lib/home-hard-nav';
import {
  REJECTION_REASON_DETAIL_MAX,
  REJECTION_REASON_OPTIONS,
  resolvePublicRejectionText,
} from '@/lib/editorial/rejection-reasons';

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

export default function CuraduriaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [list, setList] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [lastMailNotice, setLastMailNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setIdToken(null);
        setAuthLoading(false);
        setList([]);
        return;
      }
      const token = await u.getIdToken();
      setIdToken(token);
      if (!isAdminEmail(u.email ?? null)) {
        if (auth) await signOut(auth);
        setIdToken(null);
        setUser(null);
        setLoginError('Este usuario no tiene permisos de curación.');
        setAuthLoading(false);
        return;
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const authHeaders = useCallback((): HeadersInit => {
    if (!idToken) return {};
    return { Authorization: `Bearer ${idToken}` };
  }, [idToken]);

  const load = useCallback(async () => {
    if (!idToken) {
      setError('Inicia sesión para continuar.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/curate/submissions?status=pending', {
        headers: { ...authHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No autorizado.');
        setList([]);
        return;
      }
      setList(data.submissions || []);
    } catch {
      setError('Error de conexión.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [idToken, authHeaders]);

  useEffect(() => {
    if (idToken && user && isAdminEmail(user.email ?? null)) {
      void load();
    }
  }, [idToken, user, load]);

  const publish = useCallback(
    async (submissionId: string) => {
      if (!idToken) return;
      setPublishingId(submissionId);
      setError('');
      try {
        const res = await fetch('/api/admin/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ submissionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || 'Error al publicar.');
          return;
        }
        const mail = data.publicationMail as
          | { status?: string; to?: string | null; error?: string | null }
          | undefined;
        if (mail?.status === 'sent') {
          setLastMailNotice(`Publicada. Correo enviado a ${mail.to ?? 'el autor'}.`);
        } else if (mail?.status === 'skipped_no_email') {
          setLastMailNotice('Publicada. No se avisó: el envío no tiene correo del autor.');
        } else if (mail?.status === 'failed') {
          setLastMailNotice(`Publicada, pero el correo NO salió: ${mail.error ?? 'error de envío'}`);
        } else {
          setLastMailNotice(null);
        }
        setList((prev) => prev.filter((s) => s.id !== submissionId));
      } catch {
        setError('Error de conexión.');
      } finally {
        setPublishingId(null);
      }
    },
    [idToken]
  );

  const reject = useCallback(
    async (submissionId: string, reasonId: string, reasonDetail: string) => {
      if (!idToken) return;
      const resolved = resolvePublicRejectionText(reasonId, reasonDetail);
      if (!resolved.ok) {
        setError(resolved.error);
        return;
      }
      setRejectingId(submissionId);
      setError('');
      try {
        const res = await fetch('/api/curate/reject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            storyId: submissionId,
            reasonId: resolved.reasonId,
            reasonDetail: resolved.detail || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || 'Error al rechazar.');
          return;
        }
        const mail = data.rejectionMail as
          | { status?: string; to?: string | null; error?: string | null }
          | undefined;
        if (mail?.status === 'sent') {
          setLastMailNotice(`Rechazada. Correo enviado a ${mail.to ?? 'el autor'}.`);
        } else if (mail?.status === 'skipped_no_email') {
          setLastMailNotice('Rechazada. No se avisó: el envío no tiene correo del autor.');
        } else if (mail?.status === 'failed') {
          setLastMailNotice(`Rechazada, pero el correo NO salió: ${mail.error ?? 'error de envío'}`);
        } else {
          setLastMailNotice(null);
        }
        setList((prev) => prev.filter((s) => s.id !== submissionId));
      } catch {
        setError('Error de conexión.');
      } finally {
        setRejectingId(null);
      }
    },
    [idToken]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!email.trim() || !password) {
      setLoginError('Email y contraseña requeridos.');
      return;
    }
    if (!auth) {
      setLoginError('Firebase no configurado.');
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Error al iniciar sesión';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    if (auth) signOut(auth);
    setUser(null);
    setIdToken(null);
    setList([]);
  };

  if (!auth) {
    return (
      <main className="min-h-screen bg-[#0a0f24] text-white p-8 font-sans flex flex-col gap-6">
        <p>Firebase no está configurado en este entorno.</p>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col bg-[#0a0f24] p-8 font-sans text-white">
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-white/70">Cargando…</p>
        </div>
      </main>
    );
  }

  if (!user || !idToken) {
    return (
      <main className="min-h-screen bg-[#0a0f24] text-white p-8 font-sans flex flex-col gap-6">
        <div className="max-w-md mx-auto mt-16 p-8 rounded-2xl bg-white/5 border border-white/10">
          <h1 className="text-xl font-bold mb-2">Curaduría Alma Mundi</h1>
          <p className="text-white/60 text-sm mb-6">Acceso con la misma cuenta que el panel admin.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40"
            />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40"
            />
            {loginError && <p className="text-red-300 text-sm">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold disabled:opacity-50"
            >
              {loginLoading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => hardNavigateTo('/')}
            className="mt-6 text-white/50 hover:text-white text-sm underline"
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f24] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Curaduría Alma Mundi</h1>
            <p className="text-white/70 text-sm mt-1">
              Sesión: {user.email}{' '}
              <button type="button" onClick={handleLogout} className="text-orange-400 hover:underline ml-2">
                Cerrar sesión
              </button>
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Actualizar lista'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
            {error}
          </div>
        )}
        {lastMailNotice && (
          <div className="mb-4 p-4 rounded-xl bg-white/10 border border-white/20 text-white/90 text-sm">
            {lastMailNotice}
          </div>
        )}

        {list.length === 0 && !loading && (
          <p className="text-white/60">No hay envíos pendientes para curar.</p>
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
                    {s.lat == null || s.lng == null ? (
                      <span className="ml-2 text-amber-400">· Falta lat/lng en Firestore</span>
                    ) : null}
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
                <div className="flex-shrink-0 flex flex-col gap-3 w-full md:w-72">
                  <button
                    type="button"
                    onClick={() => publish(s.id)}
                    disabled={publishingId === s.id || rejectingId === s.id || s.lat == null || s.lng == null}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-sm disabled:opacity-50"
                    title={
                      s.lat == null || s.lng == null
                        ? 'Añade lat y lng en Firestore para publicar en el mapa'
                        : undefined
                    }
                  >
                    {publishingId === s.id ? 'Publicando…' : 'Publicar en mapa'}
                  </button>
                  <RejectionControls
                    disabled={publishingId === s.id || (rejectingId !== null && rejectingId !== s.id)}
                    busy={rejectingId === s.id}
                    onReject={(reasonId, reasonDetail) => reject(s.id, reasonId, reasonDetail)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function RejectionControls({
  disabled,
  busy,
  onReject,
}: {
  disabled: boolean;
  busy: boolean;
  onReject: (reasonId: string, reasonDetail: string) => void;
}) {
  const [reasonId, setReasonId] = useState('');
  const [detail, setDetail] = useState('');
  const preview = reasonId ? resolvePublicRejectionText(reasonId, detail) : null;
  const canSubmit = Boolean(preview && preview.ok) && !disabled && !busy;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-white/60">
        Motivo del rechazo (lo recibe la persona por correo)
        <select
          value={reasonId}
          onChange={(e) => setReasonId(e.target.value)}
          disabled={disabled || busy}
          className="mt-1 w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm"
        >
          <option value="">Elegir motivo…</option>
          {REJECTION_REASON_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id} className="text-black">
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        disabled={disabled || busy}
        maxLength={REJECTION_REASON_DETAIL_MAX}
        rows={2}
        placeholder={
          reasonId === 'other'
            ? 'Escribe el motivo que verá la persona…'
            : 'Detalle opcional (también lo verá la persona)'
        }
        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40"
      />
      {preview && !preview.ok && (
        <p className="text-amber-300 text-xs">{preview.error}</p>
      )}
      <button
        type="button"
        onClick={() => onReject(reasonId, detail)}
        disabled={!canSubmit}
        className="px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 font-bold text-sm disabled:opacity-50"
      >
        {busy ? 'Rechazando…' : 'Rechazar y avisar'}
      </button>
    </div>
  );
}
