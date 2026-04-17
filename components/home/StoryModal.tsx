'use client';

import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  X,
  Mic,
  Video,
  Square,
  Check,
  Download,
  Share2,
  RefreshCw,
  FileText,
  User,
  Upload,
  Users,
  MapPin,
  Globe2,
  Mail,
  Camera,
  Images,
} from 'lucide-react';
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
import {
  drawHuellaV2OnCanvas,
  limpiarNombreFoto,
  type HuellaV2Format,
} from '@/lib/huella/huellaV2';

const jakartaHuella = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
});

const frauncesHuella = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
});

export type StoryModalMode = 'video' | 'audio' | 'texto' | 'foto';

export type StoryModalStep = 'capture' | 'details' | 'received';

export type ChosenInspirationTopic = {
  title: string;
  questions: string[];
};

const APP_FONT = "'Avenir Light', Avenir, system-ui, sans-serif";

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E8EBF2',
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: [
      '14px 14px 34px rgba(136, 150, 170, 0.48)',
      '-14px -14px 38px rgba(255, 255, 255, 0.98)',
      'inset 2px 2px 4px rgba(255, 255, 255, 0.75)',
      'inset -3px -3px 8px rgba(163, 177, 198, 0.22)',
    ].join(', '),
  },
  inset: {
    backgroundColor: '#E0E5EC',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow:
      'inset 8px 8px 14px rgba(163,177,198,0.7), inset -8px -8px 14px rgba(255,255,255,0.85)',
  },
  button: {
    backgroundColor: '#E9ECF3',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: APP_FONT,
    transition: 'transform 0.2s ease, box-shadow 0.25s ease, color 0.2s ease',
    boxShadow: [
      '11px 11px 26px rgba(136, 150, 170, 0.45)',
      '-11px -11px 26px rgba(255, 255, 255, 0.96)',
      'inset 1px 1px 3px rgba(255, 255, 255, 0.65)',
      'inset -2px -2px 6px rgba(163, 177, 198, 0.18)',
    ].join(', '),
  },
} as const;

type CaptureIntroBlock = {
  title: string;
  lead: string;
  /** Línea aparte (p. ej. duración en video/audio). */
  meta?: string;
};

/** Encabezado del paso en que la persona graba, escribe o sube su historia. */
const CAPTURE_INTRO: Record<StoryModalMode, CaptureIntroBlock> = {
  video: {
    title: 'Graba el momento que no quisiste olvidar',
    lead: 'No necesitas guión. Solo habla. Lo que viviste merece verse, no solo leerse.',
    meta: `Duración máxima: ${SUBIR_AV_MAX_MINUTES} minutos de video.`,
  },
  audio: {
    title: 'Hay historias que se entienden mejor cuando se escuchan',
    lead: 'Graba con lo que tengas. Tu voz ya lleva todo lo que las palabras escritas no pueden.',
    meta: `Duración máxima: ${SUBIR_AV_MAX_MINUTES} minutos de audio.`,
  },
  texto: {
    title: 'Escribe lo que no le contaste a nadie, o lo que le contaste a todos',
    lead: 'Aquí no se pierde en el scroll. Queda en el mapa.',
  },
  foto: {
    title: 'Una imagen que guardaste por algo',
    lead: 'No tiene que ser perfecta. Tiene que ser tuya.',
  },
};

const PRIVACY_URL = 'https://almamundi.org';
const MAX_PROFILE_PHOTO_MB = 8;
const MAX_EXTRA_FILE_MB = 15;

type Sex = '' | 'Mujer' | 'Hombre' | 'No binario' | 'Otro' | 'Prefiero no decir';

type AgeRange =
  | ''
  | '13-17'
  | '18-24'
  | '25-34'
  | '35-44'
  | '45-54'
  | '55-64'
  | '65+'
  | 'Prefiero no decir';

function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function pickVideoMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const types = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function pickAudioMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function probeVideoBlobDurationSeconds(blob: Blob): Promise<number | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const el = document.createElement('video');
    const objectUrl = URL.createObjectURL(blob);
    const finish = (sec: number | null) => {
      URL.revokeObjectURL(objectUrl);
      el.removeAttribute('src');
      resolve(sec);
    };
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const d = el.duration;
      finish(Number.isFinite(d) ? d : null);
    };
    el.onerror = () => finish(null);
    el.src = objectUrl;
  });
}

function modalModeToHuellaFormat(mode: StoryModalMode): HuellaV2Format {
  return mode;
}

/** Texto y longitud que alimentan la huella v2 (palabras → colores; charCount → densidad). */
function imprintHuellaSource(args: {
  mode: StoryModalMode;
  textBody: string;
  storyTitle: string;
  extraText: string;
  photoFiles: File[];
  mediaBlob: Blob | null;
}): { content: string; charCount: number } {
  const { mode, textBody, storyTitle, extraText, photoFiles, mediaBlob } = args;
  const titleBlock = [storyTitle, extraText].filter((s) => s.trim()).join('\n').trim();

  if (mode === 'texto') {
    const content = textBody.trim() || titleBlock || storyTitle;
    return { content, charCount: Math.max(content.length, 1) };
  }

  if (mode === 'foto') {
    const fromNames = photoFiles.map((f) => limpiarNombreFoto(f.name)).filter(Boolean).join(' ');
    const content = fromNames || titleBlock || textBody.trim() || storyTitle;
    const rawLen = photoFiles.map((f) => f.name).join(' ').length;
    return {
      content,
      charCount: Math.max(rawLen + titleBlock.length, content.length, 400),
    };
  }

  const content = titleBlock || storyTitle.trim() || 'historia';
  const avBonus = Math.min(Math.floor((mediaBlob?.size ?? 0) / 120), 14000);
  return {
    content,
    charCount: Math.max(content.length + avBonus, 900),
  };
}

