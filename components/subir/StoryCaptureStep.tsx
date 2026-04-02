'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Video, Mic, Square, RotateCcw, Link2, Camera } from 'lucide-react';
import { neu } from '@/lib/historias-neumorph';
import {
  MAX_AUDIO_VIDEO_DURATION_SECONDS,
  probeAudioFileDurationSeconds,
  isDurationWithinMax,
} from '@/lib/media-duration-rules';
import {
  SUBIR_AV_MAX_MINUTES,
  SUBIR_PHOTO_MAX,
  SUBIR_PHOTO_MIN,
  SUBIR_TEXT_MAX_CHARS,
} from '@/lib/subir-limits';
import type { SubirFormat } from './ImprontaStep';

export type CaptureOutcome = {
  /** Texto que alimenta la impronta (historia completa o resumen). */
  narrativeText: string;
  recordedBlob: Blob | null;
  recordedMime: string;
  /** Entre 1 y 6 imágenes. */
  photoFiles: File[];
  videoUrl: string;
  audioUrl: string;
  audioFile: File | null;
};

const PHOTO_MAX_MB = 5;
const AUDIO_MAX_MB = 10;
const NARRATIVE_MIN = 30;

const neoSurface = {
  ...neu.cardInset,
  borderRadius: '2rem',
  boxShadow: `${neu.cardInset.boxShadow}, 0 18px 40px rgba(163,177,198,0.25)`,
} as const;

const orangeCta =
  'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)' as const;

function isVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /youtube\.com|youtu\.be|vimeo\.com/i.test(u.hostname);
  } catch {
    return false;
  }
}

function pickRecorderMime(forVideo: boolean): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  if (forVideo) {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return undefined;
  }
  const atypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const t of atypes) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

type Props = {
  format: SubirFormat;
  onContinue: (out: CaptureOutcome) => void;
};

