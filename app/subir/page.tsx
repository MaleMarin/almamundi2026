'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Video, Mic, FileText, Image as ImageIcon } from 'lucide-react';
import { uploadFileToStorage } from '@/lib/firebase/upload';
import { THEME_LIST } from '@/lib/themes';

const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E0E5EC',
    boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '40px',
  },
  inset: {
    backgroundColor: '#E0E5EC',
    boxShadow: 'inset 6px 6px 10px rgba(163,177,198,0.7), inset -6px -6px 10px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
  },
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
    fontFamily: APP_FONT,
  },
} as const;

type Format = 'video' | 'audio' | 'texto' | 'foto';

const FORMAT_LABELS: Record<Format, string> = {
  video: 'Video',
  audio: 'Audio',
  texto: 'Texto',
  foto: 'Foto',
};

const FORMAT_PHRASES: Record<Format, string> = {
  video: 'Comparte un video (YouTube o Vimeo).',
  audio: 'Comparte un audio o enlace.',
  texto: 'Comparte tu historia escrita.',
  foto: 'Comparte una foto tuya.',
};

const PHOTO_MAX_MB = 5;
const AUDIO_MAX_MB = 10;

function isVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /youtube\.com|youtu\.be|vimeo\.com/i.test(u.hostname);
  } catch {
    return false;
  }
}

