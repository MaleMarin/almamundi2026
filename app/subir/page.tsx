'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Video, Mic, FileText, Image as ImageIcon, UserCircle } from 'lucide-react';
import { uploadFileToStorage } from '@/lib/firebase/upload';
import { THEME_LIST } from '@/lib/themes';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import {
  MAX_AUDIO_VIDEO_DURATION_SECONDS,
  probeAudioFileDurationSeconds,
  probeAudioUrlDurationSeconds,
  fetchVimeoVideoDurationSeconds,
  isDurationWithinMax,
} from '@/lib/media-duration-rules';

type Format = 'video' | 'audio' | 'texto' | 'foto';

const FORMAT_LABELS: Record<Format, string> = {
  video: 'Video',
  audio: 'Audio',
  texto: 'Texto',
  foto: 'Foto',
};

const FORMAT_PHRASES: Record<Format, string> = {
  video: `Comparte un video (YouTube o Vimeo). Duración máxima: ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`,
  audio: `Comparte un audio o enlace. Duración máxima: ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`,
  texto: 'Comparte tu historia escrita.',
  foto: 'Comparte una foto tuya.',
};

const PHOTO_MAX_MB = 5;
const AUDIO_MAX_MB = 10;
/** Foto de perfil opcional (solo identificación del autor; distinta de la foto de la historia). */
const PROFILE_PHOTO_MAX_MB = 2;

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
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const profileObjectUrlRef = useRef<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  /** Audio: archivo o URL no supera 5 min (o URL no verificable por CORS). */
  const [audioFileWithinMax, setAudioFileWithinMax] = useState(true);
  const [audioUrlWithinMax, setAudioUrlWithinMax] = useState(true);
  /** Video: confirmación explícita (YouTube no expone duración sin API). Vimeo se valida aparte. */
  const [videoMax5Confirm, setVideoMax5Confirm] = useState(false);
  const [videoVimeoTooLong, setVideoVimeoTooLong] = useState(false);

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
    (format === 'audio' ? (audioFile != null || (audioUrl.trim().length > 0 && /^https?:\/\//i.test(audioUrl))) : true) &&
    (format !== 'audio' || (audioFileWithinMax && audioUrlWithinMax)) &&
    (format !== 'video' || (videoMax5Confirm && !videoVimeoTooLong));

  const submit = useCallback(async () => {
    if (!canSubmit || !format) return;
    setError('');
    setSaving(true);
    try {
      let profilePhotoUrl: string | undefined;
      if (profilePhotoFile) {
        profilePhotoUrl = await uploadFileToStorage(
          profilePhotoFile,
          'submissions/avatars',
          `avatar-${profilePhotoFile.name}`
        );
      }

      let payload: { textBody?: string; photoUrl?: string; audioUrl?: string; videoUrl?: string } = {};
      if (format === 'texto') {
        payload = { textBody: textBody.trim() };
      } else if (format === 'video') {
        payload = { videoUrl: videoUrl.trim() };
      } else if (format === 'audio') {
        if (audioFile) {
          const sec = await probeAudioFileDurationSeconds(audioFile);
          if (sec != null && !isDurationWithinMax(sec)) {
            setError(`El audio supera los ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
            setSaving(false);
            return;
          }
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
          ...(profilePhotoUrl ? { profilePhotoUrl } : {}),
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
  }, [
    canSubmit,
    format,
    alias,
    email,
    themeId,
    fecha,
    fechaAprox,
    lugar,
    contexto,
    textBody,
    videoUrl,
    audioUrl,
    photoUrl,
    audioFile,
    photoFile,
    profilePhotoFile,
  ]);

  const clearProfilePhoto = useCallback(() => {
    if (profileObjectUrlRef.current) {
      URL.revokeObjectURL(profileObjectUrlRef.current);
      profileObjectUrlRef.current = null;
    }
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
        profileObjectUrlRef.current = null;
      }
    };
  }, []);

  const backToCards = useCallback(() => {
    setStep('cards');
    setFormat(null);
    setPhotoFile(null);
    setAudioFile(null);
    setAudioFileWithinMax(true);
    setAudioUrlWithinMax(true);
    setVideoMax5Confirm(false);
    setVideoVimeoTooLong(false);
    clearProfilePhoto();
  }, [clearProfilePhoto]);

  useEffect(() => {
    if (format !== 'audio' || audioFile != null) {
      setAudioUrlWithinMax(true);
      return;
    }
    const url = audioUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setAudioUrlWithinMax(true);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void probeAudioUrlDurationSeconds(url).then((sec) => {
        if (cancelled) return;
        if (sec != null && !isDurationWithinMax(sec)) setAudioUrlWithinMax(false);
        else setAudioUrlWithinMax(true);
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [format, audioFile, audioUrl]);

  useEffect(() => {
    if (format !== 'video') {
      setVideoVimeoTooLong(false);
      return;
    }
    const url = videoUrl.trim();
    setVideoVimeoTooLong(false);
    if (!isVideoUrl(url)) return;
    let cancelled = false;
    const t = setTimeout(() => {
      void fetchVimeoVideoDurationSeconds(url).then((sec) => {
        if (cancelled || sec == null) return;
        if (!isDurationWithinMax(sec)) setVideoVimeoTooLong(true);
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [format, videoUrl]);

  useEffect(() => {
    setVideoMax5Confirm(false);
  }, [videoUrl]);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <Link href="/" className="flex items-center flex-shrink-0 min-w-0 pr-2" aria-label="AlmaMundi — inicio">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </Link>
        <div className={historiasInterior.navLinksRowClassName}>
          <Link href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <span className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-semibold text-amber-700" style={neu.cardInset}>Subir</span>
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <div className="pt-10 pb-16 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: neu.textMain }}>
          Subir
        </h1>
        <p className="text-base font-light mb-10" style={{ color: neu.textBody }}>
          Elige el formato. Audio y video: máximo {MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos. Tu envío queda en revisión; te notificamos por email cuando se apruebe.
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
                style={neu.card}
              >
                {f === 'video' && <Video size={32} className="text-orange-500" />}
                {f === 'audio' && <Mic size={32} className="text-orange-500" />}
                {f === 'texto' && <FileText size={32} className="text-orange-500" />}
                {f === 'foto' && <ImageIcon size={32} className="text-orange-500" />}
                <span className="font-semibold text-lg" style={{ color: neu.textMain }}>
                  {FORMAT_LABELS[f]}
                </span>
                <p className="text-sm font-light" style={{ color: neu.textBody }}>
                  {FORMAT_PHRASES[f]}
                </p>
                <span className="mt-2 px-4 py-2 rounded-full text-sm font-semibold text-orange-600" style={neu.button}>
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
              style={{ color: neu.textBody }}
            >
              ← Cambiar formato
            </button>
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
              {FORMAT_LABELS[format]}
            </p>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Alias (público) *
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Cómo quieres aparecer"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
              {alias.trim().length > 0 && alias.trim().length < 2 && (
                <p className="mt-1 text-xs text-amber-700">Mínimo 2 caracteres</p>
              )}
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Email (privado; solo notificaciones) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <div className="flex items-start gap-3 mb-3">
                <UserCircle className="w-6 h-6 shrink-0 text-orange-500 mt-0.5" aria-hidden />
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                    Foto personal / de perfil (opcional)
                  </label>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: neu.textBody }}>
                    Si quieres, sube una imagen tuya para acompañar tu alias cuando se publique. No es la foto de tu historia (eso va en el bloque del formato que elegiste).
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-full border-2 border-white/40 overflow-hidden bg-white/30 flex items-center justify-center shrink-0"
                      style={{ borderColor: 'rgba(255,255,255,0.35)' }}
                    >
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-10 h-10 text-gray-400" aria-hidden />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 min-w-0">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) {
                            clearProfilePhoto();
                            return;
                          }
                          if (f.size > PROFILE_PHOTO_MAX_MB * 1024 * 1024) {
                            setError(`La foto de perfil: máximo ${PROFILE_PHOTO_MAX_MB} MB`);
                            e.target.value = '';
                            return;
                          }
                          if (!/^image\/(jpeg|png|webp)$/i.test(f.type)) {
                            setError('Formato: JPG, PNG o WebP.');
                            e.target.value = '';
                            return;
                          }
                          setError('');
                          if (profileObjectUrlRef.current) {
                            URL.revokeObjectURL(profileObjectUrlRef.current);
                            profileObjectUrlRef.current = null;
                          }
                          const url = URL.createObjectURL(f);
                          profileObjectUrlRef.current = url;
                          setProfilePhotoPreview(url);
                          setProfilePhotoFile(f);
                        }}
                        className="w-full max-w-xs text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-orange-500/15 file:text-orange-700"
                        style={{ color: neu.textBody }}
                      />
                      {profilePhotoFile && (
                        <button
                          type="button"
                          onClick={() => {
                            clearProfilePhoto();
                          }}
                          className="text-xs font-medium text-left w-fit hover:underline"
                          style={{ color: neu.textBody }}
                        >
                          Quitar foto de perfil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
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
                      ...neu.button,
                      color: themeId === t.id ? '#ff4500' : neu.textBody,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Fecha *
              </label>
              <input
                type="text"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                placeholder="Ej: 2024-03-15 o marzo 2024"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
              <label className="mt-2 flex items-center gap-2 text-sm" style={{ color: neu.textBody }}>
                <input type="checkbox" checked={fechaAprox} onChange={(e) => setFechaAprox(e.target.checked)} className="accent-orange-500" />
                Aproximada
              </label>
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Lugar *
              </label>
              <input
                type="text"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="Ciudad, región o lugar"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Contexto (1–5 líneas) *
              </label>
              <textarea
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                placeholder="Describe el momento, el lugar o el contexto..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50 resize-y"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
              {contexto.trim().length > 0 && contexto.trim().length < 30 && (
                <p className="mt-1 text-xs text-amber-700">Mínimo 30 caracteres</p>
              )}
            </div>

            {format === 'texto' && (
              <div style={neu.cardInset} className="p-4 rounded-3xl">
                <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                  Texto *
                </label>
                <textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  placeholder="Tu historia..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50 resize-y"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
              </div>
            )}

            {format === 'video' && (
              <div style={neu.cardInset} className="p-4 rounded-3xl space-y-3">
                <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                  URL del video (YouTube o Vimeo) *
                </label>
                <p className="text-xs leading-relaxed" style={{ color: neu.textBody }}>
                  Duración máxima <strong>{MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos</strong>. En Vimeo comprobamos la duración automáticamente; en YouTube marca la casilla de confirmación.
                </p>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/..."
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
                {videoUrl.trim().length > 0 && !isVideoUrl(videoUrl) && (
                  <p className="mt-1 text-xs text-amber-700">Indica un enlace de YouTube o Vimeo</p>
                )}
                {videoVimeoTooLong && (
                  <p className="text-xs text-red-600 font-medium">
                    Este video de Vimeo supera los {MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos. Sube una versión más corta.
                  </p>
                )}
                <label className="flex items-start gap-2 text-sm" style={{ color: neu.textBody }}>
                  <input
                    type="checkbox"
                    checked={videoMax5Confirm}
                    onChange={(e) => setVideoMax5Confirm(e.target.checked)}
                    className="mt-0.5 accent-orange-500 shrink-0"
                  />
                  <span>Confirmo que el video no supera los {MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.</span>
                </label>
              </div>
            )}

            {format === 'foto' && (
              <div style={neu.cardInset} className="p-4 rounded-3xl space-y-3">
                <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
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
                  style={{ color: neu.textBody }}
                />
                <p className="text-xs" style={{ color: neu.textBody }}>
                  Si no tienes cómo subir archivo, pega la URL de la imagen abajo (fallback temporal).
                </p>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="O pega aquí la URL de la imagen"
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
                {(photoFile || photoUrl.trim()) && <p className="text-sm" style={{ color: neu.textBody }}>✓ Listo</p>}
              </div>
            )}

            {format === 'audio' && (
              <div style={neu.cardInset} className="p-4 rounded-3xl space-y-3">
                <label className="block text-sm font-medium" style={{ color: neu.textMain }}>
                  Audio (MP3, WAV o M4A; máx. {AUDIO_MAX_MB} MB) o URL
                </label>
                <p className="text-xs leading-relaxed" style={{ color: neu.textBody }}>
                  Duración máxima <strong>{MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos</strong>. Los archivos se comprueban al elegirlos; las URLs, si el servidor lo permite (a veces falla por CORS).
                </p>
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a"
                  onChange={(e) => {
                    const inputEl = e.target;
                    const f = inputEl.files?.[0];
                    if (!f) {
                      setAudioFile(null);
                      setAudioFileWithinMax(true);
                      return;
                    }
                    if (f.size > AUDIO_MAX_MB * 1024 * 1024) {
                      setError(`Máximo ${AUDIO_MAX_MB} MB`);
                      setAudioFile(null);
                      setAudioFileWithinMax(true);
                      inputEl.value = '';
                      return;
                    }
                    setError('');
                    void (async () => {
                      const sec = await probeAudioFileDurationSeconds(f);
                      if (sec != null && !isDurationWithinMax(sec)) {
                        setError(
                          `El audio dura más de ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos. Acorta el archivo e intenta de nuevo.`
                        );
                        setAudioFileWithinMax(false);
                        setAudioFile(null);
                        inputEl.value = '';
                        return;
                      }
                      setAudioFileWithinMax(true);
                      setAudioFile(f);
                    })();
                  }}
                  className="w-full text-sm"
                  style={{ color: neu.textBody }}
                />
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="O pega aquí la URL del audio"
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
                {!audioUrlWithinMax && (
                  <p className="text-xs text-red-600 font-medium">
                    Ese enlace supera los {MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos. Usa un audio más corto.
                  </p>
                )}
                {(audioFile || audioUrl.trim()) && audioFileWithinMax && audioUrlWithinMax && (
                  <p className="text-sm" style={{ color: neu.textBody }}>
                    ✓ Listo
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-sm" style={{ color: neu.textBody }}>
                <input type="checkbox" checked={consentRights} onChange={(e) => setConsentRights(e.target.checked)} className="mt-1 accent-orange-500" />
                <span>Tengo derechos para compartir este contenido.</span>
              </label>
              <label className="flex items-start gap-3 text-sm" style={{ color: neu.textBody }}>
                <input type="checkbox" checked={consentCurate} onChange={(e) => setConsentCurate(e.target.checked)} className="mt-1 accent-orange-500" />
                <span>Acepto que pasa por curaduría antes de publicarse.</span>
              </label>
              <label className="flex items-start gap-3 text-sm" style={{ color: neu.textBody }}>
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
          <section className="p-8 rounded-[40px] text-center" style={neu.card}>
            <p className="text-xl font-semibold mb-2" style={{ color: neu.textMain }}>
              Listo
            </p>
            <p className="text-base font-light mb-6" style={{ color: neu.textBody }}>
              Quedó en revisión. Te avisaremos por email.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/subir" className="btn-almamundi px-6 py-3 rounded-full font-semibold text-orange-600" style={neu.button}>
                Subir otro
              </Link>
              <Link href="/" className="btn-almamundi px-6 py-3 rounded-full font-semibold" style={{ ...neu.button, color: neu.textMain }}>
                Ir al inicio
              </Link>
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-gray-400/50 pt-10 md:pt-14">
        <Footer />
      </div>
    </main>
  );
}