export function StoryCaptureStep({ format, onContinue }: Props) {
  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const videoReviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrlState] = useState<string | null>(null);

  const setPreviewUrl = useCallback((url: string | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (url) previewUrlRef.current = url;
    setPreviewUrlState(url);
  }, []);

  const [videoMode, setVideoMode] = useState<'grabar' | 'enlace'>('grabar');
  const [audioMode, setAudioMode] = useState<'grabar' | 'archivo'>('grabar');
  const [phase, setPhase] = useState<'idle' | 'live' | 'review'>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMime, setRecordedMime] = useState('');
  const [recording, setRecording] = useState(false);

  const [textStory, setTextStory] = useState('');
  const [fotoCaption, setFotoCaption] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const [videoUrl, setVideoUrl] = useState('');
  const [narrativeExtra, setNarrativeExtra] = useState('');

  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [localErr, setLocalErr] = useState('');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoLiveRef.current) videoLiveRef.current.srcObject = null;
  }, []);

  const clearReviewUrl = useCallback(() => {
    setPreviewUrl(null);
    if (videoReviewRef.current) {
      videoReviewRef.current.removeAttribute('src');
      videoReviewRef.current.load();
    }
  }, [setPreviewUrl]);

  useEffect(() => {
    return () => {
      stopStream();
      clearReviewUrl();
    };
  }, [stopStream, clearReviewUrl]);

  const startLive = useCallback(async () => {
    setLocalErr('');
    const wantVideo = format === 'video';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: wantVideo ? { facingMode: 'user' } : false,
      });
      streamRef.current = stream;
      if (wantVideo && videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream;
        await videoLiveRef.current.play().catch(() => {});
      }
      setPhase('live');
      setRecordedBlob(null);
      clearReviewUrl();
    } catch {
      setLocalErr('No pudimos acceder al micrófono o cámara. Revisa permisos o usa la opción de enlace/archivo.');
    }
  }, [format, clearReviewUrl]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickRecorderMime(format === 'video');
    if (!mime) {
      setLocalErr('Tu navegador no permite grabar en un formato compatible. Prueba Chrome o Firefox, o sube archivo/enlace.');
      return;
    }
    chunksRef.current = [];
    try {
      const mr = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        setRecordedBlob(blob);
        setRecordedMime(mr.mimeType);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        if (format === 'video' && videoReviewRef.current) {
          videoReviewRef.current.src = url;
          void videoReviewRef.current.play().catch(() => {});
        }
        setPhase('review');
        stopStream();
      };
      mr.start(200);
      setRecording(true);
    } catch {
      setLocalErr('No se pudo iniciar la grabación.');
    }
  }, [format, stopStream, setPreviewUrl]);

  const stopRecording = useCallback(() => {
    const mr = recorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
    }
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordedMime('');
    clearReviewUrl();
    setPhase('idle');
    setRecording(false);
  }, [clearReviewUrl]);

  const narrativeTextForFormat = useCallback((): string => {
    if (format === 'texto') return textStory.trim();
    if (format === 'foto') {
      const c = fotoCaption.trim();
      return c.length >= 15 ? c : 'Historia compartida en imagen — AlmaMundi';
    }
    return narrativeExtra.trim();
  }, [format, textStory, fotoCaption, narrativeExtra]);

  const canContinue = useCallback((): boolean => {
    const nar = narrativeTextForFormat();
    if (format === 'texto')
      return nar.length >= NARRATIVE_MIN && nar.length <= SUBIR_TEXT_MAX_CHARS;
    if (format === 'foto')
      return photoFiles.length >= SUBIR_PHOTO_MIN && photoFiles.length <= SUBIR_PHOTO_MAX;
    if (format === 'video') {
      const hasMedia = recordedBlob != null || (videoUrl.trim().length > 0 && isVideoUrl(videoUrl));
      return hasMedia && nar.length >= NARRATIVE_MIN;
    }
    if (format === 'audio') {
      const hasMedia =
        recordedBlob != null ||
        audioFile != null ||
        (audioUrl.trim().length > 0 && /^https?:\/\//i.test(audioUrl));
      return hasMedia && nar.length >= NARRATIVE_MIN;
    }
    return false;
  }, [format, narrativeTextForFormat, photoFiles, recordedBlob, videoUrl, audioFile, audioUrl]);

  const handleContinue = useCallback(() => {
    if (!canContinue()) {
      setLocalErr(
        format === 'texto'
          ? textStory.trim().length > SUBIR_TEXT_MAX_CHARS
            ? `Máximo ${SUBIR_TEXT_MAX_CHARS} caracteres (~2 carillas).`
            : `Escribe al menos ${NARRATIVE_MIN} caracteres.`
          : format === 'foto'
            ? `Elige entre ${SUBIR_PHOTO_MIN} y ${SUBIR_PHOTO_MAX} fotos.`
            : `Necesitas medio (grabación, archivo o enlace válido) y un texto de al menos ${NARRATIVE_MIN} caracteres para la huella.`
      );
      return;
    }
    setLocalErr('');
    onContinue({
      narrativeText: narrativeTextForFormat(),
      recordedBlob,
      recordedMime,
      photoFiles,
      videoUrl: videoUrl.trim(),
      audioUrl: audioUrl.trim(),
      audioFile,
    });
  }, [
    canContinue,
    format,
    narrativeTextForFormat,
    textStory,
    onContinue,
    recordedBlob,
    recordedMime,
    photoFiles,
    videoUrl,
    audioUrl,
    audioFile,
  ]);

  const narrativeTooShort =
    narrativeExtra.trim().length > 0 && narrativeExtra.trim().length < NARRATIVE_MIN;

  const renderNarrativeBox = (label: string, hint: string, fieldId: string) => (
    <div style={neoSurface} className="p-6 md:p-8 space-y-3">
      <label htmlFor={fieldId} className="block text-lg md:text-xl font-semibold" style={{ color: neu.textMain }}>
        {label}
      </label>
      <p className="text-base md:text-lg leading-relaxed" style={{ color: neu.textBody }}>
        {hint}
      </p>
      <textarea
        id={fieldId}
        value={narrativeExtra}
        onChange={(e) => setNarrativeExtra(e.target.value)}
        rows={5}
        aria-required="true"
        aria-invalid={narrativeTooShort}
        aria-describedby={narrativeTooShort ? `${fieldId}-error` : undefined}
        className="w-full px-5 py-4 rounded-2xl text-base md:text-lg outline-none bg-white/55 border border-white/60 resize-y min-h-[140px]"
        style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
      />
      {narrativeTooShort && (
        <p id={`${fieldId}-error`} className="text-sm text-amber-700" role="alert">
          Mínimo {NARRATIVE_MIN} caracteres.
        </p>
      )}
    </div>
  );

  /** Intro por formato: solo cuerpo visible; h1 reservado para lectores de pantalla. */
  const pageCopy =
    format === 'video'
      ? {
          a11yTitle: 'Captura de video',
          line: `Graba con la cámara o pega un enlace (YouTube/Vimeo). Máximo ${SUBIR_AV_MAX_MINUTES} minutos. En segundos verás una huella única hecha de cuadrados y color; después completas tus datos.`,
        }
      : format === 'audio'
        ? {
            a11yTitle: 'Captura de audio',
            line: `Graba tu voz o sube un audio desde tu equipo o un enlace. Máximo ${SUBIR_AV_MAX_MINUTES} minutos. Tu huella combina formas y tonos según el texto que añadas para la composición.`,
          }
        : format === 'texto'
          ? {
              a11yTitle: 'Relato por texto',
              line: `Escribe hasta ~2 carillas (${SUBIR_TEXT_MAX_CHARS.toLocaleString('es')} caracteres como máximo). Cada relato genera una huella distinta en cuadrados y capas de color.`,
            }
          : {
              a11yTitle: 'Imágenes para la huella',
              line: `Sube entre ${SUBIR_PHOTO_MIN} y ${SUBIR_PHOTO_MAX} fotos (JPG, PNG o WebP). La huella mezcla geometría y paleta según tus palabras clave.`,
            };

  return (
    <section className="space-y-8 md:space-y-10" aria-label="Paso 2 de 4: captura de tu historia" aria-current="step">
      <header className="space-y-4 md:space-y-5">
        <p className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-orange-600">AlmaMundi</p>
        <h1 className="sr-only">{pageCopy.a11yTitle}</h1>
        <p className="text-xl md:text-3xl lg:text-4xl font-light leading-relaxed max-w-3xl" style={{ color: neu.textBody }}>
          {pageCopy.line}
        </p>
      </header>

      {localErr && (
        <p className="text-base text-red-600 font-medium" role="alert">
          {localErr}
        </p>
      )}

      {format === 'texto' && (
        <div style={neoSurface} className="p-6 md:p-8 space-y-3">
          <label htmlFor="capture-texto-relato" className="block text-lg md:text-xl font-semibold" style={{ color: neu.textMain }}>
            Relato (obligatorio)
          </label>
          <textarea
            id="capture-texto-relato"
            value={textStory}
            onChange={(e) => setTextStory(e.target.value.slice(0, SUBIR_TEXT_MAX_CHARS))}
            rows={14}
            placeholder="Escribe aquí…"
            className="w-full px-5 py-4 rounded-2xl text-base md:text-lg outline-none bg-white/55 border border-white/60 resize-y min-h-[280px]"
            style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
            aria-required="true"
            aria-invalid={textStory.trim().length > 0 && textStory.trim().length < NARRATIVE_MIN}
            aria-describedby={
              textStory.trim().length > 0 && textStory.trim().length < NARRATIVE_MIN
                ? 'capture-texto-relato-error'
                : 'capture-texto-relato-count'
            }
          />
          <p id="capture-texto-relato-count" className="text-base md:text-lg" style={{ color: neu.textBody }}>
            {textStory.length.toLocaleString('es')} / {SUBIR_TEXT_MAX_CHARS.toLocaleString('es')} caracteres
          </p>
          {textStory.trim().length > 0 && textStory.trim().length < NARRATIVE_MIN && (
            <p id="capture-texto-relato-error" className="text-sm text-amber-700" role="alert">
              Mínimo {NARRATIVE_MIN} caracteres.
            </p>
          )}
        </div>
      )}

      {format === 'foto' && (
        <>
          <div style={neoSurface} className="p-6 md:p-8 space-y-4">
            <label htmlFor="capture-foto-files" className="flex items-center gap-3 text-xl md:text-2xl font-semibold" style={{ color: neu.textMain }}>
              <Camera className="h-8 w-8 text-orange-500 shrink-0" aria-hidden />
              Imágenes ({SUBIR_PHOTO_MIN}–{SUBIR_PHOTO_MAX}) *
            </label>
            <input
              id="capture-foto-files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              capture="environment"
              aria-label={`Seleccionar archivos de imagen para la historia (${SUBIR_PHOTO_MIN} a ${SUBIR_PHOTO_MAX} fotos)`}
              aria-required="true"
              onChange={(e) => {
                const list = e.target.files;
                if (!list?.length) return;
                setPhotoFiles((prev) => {
                  const next = [...prev];
                  for (const f of Array.from(list)) {
                    if (next.length >= SUBIR_PHOTO_MAX) break;
                    if (f.size > PHOTO_MAX_MB * 1024 * 1024) {
                      setLocalErr(`Cada imagen: máximo ${PHOTO_MAX_MB} MB`);
                      return prev;
                    }
                    if (!/^image\/(jpeg|png|webp)$/i.test(f.type)) {
                      setLocalErr('Formato: JPG, PNG o WebP.');
                      return prev;
                    }
                    next.push(f);
                  }
                  setLocalErr('');
                  return next;
                });
                e.target.value = '';
              }}
              className="w-full text-base md:text-lg"
              style={{ color: neu.textBody }}
            />
            {photoFiles.length > 0 && (
              <ul className="space-y-2">
                {photoFiles.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-base"
                    style={{ ...neu.card, borderRadius: '16px' }}
                  >
                    <span className="truncate font-medium" style={{ color: neu.textMain }}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-white"
                      style={{ background: orangeCta }}
                      onClick={() => setPhotoFiles((p) => p.filter((_, j) => j !== i))}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-base md:text-lg" style={{ color: neu.textBody }}>
              Llevas {photoFiles.length} de {SUBIR_PHOTO_MAX} fotos.
            </p>
          </div>
          <div style={neoSurface} className="p-6 md:p-8 space-y-3">
            <label htmlFor="capture-foto-caption" className="block text-xl md:text-2xl font-semibold" style={{ color: neu.textMain }}>
              Palabras clave o pie (opcional)
            </label>
            <p className="text-base md:text-lg" style={{ color: neu.textBody }}>
              15+ caracteres ayudan a personalizar la huella.
            </p>
            <textarea
              id="capture-foto-caption"
              value={fotoCaption}
              onChange={(e) => setFotoCaption(e.target.value)}
              rows={4}
              className="w-full px-5 py-4 rounded-2xl text-base md:text-lg outline-none bg-white/55 border border-white/60 resize-y"
              style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
            />
          </div>
        </>
      )}

      {format === 'video' && (
        <>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setVideoMode('grabar')}
              className="px-6 py-3.5 rounded-full text-base md:text-lg font-semibold"
              style={videoMode === 'grabar' ? { ...neu.button, color: neu.orange } : neu.button}
            >
              <Video className="inline h-5 w-5 mr-2 align-text-bottom" aria-hidden />
              Grabar
            </button>
            <button
              type="button"
              onClick={() => setVideoMode('enlace')}
              className="px-6 py-3.5 rounded-full text-base md:text-lg font-semibold"
              style={videoMode === 'enlace' ? { ...neu.button, color: neu.orange } : neu.button}
            >
              <Link2 className="inline h-5 w-5 mr-2 align-text-bottom" aria-hidden />
              Enlace YouTube/Vimeo
            </button>
          </div>

          {videoMode === 'grabar' && (
            <div style={neoSurface} className="p-6 md:p-8 space-y-5">
              {phase === 'idle' && (
                <button
                  type="button"
                  onClick={() => void startLive()}
                  className="w-full py-4 md:py-5 rounded-full font-bold text-base md:text-lg text-white"
                  style={{ background: orangeCta, boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
                >
                  Activar cámara y micrófono
                </button>
              )}
              {phase === 'live' && (
                <>
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                    <video
                      ref={videoLiveRef}
                      className="h-full w-full scale-x-[-1] object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {!recording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base md:text-lg font-bold text-white"
                        style={{ background: orangeCta, boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
                      >
                        <Video size={22} aria-hidden />
                        Grabar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base md:text-lg font-bold text-white bg-red-600 shadow-lg"
                      >
                        <Square size={22} aria-hidden />
                        Detener
                      </button>
                    )}
                  </div>
                </>
              )}
              {phase === 'review' && recordedBlob && (
                <>
                  <p className="text-sm font-medium" style={{ color: neu.textMain }}>
                    Revisa tu grabación
                  </p>
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                    <video
                      ref={videoReviewRef}
                      key={previewUrl ?? 'no-preview'}
                      src={previewUrl ?? undefined}
                      className="h-full w-full object-contain"
                      playsInline
                      controls
                    />
                  </div>
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="inline-flex items-center gap-2 text-sm font-medium"
                    style={{ color: neu.textBody }}
                  >
                    <RotateCcw size={16} aria-hidden />
                    Descartar y volver a grabar
                  </button>
                </>
              )}
            </div>
          )}

          {videoMode === 'enlace' && (
            <div style={neoSurface} className="p-6 md:p-8 space-y-3">
              <label htmlFor="capture-video-url" className="block text-xl font-semibold" style={{ color: neu.textMain }}>
                URL del video *
              </label>
              <input
                id="capture-video-url"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/..."
                className="w-full px-5 py-4 rounded-2xl text-base md:text-lg outline-none bg-white/55 border border-white/60"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                aria-required="true"
                aria-invalid={videoUrl.trim().length > 0 && !isVideoUrl(videoUrl)}
                aria-describedby={
                  videoUrl.trim().length > 0 && !isVideoUrl(videoUrl) ? 'capture-video-url-error' : undefined
                }
              />
              {videoUrl.trim().length > 0 && !isVideoUrl(videoUrl) && (
                <p id="capture-video-url-error" className="text-xs text-amber-700" role="alert">
                  Usa un enlace de YouTube o Vimeo
                </p>
              )}
            </div>
          )}

          {renderNarrativeBox(
            'Texto para tu impronta *',
            'Resume o describe lo que cuentas en el video (temas, emociones). Lo usamos para dibujar la composición y las etiquetas.',
            'capture-narrative-video'
          )}
        </>
      )}

      {format === 'audio' && (
        <>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAudioMode('grabar')}
              className="px-6 py-3.5 rounded-full text-base md:text-lg font-semibold"
              style={audioMode === 'grabar' ? { ...neu.button, color: neu.orange } : neu.button}
            >
              <Mic className="inline h-5 w-5 mr-2 align-text-bottom" aria-hidden />
              Grabar voz
            </button>
            <button
              type="button"
              onClick={() => setAudioMode('archivo')}
              className="px-6 py-3.5 rounded-full text-base md:text-lg font-semibold"
              style={audioMode === 'archivo' ? { ...neu.button, color: neu.orange } : neu.button}
            >
              Subir o enlace
            </button>
          </div>

          {audioMode === 'grabar' && (
            <div style={neoSurface} className="p-6 md:p-8 space-y-5">
              {phase === 'idle' && (
                <button
                  type="button"
                  onClick={() => void startLive()}
                  className="w-full py-4 md:py-5 rounded-full font-bold text-base md:text-lg text-white"
                  style={{ background: orangeCta, boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
                >
                  Activar micrófono
                </button>
              )}
              {phase === 'live' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="h-24 w-24 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Mic className="h-10 w-10 text-orange-600" aria-hidden />
                  </div>
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="rounded-full px-10 py-4 text-base md:text-lg font-bold text-white"
                      style={{ background: orangeCta, boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
                    >
                      Grabar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="rounded-full px-10 py-4 text-base md:text-lg font-bold text-white bg-red-600 shadow-lg"
                    >
                      Detener
                    </button>
                  )}
                </div>
              )}
              {phase === 'review' && recordedBlob && (
                <div className="space-y-3">
                  <p className="text-sm font-medium" style={{ color: neu.textMain }}>
                    Escucha y revisa
                  </p>
                  <audio src={previewUrl ?? undefined} controls className="w-full" />
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="inline-flex items-center gap-2 text-sm font-medium"
                    style={{ color: neu.textBody }}
                  >
                    <RotateCcw size={16} aria-hidden />
                    Descartar y volver a grabar
                  </button>
                </div>
              )}
            </div>
          )}

          {audioMode === 'archivo' && (
            <div style={neoSurface} className="p-6 md:p-8 space-y-4">
              <label htmlFor="capture-audio-file" className="block text-xl font-semibold" style={{ color: neu.textMain }}>
                Audio en tu equipo (máx. {AUDIO_MAX_MB} MB)
              </label>
              <input
                id="capture-audio-file"
                type="file"
                accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a"
                aria-label="Seleccionar archivo de audio desde tu equipo"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setAudioFile(null);
                    return;
                  }
                  if (f.size > AUDIO_MAX_MB * 1024 * 1024) {
                    setLocalErr(`Máximo ${AUDIO_MAX_MB} MB`);
                    setAudioFile(null);
                    return;
                  }
                  void probeAudioFileDurationSeconds(f).then((sec) => {
                    if (sec != null && !isDurationWithinMax(sec)) {
                      setLocalErr(`El audio supera los ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
                      setAudioFile(null);
                      return;
                    }
                    setLocalErr('');
                    setAudioFile(f);
                  });
                }}
                className="w-full text-base md:text-lg"
                style={{ color: neu.textBody }}
              />
              <label htmlFor="capture-audio-url" className="sr-only">
                URL del audio (opcional)
              </label>
              <input
                id="capture-audio-url"
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="O URL del audio (https://…)"
                className="w-full px-5 py-4 rounded-2xl text-base md:text-lg outline-none bg-white/55 border border-white/60"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>
          )}

          {renderNarrativeBox(
            'Texto para tu impronta *',
            'Transcribe o resume lo que dices en el audio; así personalizamos la composición.',
            'capture-narrative-audio'
          )}
        </>
      )}

      <button
        type="button"
        onClick={handleContinue}
        className="w-full py-5 md:py-6 rounded-full font-bold text-white text-lg md:text-xl uppercase tracking-wide"
        style={{
          background: canContinue() ? orangeCta : '#9ca3af',
          boxShadow: canContinue() ? '0 10px 32px rgba(255,69,0,0.4)' : 'none',
        }}
      >
        Seguir — ver tu huella
      </button>
    </section>
  );
}
