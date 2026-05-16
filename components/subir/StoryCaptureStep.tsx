'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Video, Mic, Square, RotateCcw, Link2, Upload } from 'lucide-react';
import { neu } from '@/lib/historias-neumorph';
import {
  MAX_AUDIO_VIDEO_DURATION_SECONDS,
  probeAudioFileDurationSeconds,
  probeVideoFileDurationSeconds,
  isDurationWithinMax,
} from '@/lib/media-duration-rules';
import {
  SUBIR_AV_MAX_MINUTES,
  SUBIR_AUDIO_UPLOAD_MAX_MB,
  SUBIR_PHOTO_FILE_MAX_MB,
  SUBIR_PHOTO_MAX,
  SUBIR_PHOTO_MIN,
  SUBIR_TEXT_MAX_CHARS,
  SUBIR_VIDEO_UPLOAD_MAX_MB,
} from '@/lib/subir-limits';
import {
  UPLOAD_DURATION_ERROR,
  UPLOAD_MODAL_COPY,
  UPLOAD_PHOTO_MAX_MESSAGE,
  SUBIR_TEXT_COUNTER_WARN_CHARS,
} from '@/lib/subir-upload-modal-copy';
import amStyles from '@/components/subir/am-upload-modal.module.css';
import { UploadModalFotoCapture } from '@/components/subir/UploadModalFotoCapture';
import type { SubirHuellaFormat as SubirFormat } from '@/hooks/useSubirHuella';
import { VoiceWaveform, type VoiceWaveformMode } from './VoiceWaveform';
import { AGE_RANGE_OPTIONS, type AgeRangeId } from '@/lib/subir-author-fields';

export type SubmissionSexApi = 'femenino' | 'masculino' | 'no-binario' | 'prefiero-no-decir' | 'otro';

export type SubmissionPrefill = {
  storyTitle: string;
  ciudad: string;
  pais: string;
  extraStory: string;
  alias: string;
  ageRange: AgeRangeId;
  sex: SubmissionSexApi;
  email: string;
};

/** @deprecated Usar SubmissionPrefill */
export type AudioCapturePrefill = SubmissionPrefill;

export type CaptureOutcome = {
  /** Texto para curación y resonancia posterior (no se adelanta en la captura). */
  narrativeText: string;
  recordedBlob: Blob | null;
  recordedMime: string;
  /** Entre 1 y 6 imágenes. */
  photoFiles: File[];
  videoUrl: string;
  audioUrl: string;
  audioFile: File | null;
  /** Video subido desde el equipo (alternativa a grabación o enlace). */
  videoFile?: File | null;
  /** Texto de contexto de la foto (restaurar al volver atrás). */
  fotoContext?: string;
  /** Datos de historia y persona ya recogidos antes del paso de envío. */
  submissionPrefill?: SubmissionPrefill;
  /** @deprecated Usar submissionPrefill */
  audioPrefill?: SubmissionPrefill;
};

type FlowStage = 'welcome' | 'media' | 'storyDetails' | 'personDetails';

function buildSubmissionNarrativeText(
  format: SubirFormat,
  p: { storyTitle: string; ciudad: string; pais: string; extraStory: string }
): string {
  const title = p.storyTitle.trim();
  const place = [p.ciudad.trim(), p.pais.trim()].filter(Boolean).join(', ');
  const extra = p.extraStory.trim();
  const blocks: string[] = [];
  if (extra) blocks.push(extra);
  blocks.push(`Historia: «${title || 'Sin título'}».`);
  if (place) blocks.push(`Lugar: ${place}.`);
  const suffix =
    format === 'video'
      ? 'Relato en video para AlmaMundi.'
      : format === 'audio'
        ? 'Relato en voz para AlmaMundi.'
        : format === 'texto'
          ? 'Relato escrito para AlmaMundi.'
          : 'Relato con imágenes para AlmaMundi.';
  blocks.push(suffix);
  let text = blocks.join('\n\n');
  if (text.length < 30) {
    text = `${text}\n\nGracias por compartir tu historia.`;
  }
  return text.slice(0, 2000);
}

const PHOTO_MAX_MB = SUBIR_PHOTO_FILE_MAX_MB;
const AUDIO_MAX_MB = SUBIR_AUDIO_UPLOAD_MAX_MB;
const VIDEO_UPLOAD_MAX_MB = SUBIR_VIDEO_UPLOAD_MAX_MB;
const NARRATIVE_MIN = 30;
const TEXT_DRAFT_KEY = 'almamundi-subir-texto-draft';

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
  /** Si el usuario vuelve desde el envío, repuebla campos y etapa. */
  restoredCapture?: CaptureOutcome | null;
  /** Incrementar al volver para forzar la hidratación. */
  hydrateKey?: number;
};