export default function SubirPage() {
  const [step, setStep] = useState<'cards' | 'form' | 'received'>('cards');
  const [format, setFormat] = useState<Format | null>(null);

  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [themeId, setThemeId] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaAprox, setFechaAprox] = useState(false);
  const [lugar, setLugar] = useState('');
  const [contexto, setContexto] = useState('');
  const [consentRights, setConsentRights] = useState(false);
  const [consentCurate, setConsentCurate] = useState(false);
  const [consentPostales, setConsentPostales] = useState(false);

  const [textBody, setTextBody] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    alias.trim().length >= 2 &&
    email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    THEME_LIST.some((t) => t.id === themeId) &&
    fecha.trim().length > 0 &&
    lugar.trim().length > 0 &&
    contexto.trim().length >= 30 &&
    consentRights &&
    consentCurate &&
    consentPostales &&
    (format === 'texto' ? textBody.trim().length > 0 : true) &&
    (format === 'video' ? videoUrl.trim().length > 0 && isVideoUrl(videoUrl) : true) &&
    (format === 'foto' ? (photoFile != null || (photoUrl.trim().length > 0 && /^https?:\/\//.test(photoUrl))) : true) &&
    (format === 'audio' ? (audioFile != null || (audioUrl.trim().length > 0 && /^https?:\/\//i.test(audioUrl))) : true);

  const submit = useCallback(async () => {
    if (!canSubmit || !format) return;
    setError('');
    setSaving(true);
    try {
      let payload: { textBody?: string; photoUrl?: string; audioUrl?: string; videoUrl?: string } = {};
      if (format === 'texto') {
        payload = { textBody: textBody.trim() };
      } else if (format === 'video') {
        payload = { videoUrl: videoUrl.trim() };
      } else if (format === 'audio') {
        if (audioFile) {
          const url = await uploadFileToStorage(audioFile, 'submissions', `audio.${audioFile.name.split('.').pop() || 'mp3'}`);
          payload = { audioUrl: url };
        } else {
          payload = { audioUrl: audioUrl.trim() };
        }
      } else if (format === 'foto') {
        if (photoFile) {
          const url = await uploadFileToStorage(photoFile, 'submissions', photoFile.name);
          payload = { photoUrl: url };
        } else if (photoUrl.trim() && /^https?:\/\//.test(photoUrl)) {
          payload = { photoUrl: photoUrl.trim() };
        }
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: format,
          alias: alias.trim(),
          email: email.trim(),
          themeId,
          date: fecha.trim(),
          dateApprox: fechaAprox,
          placeLabel: lugar.trim(),
          context: contexto.trim(),
          payload,
          consentRights: true,
          consentCurate: true,
          consentPostales: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Error ${res.status}. Intenta de nuevo.`);
        return;
      }
      setStep('received');
    } catch (e) {
      console.error('submit', e);
      setError(
        e instanceof Error && e.message.includes('Firebase')
          ? 'Subida no configurada. Configura Firebase en .env.local.'
          : 'No pudimos enviar. Revisa tu conexión e intenta de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  }, [canSubmit, format, alias, email, themeId, fecha, fechaAprox, lugar, contexto, textBody, videoUrl, audioUrl, photoUrl, audioFile, photoFile]);

  const backToCards = useCallback(() => {
    setStep('cards');
    setFormat(null);
    setPhotoFile(null);
    setAudioFile(null);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-12 h-24 bg-[#E0E5EC]/80 backdrop-blur-lg border-b border-white/20">
        <Link href="/" className="flex items-center min-h-[60px]">
          <img
            src="/logo.png"
            alt="AlmaMundi"
            className="h-20 md:h-24 w-auto object-contain select-none"
            onError={(e) => {
              const t = e.currentTarget;
              if (t.nextElementSibling) return;
              const span = document.createElement('span');
              span.className = 'text-xl font-light text-gray-600';
              span.textContent = 'AlmaMundi';
              t.style.display = 'none';
              t.parentElement?.appendChild(span);
            }}
          />
        </Link>
        <nav className="flex gap-4 text-sm font-bold text-gray-600 items-center">
          <Link href="/" className="px-6 py-3 active:scale-95 hover:text-orange-600 rounded-full" style={soft.button}>
            Inicio
          </Link>
          <Link href="/mapa" className="px-6 py-3 active:scale-95 hover:text-orange-600 rounded-full" style={soft.button}>
            Mapa
          </Link>
        </nav>
      </header>

      <div className="pt-28 pb-16 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: soft.textMain }}>
          Subir
        </h1>
        <p className="text-base font-light mb-10" style={{ color: soft.textBody }}>
          Elige el formato. Tu envío queda en revisión; te notificamos por email cuando se apruebe.
        </p>

        {step === 'cards' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(['video', 'audio', 'texto', 'foto'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFormat(f);
                  setStep('form');
                }}
                className="p-6 rounded-[40px] flex flex-col items-start gap-3 transition-all hover:-translate-y-1 active:scale-[0.99] text-left"
                style={soft.flat}
              >
                {f === 'video' && <Video size={32} className="text-orange-500" />}
                {f === 'audio' && <Mic size={32} className="text-orange-500" />}
                {f === 'texto' && <FileText size={32} className="text-orange-500" />}
                {f === 'foto' && <ImageIcon size={32} className="text-orange-500" />}
                <span className="font-semibold text-lg" style={{ color: soft.textMain }}>
                  {FORMAT_LABELS[f]}
                </span>
                <p className="text-sm font-light" style={{ color: soft.textBody }}>
                  {FORMAT_PHRASES[f]}
                </p>
                <span className="mt-2 px-4 py-2 rounded-full text-sm font-semibold text-orange-600" style={soft.button}>
                  Empezar
                </span>
              </button>
            ))}
          </section>
        )}

        {step === 'form' && format && (
          <section className="space-y-6">
            <button
              type="button"
              onClick={backToCards}
              className="text-sm font-medium"
              style={{ color: soft.textBody }}
            >
              ← Cambiar formato
            </button>
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: soft.textBody }}>
              {FORMAT_LABELS[format]}
            </p>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Alias (público) *
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Cómo quieres aparecer"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
              {alias.trim().length > 0 && alias.trim().length < 2 && (
                <p className="mt-1 text-xs text-amber-700">Mínimo 2 caracteres</p>
              )}
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Email (privado; solo notificaciones) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Tema *
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {THEME_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                    style={{
                      ...soft.button,
                      color: themeId === t.id ? '#ff4500' : soft.textBody,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Fecha *
              </label>
              <input
                type="text"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                placeholder="Ej: 2024-03-15 o marzo 2024"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
              <label className="mt-2 flex items-center gap-2 text-sm" style={{ color: soft.textBody }}>
                <input type="checkbox" checked={fechaAprox} onChange={(e) => setFechaAprox(e.target.checked)} className="accent-orange-500" />
                Aproximada
              </label>
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Lugar *
              </label>
              <input
                type="text"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="Ciudad, país o lugar"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Contexto (1–5 líneas) *
              </label>
              <textarea
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                placeholder="Describe el momento, el lugar o el contexto..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50 resize-y"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
              {contexto.trim().length > 0 && contexto.trim().length < 30 && (
                <p className="mt-1 text-xs text-amber-700">Mínimo 30 caracteres</p>
              )}
            </div>

            {format === 'texto' && (
              <div style={soft.inset} className="p-4 rounded-3xl">
                <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                  Texto *
                </label>
                <textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  placeholder="Tu historia..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50 resize-y"
                  style={{ color: soft.textMain, fontFamily: APP_FONT }}
                />
              </div>
            )}

            {format === 'video' && (
              <div style={soft.inset} className="p-4 rounded-3xl">
                <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                  URL del video (YouTube o Vimeo) *
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/..."
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: soft.textMain, fontFamily: APP_FONT }}
                />
                {videoUrl.trim().length > 0 && !isVideoUrl(videoUrl) && (
                  <p className="mt-1 text-xs text-amber-700">Indica un enlace de YouTube o Vimeo</p>
                )}
              </div>
            )}

            {format === 'foto' && (
              <div style={soft.inset} className="p-4 rounded-3xl space-y-3">
                <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                  Foto (JPG, PNG o WebP; máx. {PHOTO_MAX_MB} MB) *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) {
                      setPhotoFile(null);
                      return;
                    }
                    if (f.size > PHOTO_MAX_MB * 1024 * 1024) {
                      setError(`Máximo ${PHOTO_MAX_MB} MB`);
                      setPhotoFile(null);
                      return;
                    }
                    setError('');
                    setPhotoFile(f);
                  }}
                  className="w-full text-sm"
                  style={{ color: soft.textBody }}
                />
                <p className="text-xs" style={{ color: soft.textBody }}>
                  Si no tienes cómo subir archivo, pega la URL de la imagen abajo (fallback temporal).
                </p>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="O pega aquí la URL de la imagen"
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: soft.textMain, fontFamily: APP_FONT }}
                />
                {(photoFile || photoUrl.trim()) && <p className="text-sm" style={{ color: soft.textBody }}>✓ Listo</p>}
              </div>
            )}

            {format === 'audio' && (
              <div style={soft.inset} className="p-4 rounded-3xl space-y-3">
                <label className="block text-sm font-medium" style={{ color: soft.textMain }}>
                  Audio (MP3, WAV o M4A; máx. {AUDIO_MAX_MB} MB) o URL
                </label>
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) {
                      setAudioFile(null);
                      return;
                    }
                    if (f.size > AUDIO_MAX_MB * 1024 * 1024) {
                      setError(`Máximo ${AUDIO_MAX_MB} MB`);
                      setAudioFile(null);
                      return;
                    }
                    setError('');
                    setAudioFile(f);
                  }}
                  className="w-full text-sm"
                  style={{ color: soft.textBody }}
                />
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="O pega aquí la URL del audio"
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: soft.textMain, fontFamily: APP_FONT }}
                />
                {(audioFile || audioUrl.trim()) && <p className="text-sm" style={{ color: soft.textBody }}>✓ Listo</p>}
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-sm" style={{ color: soft.textBody }}>
                <input type="checkbox" checked={consentRights} onChange={(e) => setConsentRights(e.target.checked)} className="mt-1 accent-orange-500" />
                <span>Tengo derechos para compartir este contenido.</span>
              </label>
              <label className="flex items-start gap-3 text-sm" style={{ color: soft.textBody }}>
                <input type="checkbox" checked={consentCurate} onChange={(e) => setConsentCurate(e.target.checked)} className="mt-1 accent-orange-500" />
                <span>Acepto que pasa por curaduría antes de publicarse.</span>
              </label>
              <label className="flex items-start gap-3 text-sm" style={{ color: soft.textBody }}>
                <input type="checkbox" checked={consentPostales} onChange={(e) => setConsentPostales(e.target.checked)} className="mt-1 accent-orange-500" />
                <span>Postales: mantener autoría, no modificar.</span>
              </label>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <button
              type="button"
              disabled={!canSubmit || saving}
              onClick={submit}
              className="w-full py-4 rounded-full font-bold text-white text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition"
              style={{
                background: canSubmit && !saving ? 'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)' : '#9ca3af',
                boxShadow: canSubmit && !saving ? '0 4px 14px rgba(249,115,22,0.4)' : 'none',
              }}
            >
              {saving ? 'Enviando…' : 'Enviar'}
            </button>
          </section>
        )}

        {step === 'received' && (
          <section className="p-8 rounded-[40px] text-center" style={soft.flat}>
            <p className="text-xl font-semibold mb-2" style={{ color: soft.textMain }}>
              Listo
            </p>
            <p className="text-base font-light mb-6" style={{ color: soft.textBody }}>
              Quedó en revisión. Te avisaremos por email.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/subir" className="px-6 py-3 rounded-full font-semibold text-orange-600" style={soft.button}>
                Subir otro
              </Link>
              <Link href="/" className="px-6 py-3 rounded-full font-semibold" style={{ ...soft.button, color: soft.textMain }}>
                Ir al inicio
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