type ImprintDrawArgs = {
  storyId: string;
  receivedAt: Date;
  mode: StoryModalMode;
  textBody: string;
  storyTitle: string;
  extraText: string;
  photoFiles: File[];
  mediaBlob: Blob | null;
};

const HUELLA_EXPORT_SIZE = 600;

function drawImprintPreview(canvas: HTMLCanvasElement, args: ImprintDrawArgs): void {
  const { storyId, receivedAt, mode, textBody, storyTitle, extraText, photoFiles, mediaBlob } = args;
  canvas.width = HUELLA_EXPORT_SIZE;
  canvas.height = HUELLA_EXPORT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { content, charCount } = imprintHuellaSource({
    mode,
    textBody,
    storyTitle,
    extraText,
    photoFiles,
    mediaBlob,
  });

  drawHuellaV2OnCanvas(ctx, {
    storyId,
    content,
    format: modalModeToHuellaFormat(mode),
    charCount,
    submitHour: receivedAt.getHours(),
    embedSiteFooter: true,
    footerAt: receivedAt,
    embedStoryTitle: storyTitle.trim() || undefined,
  });
}

function huellaPngFilename(storyTitle: string, imprintId: string): string {
  const t = storyTitle
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t) {
    const part = t.replace(/\s/g, '-').slice(0, 88);
    return `AlmaMundi-${part}.png`;
  }
  return `AlmaMundi-huella-${imprintId}.png`;
}

export type StoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: StoryModalMode;
  chosenTopic: ChosenInspirationTopic | null;
  onClearTopic: () => void;
};