export function StoryCaptureStep({
  format,
  onContinue,
  restoredCapture = null,
  hydrateKey = 0,
}: Props) {
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
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFilePreviewUrl, setVideoFilePreviewUrl] = useState<string | null>(null);

  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [localErr, setLocalErr] = useState('');

  /** Flujo por formato: bienvenida → medio → datos de historia → datos de persona. */
  const [flowStage, setFlowStage] = useState<FlowStage>('welcome');
  const [liveMicStream, setLiveMicStream] = useState<MediaStream | null>(null);

  const [adStoryTitle, setAdStoryTitle] = useState('');
  const [adCiudad, setAdCiudad] = useState('');
  const [adPais, setAdPais] = useState('');
  const [adExtra, setAdExtra] = useState('');
  const [adAlias, setAdAlias] = useState('');
  const [adAgeRange, setAdAgeRange] = useState<AgeRangeId | ''>('');
  const [adSex, setAdSex] = useState<'' | SubmissionSexApi>('');
  const [adEmail, setAdEmail] = useState('');

  const textDraftLoadedRef = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLiveMicStream(null);
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

  useEffect(() => {
    setFlowStage('welcome');
    setAdStoryTitle('');
    setAdCiudad('');
    setAdPais('');
    setAdExtra('');
    setAdAlias('');
    setAdAgeRange('');
    setAdSex('');
    setAdEmail('');
    setVideoFile(null);
    setVideoUrl('');
    setTextStory('');
    setFotoCaption('');
    setPhotoFiles([]);
    setAudioUrl('');
    setAudioFile(null);
    setRecordedBlob(null);
    setRecordedMime('');
    setPhase('idle');
    setRecording(false);
    setLocalErr('');
    textDraftLoadedRef.current = false;
  }, [format]);

  useEffect(() => {
    if (format !== 'texto' || textDraftLoadedRef.current || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(TEXT_DRAFT_KEY);
      if (raw) {
        textDraftLoadedRef.current = true;
        setTextStory(raw.slice(0, SUBIR_TEXT_MAX_CHARS));
      }
    } catch {
      /* ignore */
    }
  }, [format]);

  useEffect(() => {
    if (format !== 'texto' || typeof window === 'undefined') return;
    try {
      if (textStory.trim()) localStorage.setItem(TEXT_DRAFT_KEY, textStory);
      else localStorage.removeItem(TEXT_DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, [format, textStory]);

  useEffect(() => {
    if (!restoredCapture?.submissionPrefill && !restoredCapture?.audioPrefill) return;
    const p = restoredCapture.submissionPrefill ?? restoredCapture.audioPrefill;
    if (!p) return;
    setAdStoryTitle(p.storyTitle);
    setAdCiudad(p.ciudad);
    setAdPais(p.pais);
    setAdExtra(p.extraStory);
    setAdAlias(p.alias);
    setAdAgeRange(p.ageRange);
    setAdSex(p.sex);
    setAdEmail(p.email);
    if (format === 'texto') setTextStory(restoredCapture.narrativeText.slice(0, SUBIR_TEXT_MAX_CHARS));
    if (format === 'foto') {
      if (restoredCapture.photoFiles?.length) setPhotoFiles(restoredCapture.photoFiles);
      if (restoredCapture.fotoContext != null) setFotoCaption(restoredCapture.fotoContext);
    }
    if (format === 'video') {
      setVideoUrl(restoredCapture.videoUrl);
      if (restoredCapture.videoFile) setVideoFile(restoredCapture.videoFile);
      if (restoredCapture.recordedBlob) {
        setRecordedBlob(restoredCapture.recordedBlob);
        setRecordedMime(restoredCapture.recordedMime);
        const url = URL.createObjectURL(restoredCapture.recordedBlob);
        setPreviewUrl(url);
        setPhase('review');
      } else {
        setPhase('idle');
      }
    }
    if (format === 'audio') {
      setAudioUrl(restoredCapture.audioUrl);
      setAudioFile(restoredCapture.audioFile);
      if (restoredCapture.recordedBlob) {
        setRecordedBlob(restoredCapture.recordedBlob);
        setRecordedMime(restoredCapture.recordedMime);
        const url = URL.createObjectURL(restoredCapture.recordedBlob);
        setPreviewUrl(url);
        setPhase('review');
      } else {
        setPhase('idle');
      }
    }
    setFlowStage('personDetails');
    setLocalErr('');
  }, [hydrateKey, restoredCapture, format, setPreviewUrl]);

  useEffect(() => {
    if (!videoFile) {
      setVideoFilePreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(videoFile);
    setVideoFilePreviewUrl(u);
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [videoFile]);

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
        setLiveMicStream(null);
        await videoLiveRef.current.play().catch(() => {});
      } else {
        setLiveMicStream(stream);
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
    setVideoFile(null);
  }, [clearReviewUrl]);

  const backToWelcomeFromPicker = useCallback(() => {
    stopStream();
    setRecordedBlob(null);
    setRecordedMime('');
    clearReviewUrl();
    setPhase('idle');
    setRecording(false);
    setAudioFile(null);
    setAudioUrl('');
    setVideoFile(null);
    setVideoUrl('');
    setFlowStage('welcome');
    setLocalErr('');
  }, [stopStream, clearReviewUrl]);

  const canContinue = useCallback((): boolean => {
    if (flowStage === 'welcome') return false;

    if (flowStage === 'media') {
      if (format === 'audio') {
        return (
          recordedBlob != null ||
          audioFile != null ||
          (audioUrl.trim().length > 0 && /^https?:\/\//i.test(audioUrl))
        );
      }
      if (format === 'video') {
        return (
          recordedBlob != null ||
          videoFile != null ||
          (videoUrl.trim().length > 0 && isVideoUrl(videoUrl))
        );
      }
      if (format === 'texto') {
        const len = textStory.trim().length;
        return len >= NARRATIVE_MIN && len <= SUBIR_TEXT_MAX_CHARS;
      }
      if (format === 'foto') {
        return photoFiles.length >= SUBIR_PHOTO_MIN && photoFiles.length <= SUBIR_PHOTO_MAX;
      }
      return false;
    }

    if (flowStage === 'storyDetails') {
      return (
        adStoryTitle.trim().length >= 2 &&
        adCiudad.trim().length >= 1 &&
        adPais.trim().length >= 2
      );
    }

    if (flowStage === 'personDetails') {
      return (
        adAlias.trim().length >= 2 &&
        adAgeRange !== '' &&
        adSex !== '' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adEmail.trim())
      );
    }

    return false;
  }, [
    flowStage,
    format,
    recordedBlob,
    audioFile,
    audioUrl,
    videoFile,
    videoUrl,
    textStory,
    photoFiles,
    fotoCaption,
    adStoryTitle,
    adCiudad,
    adPais,
    adAlias,
    adAgeRange,
    adSex,
    adEmail,
  ]);

  const handleContinue = useCallback(() => {
    if (flowStage === 'welcome') return;

    if (flowStage === 'media') {
      if (!canContinue()) {
        if (format === 'texto') {
          setLocalErr(
            textStory.trim().length > SUBIR_TEXT_MAX_CHARS
              ? `Máximo ${SUBIR_TEXT_MAX_CHARS} caracteres (~2 carillas).`
              : `Escribe al menos ${NARRATIVE_MIN} caracteres para poder seguir.`
          );
        } else if (format === 'foto') {
          setLocalErr(
            photoFiles.length > SUBIR_PHOTO_MAX
              ? UPLOAD_PHOTO_MAX_MESSAGE
              : `Sube al menos ${SUBIR_PHOTO_MIN} foto para continuar.`
          );
        } else if (format === 'video') {
          setLocalErr('Graba un momento, sube un video desde tu equipo o pega un enlace de YouTube o Vimeo.');
        } else {
          setLocalErr('Graba un momento en voz o elige un audio para seguir.');
        }
        return;
      }
      setLocalErr('');
      setFlowStage('storyDetails');
      return;
    }

    if (flowStage === 'storyDetails') {
      if (!canContinue()) {
        setLocalErr('Revisa el nombre de la historia, la ciudad y el país.');
        return;
      }
      setLocalErr('');
      setFlowStage('personDetails');
      return;
    }

    if (flowStage === 'personDetails') {
      if (!canContinue()) {
        setLocalErr('Revisa nombre o alias, etapa etaria, género y un correo válido.');
        return;
      }
      setLocalErr('');
      const meta = {
        storyTitle: adStoryTitle.trim(),
        ciudad: adCiudad.trim(),
        pais: adPais.trim(),
        extraStory: adExtra.trim(),
      };
      let narrativeText: string;
      if (format === 'texto') {
        narrativeText = textStory.trim().slice(0, SUBIR_TEXT_MAX_CHARS);
      } else if (format === 'foto') {
        narrativeText =
          fotoCaption.trim().length > 0
            ? fotoCaption.trim()
            : buildSubmissionNarrativeText('foto', meta);
      } else {
        narrativeText = buildSubmissionNarrativeText(format, meta);
      }
      const prefill: SubmissionPrefill = {
        storyTitle: meta.storyTitle,
        ciudad: meta.ciudad,
        pais: meta.pais,
        extraStory: meta.extraStory,
        alias: adAlias.trim(),
        ageRange: adAgeRange as AgeRangeId,
        sex: adSex as SubmissionSexApi,
        email: adEmail.trim(),
      };
      const out: CaptureOutcome = {
        narrativeText:
          format === 'texto' ? narrativeText : narrativeText.slice(0, 2000),
        recordedBlob,
        recordedMime,
        photoFiles,
        videoUrl: videoUrl.trim(),
        audioUrl: audioUrl.trim(),
        audioFile,
        videoFile: format === 'video' ? videoFile : undefined,
        fotoContext: format === 'foto' ? fotoCaption : undefined,
        submissionPrefill: prefill,
        audioPrefill: prefill,
      };
      onContinue(out);
    }
  }, [
    flowStage,
    canContinue,
    format,
    textStory,
    fotoCaption,
    photoFiles,
    videoUrl,
    videoFile,
    audioUrl,
    audioFile,
    recordedBlob,
    recordedMime,
    adStoryTitle,
    adCiudad,
    adPais,
    adExtra,
    adAlias,
    adAgeRange,
    adSex,
    adEmail,
    onContinue,
  ]);

  const voiceWaveMode: VoiceWaveformMode =
    format !== 'audio' || flowStage !== 'media'
      ? 'idle'
      : localErr && phase === 'idle'
        ? 'error'
        : phase === 'review'
          ? 'stopped'
          : phase === 'live' && recording
            ? 'recording'
            : phase === 'live'
              ? 'listening'
              : 'idle';

  const continueButtonLabel =
    flowStage === 'welcome'
      ? ''
      : flowStage === 'media'
        ? 'Continuar — datos de tu historia'
        : flowStage === 'storyDetails'
          ? 'Continuar — un poco sobre ti'
          : 'Seguir al envío';

  const showContinueButton = flowStage !== 'welcome';

  const footerNote =
    flowStage === 'welcome'
      ? 'Tu historia quedará en revisión antes de formar parte de AlmaMundi.'
      : flowStage === 'media'
        ? 'Puedes tomarte el tiempo que necesites. Nada se publica automáticamente.'
        : flowStage === 'storyDetails'
          ? 'Estos datos ayudan a ubicar tu relato si llega al mapa.'
          : 'Con tu correo te avisaremos del estado de tu historia; no será visible públicamente.';

  const stepBadge =
    flowStage === 'welcome' || flowStage === 'media'
      ? 'Paso 1 · Tu historia'
      : flowStage === 'storyDetails'
        ? 'Paso 2 · Datos de la historia'
        : 'Paso 3 · Datos de la persona';

  const modalCopy = UPLOAD_MODAL_COPY[format];
  const formatWelcomeTitle = format === 'foto' ? modalCopy.title : modalCopy.title.replace(/\n/g, ' ');
  const formatWelcomeBody = [modalCopy.subtitle, modalCopy.limit].filter(Boolean).join(' ');

  const addPhotoFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    setPhotoFiles((prev) => {
      const next = [...prev];
      for (const f of Array.from(list)) {
        if (next.length >= SUBIR_PHOTO_MAX) {
          setLocalErr(UPLOAD_PHOTO_MAX_MESSAGE);
          break;
        }
        if (f.size > PHOTO_MAX_MB * 1024 * 1024) {
          setLocalErr(`Cada imagen: máximo ${PHOTO_MAX_MB} MB.`);
          return prev;
        }
        if (!/^image\/(jpeg|png|webp|heic|heif|jpg)$/i.test(f.type)) {
          setLocalErr('Formato: JPG, PNG, WEBP o HEIC.');
          return prev;
        }
        next.push(f);
      }
      setLocalErr('');
      return next;
    });
  }, []);

  useEffect(() => {
    const urls = photoFiles.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photoFiles]);

  const removePhotoAt = useCallback((index: number) => {
    setPhotoFiles((p) => p.filter((_, i) => i !== index));
    setLocalErr('');
  }, []);

  return (
    <section className="space-y-8 md:space-y-10" aria-label="Captura de tu historia" aria-current="step">
      <header className="space-y-4 md:space-y-5">
        <p className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-orange-600">AlmaMundi</p>
        <h1 className="sr-only">{formatWelcomeTitle}</h1>
        {flowStage === 'welcome' && (
          <div className="space-y-3 max-w-2xl">
            <h2
              className={amStyles.amModalTitle}
              style={{ whiteSpace: format === 'foto' ? 'pre-line' : 'normal' }}
            >
              {formatWelcomeTitle}
            </h2>
            <p className={amStyles.amModalSubtitle}>{modalCopy.subtitle}</p>
            {modalCopy.limit && format !== 'texto' ? (
              <p className={amStyles.amModalLimit}>{modalCopy.limit}</p>
            ) : null}
          </div>
        )}
        {flowStage !== 'welcome' && (
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600/90">{stepBadge}</p>
            {flowStage === 'media' && (
              <p className="text-base md:text-lg leading-relaxed" style={{ color: neu.textBody }}>
                {format === 'video' && videoMode === 'grabar'
                  ? 'Te pediremos permiso para usar la cámara y el micrófono. Puedes detener la grabación cuando quieras.'
                  : format === 'video'
                    ? 'Puedes traer un video desde tu equipo o pegar un enlace de YouTube o Vimeo.'
                    : format === 'audio' && audioMode === 'grabar'
                      ? 'Activa el micrófono cuando estés listo. Puedes detener cuando quieras y escuchar antes de seguir.'
                      : format === 'audio'
                        ? 'Elige un audio de tu equipo o pega un enlace que empiece por https://'
                        : format === 'texto'
                          ? 'Este es tu espacio para contar. Puedes editar hasta que pulses continuar.'
                          : 'Elige una o varias fotos y escribe el contexto con calma.'}
              </p>
            )}
            {flowStage === 'storyDetails' && (
              <>
                <h2 className="text-xl md:text-2xl font-light leading-snug" style={{ color: neu.textMain }}>
                  Datos de tu historia
                </h2>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: neu.textBody }}>
                  Así podremos reconocer tu relato con claridad si llega a publicarse.
                </p>
              </>
            )}
            {flowStage === 'personDetails' && (
              <>
                <h2 className="text-xl md:text-2xl font-light leading-snug" style={{ color: neu.textMain }}>
                  Un poco sobre ti
                </h2>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: neu.textBody }}>
                  Nos ayuda a dirigirnos a ti con respeto y a mantenerte al tanto por correo.
                </p>
              </>
            )}
          </div>
        )}
      </header>

      {localErr && (
        <p className="text-base text-red-600 font-medium" role="alert">
          {localErr}
        </p>
      )}

      {flowStage === 'storyDetails' && (
        <div className="mx-auto max-w-xl space-y-5">
          <button
            type="button"
            onClick={() => {
              setFlowStage('media');
              setLocalErr('');
            }}
            className="text-sm font-medium px-4 py-2 rounded-full"
            style={{ ...neu.button, color: neu.textBody }}
          >
            ← Volver a tu historia
          </button>
          <div style={neoSurface} className="p-5 md:p-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
              Tu historia
            </p>
            <div>
              <label htmlFor="ad-story-title" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                Nombre de la historia
              </label>
              <input
                id="ad-story-title"
                type="text"
                value={adStoryTitle}
                onChange={(e) => setAdStoryTitle(e.target.value)}
                placeholder="Cómo quieres llamar a este relato"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/55 border border-white/60"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ad-ciudad" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                  Ciudad o localidad
                </label>
                <input
                  id="ad-ciudad"
                  type="text"
                  value={adCiudad}
                  onChange={(e) => setAdCiudad(e.target.value)}
                  placeholder="Ej: Oaxaca"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/55 border border-white/60"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
              </div>
              <div>
                <label htmlFor="ad-pais" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                  País
                </label>
                <input
                  id="ad-pais"
                  type="text"
                  value={adPais}
                  onChange={(e) => setAdPais(e.target.value)}
                  placeholder="Ej: México"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/55 border border-white/60"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="ad-extra" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                ¿Quieres agregar algo más sobre esta historia?
              </label>
              <p className="text-xs mb-1.5" style={{ color: neu.textBody }}>
                Es opcional. Si quieres, aquí puedes ampliar contexto o un detalle que te importe.
              </p>
              <textarea
                id="ad-extra"
                value={adExtra}
                onChange={(e) => setAdExtra(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/55 border border-white/60 resize-y min-h-[100px]"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>
          </div>
        </div>
      )}

      {flowStage === 'personDetails' && (
        <div className="mx-auto max-w-xl space-y-5">
          <button
            type="button"
            onClick={() => {
              setFlowStage('storyDetails');
              setLocalErr('');
            }}
            className="text-sm font-medium px-4 py-2 rounded-full"
            style={{ ...neu.button, color: neu.textBody }}
          >
            ← Volver a los datos de la historia
          </button>
          <div style={neoSurface} className="p-5 md:p-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
              Sobre ti
            </p>
            <div>
              <label htmlFor="ad-alias" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                Nombre o alias
              </label>
              <input
                id="ad-alias"
                type="text"
                value={adAlias}
                onChange={(e) => setAdAlias(e.target.value)}
                placeholder="Cómo te gustaría que te llamemos"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/55 border border-white/60"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>
            <div>
              <label htmlFor="ad-age" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                Etapa etaria
              </label>
              <select
                id="ad-age"
                value={adAgeRange}
                onChange={(e) => setAdAgeRange(e.target.value as AgeRangeId | '')}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/55 border border-white/60"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              >
                <option value="">Elige una opción</option>
                {AGE_RANGE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ad-sex" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                Género
              </label>
              <select
                id="ad-sex"
                value={adSex}
                onChange={(e) => setAdSex(e.target.value as '' | SubmissionSexApi)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/55 border border-white/60"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              >
                <option value="">Elige una opción</option>
                <option value="femenino">Mujer</option>
                <option value="masculino">Hombre</option>
                <option value="no-binario">No binario</option>
                <option value="prefiero-no-decir">Prefiero no decirlo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="ad-email" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                Correo electrónico
              </label>
              <input
                id="ad-email"
                type="email"
                value={adEmail}
                onChange={(e) => setAdEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/55 border border-white/60"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
              <p className="mt-1.5 text-[11px] leading-snug" style={{ color: neu.textBody }}>
                Usaremos tu correo para avisarte sobre el estado de tu historia y si llega a publicarse en el mapa. No
                será visible públicamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {format === 'texto' && flowStage === 'welcome' && (
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => {
              setFlowStage('media');
              setLocalErr('');
            }}
            className="w-full py-4 md:py-5 rounded-full font-bold text-base text-white"
            style={{ background: orangeCta, boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
          >
            Comenzar a escribir
          </button>
        </div>
      )}

      {format === 'texto' && flowStage === 'media' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => {
              setFlowStage('welcome');
              setLocalErr('');
            }}
            className="text-sm font-medium px-4 py-2 rounded-full"
            style={{ ...neu.button, color: neu.textBody }}
          >
            ← Volver
          </button>
          <div style={neoSurface} className="p-6 md:p-8 space-y-4">
            <label htmlFor="capture-texto-relato" className="block text-lg md:text-xl font-semibold" style={{ color: neu.textMain }}>
              Tu relato
            </label>
            <textarea
              id="capture-texto-relato"
              value={textStory}
              onChange={(e) => setTextStory(e.target.value.slice(0, SUBIR_TEXT_MAX_CHARS))}
              rows={14}
              placeholder="Empieza aquí… puede ser una escena, un recuerdo, una voz, un lugar o una frase que no quieres perder."
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
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'Una escena que recuerdas',
                  'Un lugar que cambió',
                  'Una persona que marcó tu vida',
                  'Algo que nunca dijiste',
                ] as const
              ).map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() =>
                    setTextStory((prev) => {
                      const prefix = prev.trim().length ? `${prev.trim()}\n\n` : '';
                      return `${prefix}${hint}…`.slice(0, SUBIR_TEXT_MAX_CHARS);
                    })
                  }
                  className="rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ ...neu.button, color: neu.textBody }}
                >
                  {hint}
                </button>
              ))}
            </div>
            <p id="capture-texto-relato-count" className="text-sm md:text-base" style={{ color: neu.textBody }}>
              {textStory.length.toLocaleString('es')} caracteres ·{' '}
              {textStory.trim().split(/\s+/).filter(Boolean).length.toLocaleString('es')} palabras (máx.{' '}
              {SUBIR_TEXT_MAX_CHARS.toLocaleString('es')} caracteres)
            </p>
            {textStory.trim().length > 0 && textStory.trim().length < NARRATIVE_MIN && (
              <p id="capture-texto-relato-error" className="text-sm text-amber-700" role="alert">
                Escribe al menos {NARRATIVE_MIN} caracteres para poder seguir.
              </p>
            )}
          </div>
        </div>
      )}

      {format === 'foto' && flowStage === 'welcome' && (
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => {
              setFlowStage('media');
              setLocalErr('');
            }}
            className={amStyles.amModalBtnPrimary}
          >
            Comenzar
          </button>
        </div>
      )}

      {format === 'foto' && flowStage === 'media' && (
        <div className="mx-auto w-full max-w-[620px]">
          <div className={amStyles.amCaptureEditorialPanel}>
            <button
              type="button"
              onClick={() => {
                setFlowStage('welcome');
                setLocalErr('');
              }}
              className="mb-6 text-sm font-medium px-4 py-2 rounded-full"
              style={{ ...neu.button, color: neu.textBody }}
            >
              ← Volver
            </button>
            <UploadModalFotoCapture
              photoFiles={photoFiles}
              photoPreviews={photoPreviews}
              onAddFiles={addPhotoFiles}
              onRemove={removePhotoAt}
              inlineError={localErr || undefined}
            />
            <div className="mt-6 space-y-2">
              <label htmlFor="capture-foto-caption" className="block text-sm font-medium text-[#1c1c2e]">
                Contexto de tus fotos (opcional)
              </label>
              <textarea
                id="capture-foto-caption"
                value={fotoCaption}
                onChange={(e) => setFotoCaption(e.target.value)}
                rows={5}
                placeholder="¿Qué guardan estas imágenes? Quién aparece, dónde fueron, por qué importan…"
                className={amStyles.amTextarea}
                aria-label="Contexto de las fotos"
              />
            </div>
          </div>
        </div>
      )}

      {format === 'video' && flowStage === 'welcome' && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => {
              setVideoMode('grabar');
              setFlowStage('media');
              setPhase('idle');
              setLocalErr('');
              setVideoFile(null);
              setVideoUrl('');
              clearReviewUrl();
              setRecordedBlob(null);
              setRecordedMime('');
            }}
            className="rounded-[1.75rem] p-6 md:p-7 text-left transition-all hover:-translate-y-0.5 active:scale-[0.99]"
            style={{ ...neu.card, boxShadow: `${neu.card.boxShadow}, 0 14px 32px rgba(163,177,198,0.22)` }}
          >
            <Video className="h-9 w-9 text-orange-500 mb-3" aria-hidden />
            <span className="block text-lg font-semibold mb-2" style={{ color: neu.textMain }}>
              Grabar video
            </span>
            <span className="text-sm leading-relaxed" style={{ color: neu.textBody }}>
              Usa la cámara y el micrófono cuando estés listo. Puedes detener y repetir si quieres.
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setVideoMode('enlace');
              setFlowStage('media');
              setLocalErr('');
              stopStream();
              setRecordedBlob(null);
              setRecordedMime('');
              clearReviewUrl();
              setPhase('idle');
              setRecording(false);
            }}
            className="rounded-[1.75rem] p-6 md:p-7 text-left transition-all hover:-translate-y-0.5 active:scale-[0.99]"
            style={{ ...neu.card, boxShadow: `${neu.card.boxShadow}, 0 14px 32px rgba(163,177,198,0.22)` }}
          >
            <Upload className="h-9 w-9 text-orange-500 mb-3" aria-hidden />
            <span className="block text-lg font-semibold mb-2" style={{ color: neu.textMain }}>
              Subir video o pegar enlace
            </span>
            <span className="text-sm leading-relaxed" style={{ color: neu.textBody }}>
              Si ya tienes un archivo o un enlace de YouTube o Vimeo, puedes traerlo aquí.
            </span>
          </button>
        </div>
      )}

      {format === 'video' && flowStage === 'media' && (
        <div className="space-y-5 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={backToWelcomeFromPicker}
              className="text-sm font-medium px-4 py-2 rounded-full"
              style={{ ...neu.button, color: neu.textBody }}
            >
              ← Cambiar forma de contar
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setVideoMode('grabar');
                setVideoFile(null);
                setVideoUrl('');
                setLocalErr('');
              }}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={videoMode === 'grabar' ? { ...neu.button, color: neu.orange } : neu.button}
            >
              <Video className="inline h-4 w-4 mr-1.5 align-text-bottom" aria-hidden />
              Grabar video
            </button>
            <button
              type="button"
              onClick={() => {
                setVideoMode('enlace');
                stopStream();
                setRecordedBlob(null);
                setRecordedMime('');
                clearReviewUrl();
                setPhase('idle');
                setRecording(false);
                setLocalErr('');
              }}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={videoMode === 'enlace' ? { ...neu.button, color: neu.orange } : neu.button}
            >
              <Link2 className="inline h-4 w-4 mr-1.5 align-text-bottom" aria-hidden />
              Subir o enlace
            </button>
          </div>

          {videoMode === 'grabar' && (
            <div style={neoSurface} className="p-6 md:p-8 space-y-5">
              <p className="text-xs md:text-sm leading-relaxed text-center max-w-lg mx-auto" style={{ color: neu.textBody }}>
                Te pediremos permiso para usar la cámara y el micrófono. Puedes detener la grabación cuando quieras.
              </p>
              {phase === 'idle' && (
                <button
                  type="button"
                  onClick={() => void startLive()}
                  className="w-full py-4 md:py-5 rounded-full font-bold text-base md:text-lg text-white"
                  style={{ background: orangeCta, boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
                >
                  Activar cámara
                </button>
              )}
              {phase === 'live' && (
                <>
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#e8ecf4] border border-white/60">
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
                        className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm md:text-base font-bold text-white"
                        style={{ background: orangeCta, boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
                      >
                        <Video size={20} aria-hidden />
                        Empezar grabación
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm md:text-base font-bold text-white bg-red-600 shadow-lg"
                      >
                        <Square size={20} aria-hidden />
                        Detener
                      </button>
                    )}
                  </div>
                </>
              )}
              {phase === 'review' && recordedBlob && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-center" style={{ color: neu.textMain }}>
                    Escucha y mira con calma
                  </p>
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#e8ecf4] border border-white/60">
                    <video
                      ref={videoReviewRef}
                      key={previewUrl ?? 'no-preview'}
                      src={previewUrl ?? undefined}
                      className="h-full w-full object-contain"
                      playsInline
                      controls
                    />
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={discardRecording}
                      className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium"
                      style={{ ...neu.button, color: neu.textBody }}
                    >
                      <RotateCcw size={16} aria-hidden />
                      Volver a grabar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {videoMode === 'enlace' && (
            <div style={neoSurface} className="p-6 md:p-8 space-y-5">
              <label htmlFor="capture-video-file" className="flex items-center gap-2 text-base font-semibold" style={{ color: neu.textMain }}>
                <Upload className="h-5 w-5 text-orange-500" aria-hidden />
                Video desde tu equipo (máx. {VIDEO_UPLOAD_MAX_MB} MB)
              </label>
              <p className="text-xs leading-relaxed" style={{ color: neu.textBody }}>
                MP4, WebM u otros formatos habituales. Comprobamos la duración cuando el navegador lo permite (máx.{' '}
                {SUBIR_AV_MAX_MINUTES} minutos).
              </p>
              <input
                id="capture-video-file"
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                aria-label="Elegir video desde tu equipo"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) {
                    setVideoFile(null);
                    return;
                  }
                  if (f.size > VIDEO_UPLOAD_MAX_MB * 1024 * 1024) {
                    setLocalErr(`Ese video supera los ${VIDEO_UPLOAD_MAX_MB} MB. Prueba con uno más liviano.`);
                    setVideoFile(null);
                    return;
                  }
                  void probeVideoFileDurationSeconds(f).then((sec) => {
                    if (sec != null && !isDurationWithinMax(sec)) {
                      setLocalErr(UPLOAD_DURATION_ERROR.video);
                      setVideoFile(null);
                      return;
                    }
                    setLocalErr('');
                    setVideoFile(f);
                    setVideoUrl('');
                    setRecordedBlob(null);
                    setRecordedMime('');
                    clearReviewUrl();
                    setPhase('idle');
                  });
                }}
                className="w-full text-sm"
                style={{ color: neu.textBody }}
              />
              {videoFile && (
                <p className="text-sm font-medium" style={{ color: neu.textMain }}>
                  Listo: {videoFile.name}
                </p>
              )}
              {videoFilePreviewUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#e8ecf4] border border-white/60">
                  <video
                    src={videoFilePreviewUrl}
                    className="h-full w-full object-contain"
                    playsInline
                    controls
                    muted
                  />
                </div>
              )}
              <div className="border-t border-white/40 pt-4 space-y-2">
                <label htmlFor="capture-video-url" className="block text-sm font-semibold" style={{ color: neu.textMain }}>
                  O pega un enlace (YouTube o Vimeo)
                </label>
                <input
                  id="capture-video-url"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    if (e.target.value.trim()) setVideoFile(null);
                  }}
                  placeholder="https://www.youtube.com/…"
                  className="w-full px-5 py-4 rounded-2xl text-base outline-none bg-white/55 border border-white/60"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
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
            </div>
          )}
        </div>
      )}

      {format === 'audio' && (
        <>
          {flowStage === 'welcome' && (
            <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
              <button
                type="button"
                onClick={() => {
                  setAudioMode('grabar');
                  setFlowStage('media');
                  setPhase('idle');
                  setLocalErr('');
                }}
                className="rounded-[1.75rem] p-6 md:p-7 text-left transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                style={{ ...neu.card, boxShadow: `${neu.card.boxShadow}, 0 14px 32px rgba(163,177,198,0.22)` }}
              >
                <Mic className="h-9 w-9 text-orange-500 mb-3" aria-hidden />
                <span className="block text-lg font-semibold mb-2" style={{ color: neu.textMain }}>
                  Grabar voz
                </span>
                <span className="text-sm leading-relaxed" style={{ color: neu.textBody }}>
                  Habla con calma; puedes escuchar y repetir si quieres.
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAudioMode('archivo');
                  setFlowStage('media');
                  setLocalErr('');
                }}
                className="rounded-[1.75rem] p-6 md:p-7 text-left transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                style={{ ...neu.card, boxShadow: `${neu.card.boxShadow}, 0 14px 32px rgba(163,177,198,0.22)` }}
              >
                <Link2 className="h-9 w-9 text-orange-500 mb-3" aria-hidden />
                <span className="block text-lg font-semibold mb-2" style={{ color: neu.textMain }}>
                  Subir audio o pegar enlace
                </span>
                <span className="text-sm leading-relaxed" style={{ color: neu.textBody }}>
                  Si ya tienes una grabación en tu teléfono u ordenador, puedes traerla aquí.
                </span>
              </button>
            </div>
          )}

          {flowStage === 'media' && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={backToWelcomeFromPicker}
                  className="text-sm font-medium px-4 py-2 rounded-full"
                  style={{ ...neu.button, color: neu.textBody }}
                >
                  ← Cambiar forma de contar
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAudioMode('grabar');
                    setAudioFile(null);
                    setAudioUrl('');
                    setPhase('idle');
                    setLocalErr('');
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={audioMode === 'grabar' ? { ...neu.button, color: neu.orange } : neu.button}
                >
                  Grabar voz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAudioMode('archivo');
                    stopStream();
                    setRecordedBlob(null);
                    setRecordedMime('');
                    clearReviewUrl();
                    setRecording(false);
                    setPhase('idle');
                    setLocalErr('');
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={audioMode === 'archivo' ? { ...neu.button, color: neu.orange } : neu.button}
                >
                  Subir audio o pegar enlace
                </button>
              </div>

              {audioMode === 'grabar' && (
                <div style={neoSurface} className="p-5 md:p-6 space-y-4 max-w-xl mx-auto">
                  <VoiceWaveform mediaStream={liveMicStream} mode={voiceWaveMode} className="mx-auto" />
                  <p className="text-xs md:text-sm leading-relaxed text-center max-w-md mx-auto" style={{ color: neu.textBody }}>
                    Te pediremos permiso para usar el micrófono. Puedes detener la grabación cuando quieras.
                  </p>
                  {phase === 'idle' && (
                    <button
                      type="button"
                      onClick={() => void startLive()}
                      className="w-full py-3 md:py-3.5 rounded-full font-semibold text-sm md:text-base text-white"
                      style={{ background: orangeCta, boxShadow: '0 6px 20px rgba(255,69,0,0.3)' }}
                    >
                      Activar micrófono
                    </button>
                  )}
                  {phase === 'live' && (
                    <div className="flex flex-col items-center gap-4 py-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/15">
                        <Mic className="h-6 w-6 text-orange-600" aria-hidden />
                      </div>
                      {!recording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="rounded-full px-8 py-3 text-sm md:text-base font-semibold text-white"
                          style={{ background: orangeCta, boxShadow: '0 6px 20px rgba(255,69,0,0.3)' }}
                        >
                          Empezar grabación
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="rounded-full px-8 py-3 text-sm md:text-base font-semibold text-white bg-red-600 shadow-md"
                        >
                          Detener
                        </button>
                      )}
                    </div>
                  )}
                  {phase === 'review' && recordedBlob && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-center" style={{ color: neu.textMain }}>
                        Escucha con calma
                      </p>
                      <audio src={previewUrl ?? undefined} controls className="w-full rounded-xl" />
                      <button
                        type="button"
                        onClick={discardRecording}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium"
                        style={{ ...neu.button, color: neu.textBody }}
                      >
                        <RotateCcw size={16} aria-hidden />
                        Volver a grabar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {audioMode === 'archivo' && (
                <div style={neoSurface} className="p-5 md:p-6 space-y-4 max-w-xl mx-auto">
                  <label htmlFor="capture-audio-file" className="block text-sm font-semibold" style={{ color: neu.textMain }}>
                    Audio desde tu equipo (hasta {AUDIO_MAX_MB} MB)
                  </label>
                  <p className="text-xs leading-relaxed" style={{ color: neu.textBody }}>
                    Formatos habituales: MP3, WAV, M4A… Si es muy pesado, prueba a comprimirlo un poco antes.
                  </p>
                  <input
                    id="capture-audio-file"
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a"
                    aria-label="Elegir audio desde tu equipo"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) {
                        setAudioFile(null);
                        return;
                      }
                      if (f.size > AUDIO_MAX_MB * 1024 * 1024) {
                        setLocalErr(`Ese audio supera los ${AUDIO_MAX_MB} MB. Prueba con uno más liviano.`);
                        setAudioFile(null);
                        return;
                      }
                      void probeAudioFileDurationSeconds(f).then((sec) => {
                        if (sec != null && !isDurationWithinMax(sec)) {
                          setLocalErr(UPLOAD_DURATION_ERROR.audio);
                          setAudioFile(null);
                          return;
                        }
                        setLocalErr('');
                        setAudioFile(f);
                      });
                    }}
                    className="w-full text-sm"
                    style={{ color: neu.textBody }}
                  />
                  <label htmlFor="capture-audio-url" className="block text-sm font-semibold pt-2" style={{ color: neu.textMain }}>
                    O pega un enlace
                  </label>
                  <input
                    id="capture-audio-url"
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white/55 border border-white/60"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  />
                </div>
              )}
            </>
          )}

        </>
      )}

      <p
        style={{
          fontSize: 12,
          color: '#9299a8',
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 0,
          fontFamily: neu.APP_FONT,
        }}
      >
        {footerNote}
      </p>
      {showContinueButton && (
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-4 md:py-5 rounded-full font-bold text-white text-base md:text-lg uppercase tracking-wide mt-4"
          style={{
            background: canContinue() ? orangeCta : '#9ca3af',
            boxShadow: canContinue() ? '0 10px 32px rgba(255,69,0,0.4)' : 'none',
          }}
        >
          {continueButtonLabel}
        </button>
      )}
    </section>
  );
}