export function StoryModal({ isOpen, onClose, mode, chosenTopic, onClearTopic }: StoryModalProps) {
  const [step, setStep] = useState<StoryModalStep>('capture');
  const [err, setErr] = useState('');

  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [textBody, setTextBody] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // --- FORM: historia + extras (STEP 2 del modal: tras captura) ---
  const [storyTitle, setStoryTitle] = useState('');
  const [alias, setAlias] = useState('');
  const [extraText, setExtraText] = useState('');
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [sex, setSex] = useState<Sex>('');
  const [ageRange, setAgeRange] = useState<AgeRange>('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [wantsEmail, setWantsEmail] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [imprintId, setImprintId] = useState('');
  /** Fecha del envío mostrada en la huella (canvas y descarga). */
  const [imprintReceivedAt, setImprintReceivedAt] = useState<Date | null>(null);
  const imprintCanvasRef = useRef<HTMLCanvasElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const linkCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoLiveRef.current) videoLiveRef.current.srcObject = null;
    setStreamReady(false);
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const resetCaptureMedia = useCallback(() => {
    stopTimer();
    const mr = recorderRef.current;
    if (mr && mr.state !== 'inactive') {
      try {
        mr.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    stopStream();
    setRecording(false);
    setStreamReady(false);
    setRecordSec(0);
    setMediaBlob(null);
    revokePreview();
    chunksRef.current = [];
  }, [revokePreview, stopStream, stopTimer]);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      resetCaptureMedia();
      setStep('capture');
      setErr('');
      setTextBody('');
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setStoryTitle('');
      setAlias('');
      setExtraText('');
      setExtraFiles([]);
      setProfilePhoto(null);
      setSex('');
      setAgeRange('');
      setCity('');
      setCountry('');
      setEmail('');
      setWantsEmail(false);
      setAcceptedPrivacy(false);
      setSaving(false);
      setImprintId('');
      setImprintReceivedAt(null);
      setLinkCopied(false);
      if (linkCopiedTimerRef.current) {
        clearTimeout(linkCopiedTimerRef.current);
        linkCopiedTimerRef.current = null;
      }
      return;
    }
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setStep('capture');
      setErr('');
      if (mode === 'texto' && chosenTopic) {
        setTextBody(chosenTopic.questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n'));
      } else if (mode === 'texto') {
        setTextBody('');
      }
    }
  }, [isOpen, mode, chosenTopic, resetCaptureMedia]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
    };
  }, [stopStream, stopTimer]);

  /** Tras activar la cámara, el <video> a veces aún no está en el DOM; sin esto la vista previa/grabación queda en negro. */
  useLayoutEffect(() => {
    if (!isOpen || step !== 'capture' || mode !== 'video' || !streamReady || mediaBlob) return;
    const stream = streamRef.current;
    const el = videoLiveRef.current;
    if (!stream || !el) return;
    try {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
        void el.play().catch(() => {});
      }
    } catch (e) {
      console.error('[StoryModal] video live preview', e);
      setErr('No se pudo mostrar la cámara en este dispositivo. Prueba otro navegador.');
    }
  }, [isOpen, step, mode, streamReady, mediaBlob, recording]);

  /** Reproducción del clip grabado: `srcObject` con el Blob + `load()` suele funcionar mejor que solo `src` con blob URL. */
  useLayoutEffect(() => {
    if (!isOpen || step !== 'capture' || mode !== 'video' || !mediaBlob) {
      return;
    }
    const playback = videoPlaybackRef.current;
    if (!playback) return;
    try {
      playback.pause();
      playback.removeAttribute('src');
      playback.srcObject = mediaBlob;
      playback.muted = false;
      playback.load();
      void playback.play().catch(() => {});
    } catch (e) {
      console.error('[StoryModal] video playback preview', e);
      setErr('No se pudo reproducir la vista previa del video.');
    }
    return () => {
      try {
        playback.pause();
        playback.removeAttribute('src');
        playback.srcObject = null;
      } catch {
        /* ignore */
      }
    };
  }, [isOpen, step, mode, mediaBlob]);

  const startVideoCapture = useCallback(async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      setStreamReady(true);
      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream;
        await videoLiveRef.current.play().catch(() => {});
      }
    } catch {
      setErr('No pudimos acceder a la cámara. Revisa permisos.');
      setStreamReady(false);
    }
  }, []);

  const startAudioCapture = useCallback(async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStreamReady(true);
    } catch {
      setErr('No pudimos acceder al micrófono.');
      setStreamReady(false);
    }
  }, []);

  const startRecordingVideo = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    if (typeof MediaRecorder === 'undefined') {
      setErr('Tu navegador no permite grabar video aquí. Prueba Chrome o Firefox actualizado.');
      return;
    }
    const mime = pickVideoMime();
    if (!mime) {
      setErr('Tu navegador no permite grabar video en un formato compatible.');
      return;
    }
    chunksRef.current = [];
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, { mimeType: mime });
    } catch (e) {
      console.error('[StoryModal] MediaRecorder video', e);
      setErr('No pudimos iniciar la grabación de video en este navegador. Prueba otro formato o actualiza el navegador.');
      return;
    }
    recorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      void probeVideoBlobDurationSeconds(blob).then((sec) => {
        if (sec != null && !isDurationWithinMax(sec)) {
          setErr(`El video supera ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
          setMediaBlob(null);
          revokePreview();
          stopStream();
          stopTimer();
          setRecording(false);
          return;
        }
        setMediaBlob(blob);
        revokePreview();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopStream();
        stopTimer();
        setRecording(false);
      });
    };
    setRecordSec(0);
    timerRef.current = setInterval(() => {
      setRecordSec((s) => {
        const next = s + 1;
        if (next >= MAX_AUDIO_VIDEO_DURATION_SECONDS) {
          mr.stop();
        }
        return next;
      });
    }, 1000);
    try {
      mr.start(250);
      setRecording(true);
    } catch (e) {
      console.error('[StoryModal] MediaRecorder.start video', e);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      recorderRef.current = null;
      setRecording(false);
      setErr('No se pudo iniciar la grabación. Cierra otras apps que usen la cámara e inténtalo de nuevo.');
    }
  }, [revokePreview, stopStream, stopTimer]);

  const startRecordingAudio = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    if (typeof MediaRecorder === 'undefined') {
      setErr('Tu navegador no permite grabar audio aquí. Prueba Chrome o Firefox actualizado.');
      return;
    }
    const mime = pickAudioMime();
    if (!mime) {
      setErr('Tu navegador no permite grabar audio en un formato compatible.');
      return;
    }
    chunksRef.current = [];
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, { mimeType: mime });
    } catch (e) {
      console.error('[StoryModal] MediaRecorder audio', e);
      setErr('No pudimos iniciar la grabación de audio en este navegador.');
      return;
    }
    recorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      void probeAudioFileDurationSeconds(new File([blob], 'rec.webm', { type: blob.type })).then((sec) => {
        if (sec != null && !isDurationWithinMax(sec)) {
          setErr(`El audio supera ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
          setMediaBlob(null);
          revokePreview();
          stopStream();
          stopTimer();
          setRecording(false);
          return;
        }
        setMediaBlob(blob);
        revokePreview();
        setPreviewUrl(URL.createObjectURL(blob));
        stopStream();
        stopTimer();
        setRecording(false);
      });
    };
    setRecordSec(0);
    timerRef.current = setInterval(() => {
      setRecordSec((s) => {
        const next = s + 1;
        if (next >= MAX_AUDIO_VIDEO_DURATION_SECONDS) mr.stop();
        return next;
      });
    }, 1000);
    try {
      mr.start(250);
      setRecording(true);
    } catch (e) {
      console.error('[StoryModal] MediaRecorder.start audio', e);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      recorderRef.current = null;
      setRecording(false);
      setErr('No se pudo iniciar la grabación de audio. Revisa el micrófono e inténtalo de nuevo.');
    }
  }, [revokePreview, stopStream, stopTimer]);

  const stopRecording = useCallback(() => {
    const mr = recorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
    recorderRef.current = null;
  }, []);

  const discardRecording = useCallback(() => {
    resetCaptureMedia();
    setErr('');
  }, [resetCaptureMedia]);

  const addPhotos = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      setErr('');
      setPhotoFiles((prev) => {
        const next = [...prev];
        for (const f of Array.from(list)) {
          if (next.length >= SUBIR_PHOTO_MAX) {
            setErr(`Máximo ${SUBIR_PHOTO_MAX} fotos.`);
            break;
          }
          if (!/^image\/(jpeg|png|webp|jpg)$/i.test(f.type)) {
            setErr('Solo imágenes (JPG, PNG, WebP).');
            continue;
          }
          if (f.size > 8 * 1024 * 1024) {
            setErr('Cada foto: máximo 8 MB.');
            continue;
          }
          next.push(f);
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const urls = photoFiles.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photoFiles]);

  const removePhotoAt = useCallback((index: number) => {
    setPhotoFiles((p) => p.filter((_, i) => i !== index));
    setErr('');
  }, []);

  useEffect(() => {
    if (!profilePhoto) {
      if (profilePhotoUrl) URL.revokeObjectURL(profilePhotoUrl);
      setProfilePhotoUrl('');
      return;
    }

    const url = URL.createObjectURL(profilePhoto);
    setProfilePhotoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePhoto]);

  const addExtraFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const next = Array.from(files).filter((f) => {
      const okSize = f.size <= MAX_EXTRA_FILE_MB * 1024 * 1024;
      if (!okSize) {
        setErr(`Un archivo supera ${MAX_EXTRA_FILE_MB}MB. Prueba con uno más liviano.`);
      }
      return okSize;
    });

    setExtraFiles((prev) => [...prev, ...next]);
  }, []);

  const removeExtraFile = useCallback((idx: number) => {
    setExtraFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const onPickProfilePhoto = useCallback((file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErr('La foto debe ser una imagen (JPG/PNG/WEBP).');
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_MB * 1024 * 1024) {
      setErr(`La foto supera ${MAX_PROFILE_PHOTO_MB}MB. Usa una más liviana.`);
      return;
    }

    setErr('');
    setProfilePhoto(file);
  }, []);

  const canContinueCapture = useCallback((): boolean => {
    if (mode === 'video' || mode === 'audio') return mediaBlob != null && mediaBlob.size > 0;
    if (mode === 'texto') {
      const t = textBody.trim();
      return t.length > 0 && t.length <= SUBIR_TEXT_MAX_CHARS;
    }
    return photoFiles.length >= SUBIR_PHOTO_MIN && photoFiles.length <= SUBIR_PHOTO_MAX;
  }, [mode, mediaBlob, textBody, photoFiles.length]);

  const goDetails = useCallback(() => {
    if (!canContinueCapture()) {
      setErr('Completa este paso antes de continuar.');
      return;
    }
    setErr('');
    setStep('details');
  }, [canContinueCapture]);

  const validateDetails = useCallback(() => {
    if (!storyTitle.trim()) {
      setErr('Falta el nombre de la historia.');
      return false;
    }

    if (!sex || !ageRange || !city.trim() || !country.trim()) {
      setErr('Faltan datos obligatorios: género, edad, ciudad y país.');
      return false;
    }

    if (wantsEmail && !email.trim()) {
      setErr('Si quieres aviso por mail, escribe tu correo.');
      return false;
    }
    if (wantsEmail && email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErr('Ese correo no parece válido.');
      return false;
    }

    if (!acceptedPrivacy) {
      setErr('Para enviar, debes aceptar la política de privacidad.');
      return false;
    }

    setErr('');
    return true;
  }, [acceptedPrivacy, ageRange, city, country, email, sex, storyTitle, wantsEmail]);

  const submitDetails = useCallback(() => {
    if (saving) return;
    if (!validateDetails()) return;
    setSaving(true);
    try {
      const id = `AM-${Date.now().toString(36).toUpperCase()}`;
      setImprintId(id);
      setImprintReceivedAt(new Date());
      setStep('received');
    } finally {
      setSaving(false);
    }
  }, [saving, validateDetails]);

  useEffect(() => {
    if (step !== 'received' || !imprintCanvasRef.current || !imprintReceivedAt || !imprintId) return;
    try {
      drawImprintPreview(imprintCanvasRef.current, {
        storyId: imprintId,
        receivedAt: imprintReceivedAt,
        mode,
        textBody,
        storyTitle,
        extraText,
        photoFiles,
        mediaBlob,
      });
    } catch (e) {
      console.error('[StoryModal] drawImprintPreview', e);
    }
  }, [
    step,
    imprintId,
    imprintReceivedAt,
    mode,
    textBody,
    storyTitle,
    extraText,
    photoFiles,
    mediaBlob,
  ]);

  const downloadImprint = useCallback(() => {
    const c = imprintCanvasRef.current;
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = huellaPngFilename(storyTitle, imprintId);
    a.click();
  }, [imprintId, storyTitle]);

  const copyLink = useCallback(() => {
    if (typeof window === 'undefined' || !imprintId) return;
    const base =
      (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') || window.location.origin;
    const url = `${base}/historias/${encodeURIComponent(imprintId)}`;
    if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
    void navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      linkCopiedTimerRef.current = setTimeout(() => {
        setLinkCopied(false);
        linkCopiedTimerRef.current = null;
      }, 2200);
    });
  }, [imprintId]);

  const anotherStory = useCallback(() => {
    setLinkCopied(false);
    if (linkCopiedTimerRef.current) {
      clearTimeout(linkCopiedTimerRef.current);
      linkCopiedTimerRef.current = null;
    }
    resetCaptureMedia();
    setStep('capture');
    setTextBody(mode === 'texto' && chosenTopic ? chosenTopic.questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n') : '');
    setPhotoFiles([]);
    setImprintId('');
    setImprintReceivedAt(null);
    setStoryTitle('');
    setAlias('');
    setExtraText('');
    setExtraFiles([]);
    setProfilePhoto(null);
    setSex('');
    setAgeRange('');
    setCity('');
    setCountry('');
    setEmail('');
    setWantsEmail(false);
    setAcceptedPrivacy(false);
    setErr('');
  }, [resetCaptureMedia, mode, chosenTopic]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={step === 'details' ? 'story-modal-details-title' : 'story-modal-title'}
    >
      <div
        className="flex min-h-0 w-full max-w-4xl max-h-[min(90vh,92dvh)] flex-col overflow-hidden"
        style={{ ...soft.flat, fontFamily: APP_FONT }}
      >
        <header
          className="flex shrink-0 items-start justify-between gap-4 border-b border-white/30 px-5 py-4 md:px-8 md:py-5"
          style={{ backgroundColor: soft.bg }}
        >
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600 md:text-sm md:tracking-[0.2em]">
              ALMAMUNDI
            </p>
            {step !== 'details' && (
              <span id="story-modal-title" className="sr-only">
                {step === 'received' ? 'Confirmación de envío' : 'Captura'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:text-red-600 active:scale-95 md:h-14 md:w-14"
            style={soft.button}
            aria-label="Cerrar modal"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-5 md:px-8 md:py-6"
          style={{ backgroundColor: step === 'received' ? '#FAFAF5' : soft.bg }}
        >
          {step === 'capture' && (
            <div className="mb-6 space-y-3 px-1">
              <h3 className="text-2xl font-light leading-snug text-gray-800 md:text-3xl md:leading-snug">
                {CAPTURE_INTRO[mode].title}
              </h3>
              <p className="max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
                {CAPTURE_INTRO[mode].lead}
              </p>
              {CAPTURE_INTRO[mode].meta != null && (
                <p className="max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">{CAPTURE_INTRO[mode].meta}</p>
              )}
            </div>
          )}
          {chosenTopic && mode !== 'texto' && step === 'capture' && (
            <div
              className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-base"
              style={soft.inset}
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-700">Tema guía activo</p>
                <p className="truncate text-gray-600 md:text-lg">{chosenTopic.title}</p>
              </div>
              <button
                type="button"
                onClick={onClearTopic}
                className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-orange-700"
                style={soft.button}
                aria-label="Quitar inspiración"
              >
                Quitar
              </button>
            </div>
          )}

          {step === 'capture' && mode === 'video' && (
            <div className="space-y-4">
              {!mediaBlob && (
                <>
                  {!streamReady && !recording && (
                    <button
                      type="button"
                      onClick={() => void startVideoCapture()}
                      className="w-full rounded-full py-4 text-lg font-bold text-gray-700 md:py-5 md:text-xl"
                      style={soft.button}
                      aria-label="Activar cámara para grabar"
                    >
                      Activar cámara
                    </button>
                  )}
                  {streamReady && (
                    <div className="space-y-3 text-center">
                      <div
                        className="relative mx-auto aspect-video max-h-[280px] w-full overflow-hidden rounded-3xl bg-gray-300/40"
                        style={soft.inset}
                      >
                        <video
                          ref={videoLiveRef}
                          className="h-full w-full scale-x-[-1] object-cover"
                          playsInline
                          muted
                          autoPlay
                          aria-label={recording ? 'Grabando: vista de cámara en vivo' : 'Vista previa de cámara en vivo'}
                        />
                      </div>
                      {!recording ? (
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                          <span className="text-xl font-mono font-semibold text-gray-700 md:text-2xl" aria-live="polite">
                            {formatMmSs(recordSec)}
                          </span>
                          <button
                            type="button"
                            onClick={startRecordingVideo}
                            className="flex items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-bold text-white md:text-xl"
                            style={{ background: 'linear-gradient(180deg,#ff4500,#e63e00)', boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
                            aria-label="Comenzar a grabar video"
                          >
                            <Video size={22} aria-hidden />
                            Grabar
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xl font-semibold text-orange-600 md:text-2xl" aria-live="polite">
                            Grabando… {formatMmSs(recordSec)}
                          </p>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-8 py-4 text-lg font-bold text-white shadow-lg md:text-xl"
                            aria-label="Detener grabación"
                          >
                            <Square size={20} fill="currentColor" aria-hidden />
                            Detener
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
              {mediaBlob && previewUrl && (
                <div className="space-y-3">
                  <p className="text-center text-lg text-gray-700 md:text-xl">Revisa tu video</p>
                  <div
                    className="mx-auto aspect-video max-h-[280px] w-full overflow-hidden rounded-3xl"
                    style={soft.inset}
                  >
                    <video
                      key={previewUrl}
                      ref={videoPlaybackRef}
                      className="h-full max-h-[280px] w-full bg-black/5 object-contain"
                      playsInline
                      controls
                      preload="auto"
                      aria-label="Reproducción del video grabado"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="w-full rounded-full py-3 text-base font-semibold text-gray-600 md:text-lg"
                    style={soft.button}
                    aria-label="Volver a grabar"
                  >
                    Volver a grabar
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'capture' && mode === 'audio' && (
            <div className="space-y-4">
              {!mediaBlob && (
                <>
                  {!streamReady && !recording && (
                    <button
                      type="button"
                      onClick={() => void startAudioCapture()}
                      className="w-full rounded-full py-4 text-lg font-bold text-gray-700 md:py-5 md:text-xl"
                      style={soft.button}
                      aria-label="Activar micrófono"
                    >
                      Activar micrófono
                    </button>
                  )}
                  {streamReady && !recording && (
                    <div className="flex flex-col items-center gap-6 py-6">
                      <div
                        className="flex h-32 w-32 items-center justify-center rounded-full"
                        style={soft.inset}
                        aria-hidden
                      >
                        <Mic className="h-14 w-14 text-orange-500" />
                      </div>
                      <p className="font-mono text-2xl text-gray-700 md:text-3xl" aria-live="polite">
                        {formatMmSs(recordSec)}
                      </p>
                      <button
                        type="button"
                        onClick={startRecordingAudio}
                        className="rounded-full px-10 py-4 text-lg font-bold text-white md:text-xl"
                        style={{ background: 'linear-gradient(180deg,#ff4500,#e63e00)', boxShadow: '0 8px 24px rgba(255,69,0,0.35)' }}
                        aria-label="Grabar audio"
                      >
                        Grabar
                      </button>
                    </div>
                  )}
                  {recording && (
                    <div className="flex flex-col items-center gap-6 py-6">
                      <div
                        className="relative flex h-36 w-36 items-center justify-center rounded-full"
                        style={soft.inset}
                      >
                        <span className="absolute inset-3 animate-pulse rounded-full bg-orange-400/25" aria-hidden />
                        <Mic className="relative z-10 h-16 w-16 text-orange-600" aria-hidden />
                      </div>
                      <p className="text-xl font-semibold text-orange-600 md:text-2xl" aria-live="polite">
                        Grabando… {formatMmSs(recordSec)}
                      </p>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="rounded-full bg-red-600 px-10 py-4 text-lg font-bold text-white md:text-xl"
                        aria-label="Detener grabación de audio"
                      >
                        Detener
                      </button>
                    </div>
                  )}
                </>
              )}
              {mediaBlob && previewUrl && (
                <div className="space-y-3">
                  <p className="text-center text-lg text-gray-700 md:text-xl">Escucha tu audio</p>
                  <audio src={previewUrl} controls className="w-full" aria-label="Audio grabado" />
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="w-full rounded-full py-3 text-base font-semibold md:text-lg"
                    style={soft.button}
                    aria-label="Volver a grabar audio"
                  >
                    Volver a grabar
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'capture' && mode === 'texto' && (
            <div className="space-y-4">
              {chosenTopic && (
                <div className="space-y-3 rounded-2xl p-4" style={soft.inset}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-lg font-semibold text-gray-800 md:text-xl">Inspiración · {chosenTopic.title}</p>
                    <button
                      type="button"
                      onClick={onClearTopic}
                      className="rounded-full px-3 py-1.5 text-xs font-bold text-orange-700"
                      style={soft.button}
                      aria-label="Quitar inspiración"
                    >
                      Quitar inspiración
                    </button>
                  </div>
                  <ul className="list-inside list-disc space-y-2 text-base text-gray-600 md:text-lg">
                    {chosenTopic.questions.slice(0, 3).map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              <textarea
                id="story-textarea"
                value={textBody}
                onChange={(e) => setTextBody(e.target.value.slice(0, SUBIR_TEXT_MAX_CHARS))}
                rows={12}
                className="w-full resize-y rounded-2xl px-4 py-4 text-lg outline-none md:text-xl"
                style={{ ...soft.inset, minHeight: '220px', fontFamily: APP_FONT }}
                placeholder="Escribe aquí…"
                aria-label="Relato"
              />
              <p className="text-base text-gray-600 md:text-lg" aria-live="polite">
                {textBody.length} / {SUBIR_TEXT_MAX_CHARS} caracteres
              </p>
            </div>
          )}

          {step === 'capture' && mode === 'foto' && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                Elige fotos de tu galería o toma fotos nuevas con la cámara. Necesitas al menos {SUBIR_PHOTO_MIN} y como máximo{' '}
                {SUBIR_PHOTO_MAX} (JPG, PNG o WebP).
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-center justify-center gap-3 rounded-[18px] px-5 py-4 text-base font-bold text-gray-700 transition active:scale-[0.99] md:text-lg ${
                    photoFiles.length >= SUBIR_PHOTO_MAX ? 'pointer-events-none opacity-45' : ''
                  }`}
                  style={{ ...soft.flat, borderRadius: '18px' }}
                >
                  <Images className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                  <span>Desde la galería</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    multiple
                    disabled={photoFiles.length >= SUBIR_PHOTO_MAX}
                    className="sr-only"
                    aria-label={`Elegir imágenes de la galería, hasta ${SUBIR_PHOTO_MAX} en total`}
                    onChange={(e) => {
                      addPhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
                <label
                  className={`flex cursor-pointer items-center justify-center gap-3 rounded-[18px] px-5 py-4 text-base font-bold text-gray-700 transition active:scale-[0.99] md:text-lg ${
                    photoFiles.length >= SUBIR_PHOTO_MAX ? 'pointer-events-none opacity-45' : ''
                  }`}
                  style={{ ...soft.flat, borderRadius: '18px' }}
                >
                  <Camera className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                  <span>Tomar foto</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    capture="environment"
                    disabled={photoFiles.length >= SUBIR_PHOTO_MAX}
                    className="sr-only"
                    aria-label="Abrir cámara para tomar una foto"
                    onChange={(e) => {
                      addPhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              {photoFiles.length >= SUBIR_PHOTO_MAX && (
                <p className="text-base font-medium text-orange-700 md:text-lg">Llegaste al máximo de {SUBIR_PHOTO_MAX} fotos.</p>
              )}
              <p className="text-lg font-semibold text-gray-700 md:text-xl" aria-live="polite">
                {photoFiles.length} / {SUBIR_PHOTO_MAX} fotos
                {photoFiles.length > 0 && photoFiles.length < SUBIR_PHOTO_MIN && (
                  <span className="ml-2 text-base font-normal text-amber-700 md:text-lg">
                    (faltan {SUBIR_PHOTO_MIN - photoFiles.length} para el mínimo)
                  </span>
                )}
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {photoPreviews.map((src, i) => (
                  <div key={src} className="relative overflow-hidden rounded-2xl" style={soft.inset}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhotoAt(i)}
                      className="absolute bottom-2 right-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow"
                      aria-label={`Quitar foto ${i + 1}`}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-5">
              <div className="space-y-2 px-1">
                <h3
                  id="story-modal-details-title"
                  className="text-2xl font-light leading-tight text-gray-800 md:text-3xl"
                >
                  Un par de datos más
                </h3>
                <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                  Solo para identificar tu historia en el mapa.
                </p>
              </div>

              {/* Historia */}
              <div className="rounded-[30px] p-7" style={soft.inset}>
                <div className="text-sm font-black tracking-widest uppercase text-gray-500 mb-4 md:text-base">Historia</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                      <span className="text-orange-500">
                        <FileText size={14} />
                      </span>
                      Nombre de la historia (obligatorio)
                    </div>
                    <input
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder="Ej: El día que entendí algo"
                      className="w-full px-5 py-4 rounded-[18px] text-base outline-none text-gray-700 md:text-lg"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                      <span className="text-orange-500">
                        <User size={14} />
                      </span>
                      Nombre de la persona (opcional)
                    </div>
                    <input
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="Ej: tu nombre o cómo quieres que te llamen"
                      className="w-full px-5 py-4 rounded-[18px] text-base outline-none text-gray-700 md:text-lg"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    />
                    <div className="mt-2 text-sm text-gray-500 md:text-base">
                      Es el nombre con el que figuras como autoría; si lo dejas vacío, puedes aparecer como &quot;Anónimo/a&quot;.
                    </div>
                  </div>
                </div>
              </div>

              {/* Extras opcionales */}
              <div className="rounded-[30px] p-7" style={soft.inset}>
                <div className="text-sm font-black tracking-widest uppercase text-gray-500 mb-4 md:text-base">Extras (opcional)</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <div className="text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">Texto adicional (opcional)</div>
                    <textarea
                      value={extraText}
                      onChange={(e) => setExtraText(e.target.value)}
                      placeholder="Si quieres agregar contexto, detalles, nombres (si corresponde), o algo que no quedó en el video/audio/fotos..."
                      className="w-full min-h-[140px] rounded-[18px] p-5 text-base outline-none text-gray-700 md:text-lg"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                      <span className="text-orange-500">
                        <Upload size={14} />
                      </span>
                      Adjuntar archivos (opcional) · hasta {MAX_EXTRA_FILE_MB}MB c/u
                    </div>

                    <label
                      className="w-full px-5 py-4 rounded-[18px] flex items-center justify-between cursor-pointer text-gray-600"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    >
                      <span className="text-base md:text-lg">Seleccionar archivos</span>
                      <input type="file" multiple className="hidden" onChange={(e) => addExtraFiles(e.target.files)} />
                    </label>

                    {extraFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {extraFiles.map((f, idx) => (
                          <div
                            key={f.name + idx}
                            className="flex items-center justify-between px-4 py-3 rounded-[16px]"
                            style={{ ...soft.flat, borderRadius: '16px' }}
                          >
                            <div className="text-base text-gray-700 truncate md:text-lg">{f.name}</div>
                            <button
                              type="button"
                              onClick={() => removeExtraFile(idx)}
                              className="text-xs font-black tracking-widest uppercase text-gray-500 hover:text-red-500"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                      Foto tuya (opcional) · hasta {MAX_PROFILE_PHOTO_MB}MB
                    </div>

                    <label
                      className="w-full px-5 py-4 rounded-[18px] flex items-center justify-between cursor-pointer text-gray-600"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    >
                      <span className="text-base md:text-lg">{profilePhoto ? 'Cambiar foto' : 'Subir foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickProfilePhoto(e.target.files?.[0] ?? null)}
                      />
                    </label>

                    {profilePhotoUrl && (
                      <div className="mt-4 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-[18px] overflow-hidden" style={{ ...soft.flat, borderRadius: '18px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={profilePhotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1">
                          <div className="text-base font-bold text-gray-700 md:text-lg">{profilePhoto?.name}</div>
                          <button
                            type="button"
                            onClick={() => setProfilePhoto(null)}
                            className="mt-2 text-xs font-black tracking-widest uppercase text-gray-500 hover:text-red-500"
                          >
                            Quitar foto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Datos obligatorios */}
              <div className="rounded-[30px] p-7" style={soft.inset}>
                <div className="text-sm font-black tracking-widest uppercase text-gray-500 mb-4 md:text-base">Datos (obligatorios)</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                      <span className="text-orange-500">
                        <Users size={14} />
                      </span>
                      Género
                    </div>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value as Sex)}
                      className="w-full px-5 py-4 rounded-[18px] text-base outline-none text-gray-700 md:text-lg"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    >
                      <option value="">Selecciona</option>
                      <option value="Mujer">Mujer</option>
                      <option value="Hombre">Hombre</option>
                      <option value="No binario">No binario</option>
                      <option value="Otro">Otro</option>
                      <option value="Prefiero no decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                      <span className="text-orange-500">
                        <Users size={14} />
                      </span>
                      Rango de edad
                    </div>
                    <select
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value as AgeRange)}
                      className="w-full px-5 py-4 rounded-[18px] text-base outline-none text-gray-700 md:text-lg"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    >
                      <option value="">Selecciona</option>
                      <option value="13-17">13-17</option>
                      <option value="18-24">18-24</option>
                      <option value="25-34">25-34</option>
                      <option value="35-44">35-44</option>
                      <option value="45-54">45-54</option>
                      <option value="55-64">55-64</option>
                      <option value="65+">65+</option>
                      <option value="Prefiero no decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                      <span className="text-orange-500">
                        <MapPin size={14} />
                      </span>
                      Ciudad
                    </div>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Santiago"
                      className="w-full px-5 py-4 rounded-[18px] text-base outline-none text-gray-700 md:text-lg"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                      <span className="text-orange-500">
                        <Globe2 size={14} />
                      </span>
                      País
                    </div>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Ej: Chile"
                      className="w-full px-5 py-4 rounded-[18px] text-base outline-none text-gray-700 md:text-lg"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-start gap-3 pt-2">
                      <input
                        id="wantsEmail"
                        type="checkbox"
                        checked={wantsEmail}
                        onChange={(e) => setWantsEmail(e.target.checked)}
                        className="w-5 h-5 mt-1 accent-orange-500"
                      />
                      <label htmlFor="wantsEmail" className="text-base text-gray-600 font-bold leading-relaxed md:text-lg">
                        Quiero recibir un aviso por correo cuando mi historia aparezca en el mapa.
                      </label>
                    </div>

                    {wantsEmail && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2 md:text-sm">
                          <span className="text-orange-500">
                            <Mail size={14} />
                          </span>
                          Correo electrónico
                        </div>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@mail.com"
                          type="email"
                          className="w-full px-5 py-4 rounded-[18px] text-base outline-none text-gray-700 md:text-lg"
                          style={{ ...soft.flat, borderRadius: '18px' }}
                        />
                        <div className="mt-2 text-sm text-gray-500 md:text-base">
                          Este correo se usa solo para avisarte cuando tu historia esté visible.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 flex items-start gap-3 pt-2">
                    <input
                      id="privacy"
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                      className="w-5 h-5 mt-1 accent-orange-500"
                    />
                    <label htmlFor="privacy" className="text-base text-gray-600 font-bold leading-relaxed md:text-lg">
                      Leí y acepto la{' '}
                      <a className="text-orange-600 underline" href={PRIVACY_URL} target="_blank" rel="noreferrer">
                        política de privacidad
                      </a>
                      .
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setErr('');
                      setStep('capture');
                    }}
                    className="px-8 py-4 rounded-full text-sm font-black tracking-widest uppercase text-gray-600 active:scale-95 md:text-base"
                    style={soft.button}
                  >
                    Volver
                  </button>

                  <button
                    type="button"
                    onClick={submitDetails}
                    disabled={saving}
                    className="px-8 py-4 rounded-full text-sm font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-60 md:text-base"
                    style={{ ...soft.button, backgroundColor: '#F97316' }}
                  >
                    {saving ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'received' && (
            <div
              className={`mx-auto max-w-[480px] space-y-5 text-center ${jakartaHuella.className}`}
            >
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#D4D4C4] bg-white text-[#E8400A]">
                  <Check size={22} strokeWidth={2.2} aria-hidden />
                </div>
              </div>
              <h3
                className={`text-[clamp(1.6rem,5vw,2rem)] font-semibold leading-[1.15] text-[#141D26] ${frauncesHuella.className}`}
              >
                {alias.trim() ? (
                  <>
                    {alias.trim()},<br />
                    esta es <em className="italic font-light text-[#E8400A]">tu huella.</em>
                  </>
                ) : (
                  <>
                    Una historia nueva
                    <br />
                    ya está <em className="italic font-light text-[#E8400A]">en el mapa.</em>
                  </>
                )}
              </h3>
              <p
                className="max-w-full truncate px-1 text-[0.9375rem] font-medium leading-tight tracking-tight text-[#111418]"
                style={{
                  fontFamily:
                    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
                title={storyTitle.trim() || 'Tu historia'}
              >
                {storyTitle.trim() || 'Tu historia'}
              </p>
              <div className="aspect-square w-full overflow-hidden rounded-lg border border-[#e8e6e0] bg-[#F0EFE9]">
                <canvas
                  ref={imprintCanvasRef}
                  className="h-full w-full object-cover"
                  aria-label="Huella generada"
                />
              </div>
              <p className="text-[10px] leading-relaxed tracking-wide text-[#8A8A7A]">
                {imprintReceivedAt
                  ? imprintReceivedAt.toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadImprint}
                  className="inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-full bg-[#E8400A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c73308]"
                  aria-label="Descargar imagen de huella"
                >
                  <Download size={15} strokeWidth={1.6} aria-hidden />
                  Descargar
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex min-w-[100px] flex-1 items-center justify-center gap-2 rounded-full border border-[#D4D4C4] bg-white px-4 py-3 text-sm font-medium text-[#141D26] transition hover:border-[#ea580c] hover:text-[#c2410c]"
                  aria-label="Copiar enlace a la historia"
                >
                  <Share2 size={14} aria-hidden />
                  Copiar enlace
                </button>
                <button
                  type="button"
                  onClick={anotherStory}
                  className="inline-flex min-w-[100px] flex-1 items-center justify-center gap-2 rounded-full border border-[#D4D4C4] bg-white px-4 py-3 text-sm font-medium text-[#141D26] transition hover:border-[#ea580c] hover:text-[#c2410c]"
                  aria-label="Contar otra historia"
                >
                  <RefreshCw size={14} aria-hidden />
                  Otra historia
                </button>
              </div>
              <p
                className={`h-[18px] text-center text-[0.78rem] font-medium text-[#E8400A] transition-opacity ${linkCopied ? 'opacity-100' : 'opacity-0'}`}
                aria-live="polite"
              >
                ¡Enlace copiado!
              </p>
              <div className="rounded-[10px] border border-[#D4D4C4] bg-[#F0EFE9] p-4 text-left">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8A7A]">
                  ¿Cómo se genera esta imagen?
                </p>
                <p className="text-[0.8rem] font-light leading-relaxed text-[#8A8A7A]">
                  Cada color viene de una palabra de tu historia. AlmaMundi analiza las palabras que usaste y les asigna un color
                  único según su sonido y su forma. Ninguna historia genera la misma combinación — la tuya es irrepetible.
                </p>
              </div>
            </div>
          )}

          {err && <p className="mt-4 text-base font-medium text-red-600 md:text-lg">{err}</p>}
        </div>

        {(step === 'capture' || step === 'received') && (
          <footer
            className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/30 px-5 py-4 md:px-8"
            style={{ backgroundColor: soft.bg }}
          >
            {step === 'capture' && (
              <button
                type="button"
                onClick={goDetails}
                disabled={!canContinueCapture()}
                className="ml-auto rounded-full px-8 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 md:text-xl"
                style={{
                  background: canContinueCapture() ? 'linear-gradient(180deg,#ff4500,#e63e00)' : '#9ca3af',
                  boxShadow: canContinueCapture() ? '0 8px 24px rgba(255,69,0,0.35)' : 'none',
                }}
                aria-label="Continuar al formulario de datos"
              >
                Continuar
              </button>
            )}
            {step === 'received' && (
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full py-4 text-lg font-bold text-gray-700 sm:w-auto sm:px-10 md:text-xl"
                style={soft.button}
                aria-label="Volver al mapa"
              >
                Volver al mapa
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
