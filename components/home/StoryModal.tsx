'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Mic,
  Video,
  Square,
  Download,
  Share2,
  FileText,
  User,
  Upload,
  Users,
  MapPin,
  Globe2,
  Mail } from 'lucide-react';
import { formatPublicName, formatPublicPlace } from '@/lib/historias/story-ubicacion';
import {
  MAX_AUDIO_VIDEO_DURATION_SECONDS,
  probeAudioFileDurationSeconds,
  probeVideoFileDurationSeconds,
  isDurationWithinMax } from '@/lib/media-duration-rules';
import {
  SUBIR_AUDIO_FILE_ACCEPT,
  SUBIR_AUDIO_UPLOAD_MAX_MB,
  SUBIR_EXTRA_FILE_ACCEPT,
  SUBIR_PHOTO_FILE_MAX_MB,
  SUBIR_PHOTO_MAX,
  SUBIR_PHOTO_MIN,
  SUBIR_TEXT_MAX_CHARS,
  SUBIR_VIDEO_UPLOAD_MAX_MB,
  isAllowedAudioUploadFile,
  isAllowedExtraAttachmentFile,
  isAllowedVideoUploadFile } from '@/lib/subir-limits';
import { ANTECEDENTES_MAX } from '@/lib/antecedentes';
import { PHOTO_ALT_MAX, photoStripeSourceText } from '@/lib/historias/story-imagenes';
import { CANCION_RELACIONADA_MAX } from '@/lib/cancion-relacionada';
import {
  UPLOAD_EXTRA_TYPE_ERROR,
  UPLOAD_PHOTO_MAX_MESSAGE,
  SUBIR_TEXT_COUNTER_WARN_CHARS,
  messageForUploadError,
  TURNSTILE_REJECT_MESSAGE } from '@/lib/subir-upload-modal-copy';
import amStyles from '@/components/subir/am-upload-modal.module.css';
import { FormatCaptureEditorialShell } from '@/components/subir/FormatCaptureEditorialShell';
import { UploadModalFotoCapture } from '@/components/subir/UploadModalFotoCapture';
import { AGE_RANGE_OPTIONS, type AgeRangeId } from '@/lib/subir-author-fields';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { interpolate } from '@/lib/i18n/locale';
import {
  drawVadResonanceOnCanvas,
  RESONANCE_EXPORT_PX } from '@/lib/huella/resonance-stripes';
import {
  canvasToPngBlob,
  downloadPngBlob } from '@/lib/huella/share-resonance-png';
import {
  PENDING_STORY_SHARE_EMAIL_SUBJECT,
  PENDING_STORY_SHARE_TEXT,
  PENDING_STORY_SHARE_TEXT_SHORT,
  PENDING_STORY_SHARE_URL } from '@/lib/huella/share-story-channels';
import { StoryShareMenu } from '@/components/home/StoryShareMenu';
import { clearStoryAuthorSession } from '@/lib/story-author-session';
import { clearStoryAuthorCarryIfStale } from '@/lib/story-author-carry';
import { currentPhotoYear, photoFichaIssue, type PhotoFichaIssue } from '@/lib/story-photo-ficha';
import { uploadFileToStorage } from '@/lib/firebase/upload';
import { previewCommitStamp } from '@/lib/preview-version';
import { getTurnstileSiteKey, type TurnstileGate } from '@/lib/turnstile-client';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/home/TurnstileWidget';
import { AdultConsentCheckbox } from '@/components/subir/AdultConsentCheckbox';
import { convertHeicToJpegIfNeeded, looksLikeHeic } from '@/lib/convert-heic-client';
import { prepareStoryPhotoForUpload } from '@/lib/prepare-story-photo';
import { reportStorySubmitError } from '@/lib/story-submit-error';
import {
  createStoryPhotoId,
  type StoryPhotoItem } from '@/lib/story-photo-item';
import { classifyMediaCaptureError, type MediaCaptureErrorKind } from '@/lib/media-capture-error';
import { duckAmbient } from '@/lib/sound/ambient';
import {
  clearStoryDraft,
  loadStoryDraft,
  saveStoryDraft } from '@/lib/story-draft-storage';

export type StoryModalMode = 'video' | 'audio' | 'texto' | 'foto';

export type StoryModalStep = 'capture' | 'details' | 'received';

export type ChosenInspirationTopic = {
  title: string;
  questions: string[];
};

const APP_FONT = 'var(--font-interna), sans-serif';

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
    ].join(', ') },
  inset: {
    backgroundColor: '#E0E5EC',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow:
      'inset 8px 8px 14px rgba(163,177,198,0.7), inset -8px -8px 14px rgba(255,255,255,0.85)' },
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
    ].join(', ') } } as const;

const MAX_PROFILE_PHOTO_MB = SUBIR_PHOTO_FILE_MAX_MB;
const MAX_EXTRA_FILE_MB = SUBIR_PHOTO_FILE_MAX_MB;

function isVideoShareUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /youtube\.com|youtu\.be|vimeo\.com/i.test(u.hostname);
  } catch {
    return false;
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function buildModalSubmissionContext(
  textBody: string,
  storyTitle: string,
  city: string,
  country: string,
  extraText: string
): string {
  const ex = extraText.trim();
  const tbRaw = textBody.trim();
  const tb =
    ex && tbRaw
      ? `${tbRaw}\n\nExtras / contexto\n${ex}`
      : ex && !tbRaw
        ? ex
        : tbRaw;
  if (tb.length >= 30) return tb.slice(0, 2000);
  const geo = formatPublicPlace(city, country);
  const pieces = [storyTitle.trim(), geo].filter(Boolean);
  let out = pieces.join(' · ');
  if (tb.length > 0) out = `${tb}\n\n${out}`;
  if (out.trim().length >= 30) return out.slice(0, 2000);
  return `${out}\n(Envío AlmaMundi, sin descripción ampliada.)`.slice(0, 2000);
}

type Sex = '' | 'femenino' | 'masculino' | 'no-binario' | 'prefiero-no-decir' | 'otro';

type AgeRange = '' | AgeRangeId;

function formatClock(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
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

/** Texto del relato / título / fotos que alimentan la resonancia VAD. */
function imprintHuellaSource(args: {
  mode: StoryModalMode;
  textBody: string;
  storyTitle: string;
  extraText: string;
  photoFichas?: { nombre: string; lugar: string; descripcion: string }[];
  mediaBlob: Blob | null;
}): { content: string; charCount: number } {
  const { mode, textBody, storyTitle, extraText, photoFichas = [], mediaBlob } = args;
  const titleBlock = [storyTitle, extraText].filter((s) => s.trim()).join('\n').trim();

  if (mode === 'texto') {
    const content = textBody.trim() || titleBlock || storyTitle;
    return { content, charCount: Math.max(content.length, 1) };
  }

  if (mode === 'foto') {
    const fromPhotos = photoStripeSourceText(
      photoFichas.map((ficha) => ({
        nombre: ficha.nombre,
        lugar: ficha.lugar,
        descripcion: ficha.descripcion }))
    );
    const content = fromPhotos || storyTitle.trim() || extraText.trim();
    return {
      content,
      charCount: Math.max(content.length, 400) };
  }

  const content = titleBlock || storyTitle.trim() || 'historia';
  const avBonus = Math.min(Math.floor((mediaBlob?.size ?? 0) / 120), 14000);
  return {
    content,
    charCount: Math.max(content.length + avBonus, 900) };
}

type ImprintDrawArgs = {
  storyId: string;
  receivedAt: Date;
  mode: StoryModalMode;
  textBody: string;
  storyTitle: string;
  extraText: string;
  photoFichas: { nombre: string; lugar: string; descripcion: string }[];
  mediaBlob: Blob | null;
  locale: 'es' | 'pt' | 'en';
  city: string;
  country: string;
};

function aliasForGreeting(alias: string, _locale: string): string {
  return formatPublicName(alias);
}

function drawImprintPreview(canvas: HTMLCanvasElement, args: ImprintDrawArgs): void {
  const {
    storyId,
    receivedAt,
    mode,
    textBody,
    storyTitle,
    extraText,
    photoFichas,
    mediaBlob,
    locale,
    city,
    country } = args;
  canvas.width = RESONANCE_EXPORT_PX;
  canvas.height = RESONANCE_EXPORT_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { content } = imprintHuellaSource({
    mode,
    textBody,
    storyTitle,
    extraText,
    photoFichas,
    mediaBlob });

  drawVadResonanceOnCanvas(ctx, {
    storyId,
    text: content,
    locale,
    footer: {
      at: receivedAt,
      title: storyTitle,
      city,
      country,
      locale } });
}

function huellaPngFilename(storyTitle: string, imprintId: string): string {
  const slug = storyTitle
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `almamundi-${slug || imprintId || 'historia'}.png`;
}

export type StoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onExploreMap: () => void;
  mode: StoryModalMode;
  chosenTopic: ChosenInspirationTopic | null;
  onClearTopic: () => void;
};

export function StoryModal({ isOpen, onClose, onExploreMap, mode, chosenTopic, onClearTopic }: StoryModalProps) {
  const { t, locale } = useHomeLocale();
  const router = useRouter();
  const [step, setStep] = useState<StoryModalStep>('capture');
  const [err, setErr] = useState('');
  const [mediaErrKind, setMediaErrKind] = useState<MediaCaptureErrorKind | null>(null);
  const [fieldErr, setFieldErr] = useState<Partial<Record<'title' | 'alias' | 'country' | 'city' | 'age' | 'email', string>>>({});
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [phoneVideoUi, setPhoneVideoUi] = useState(false);

  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [uploadVideoFile, setUploadVideoFile] = useState<File | null>(null);
  const [uploadAudioFile, setUploadAudioFile] = useState<File | null>(null);
  const [videoShareUrl, setVideoShareUrl] = useState('');
  const [audioShareUrl, setAudioShareUrl] = useState('');
  const [showVideoLink, setShowVideoLink] = useState(false);
  const [durationInlineErr, setDurationInlineErr] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avDurationSec, setAvDurationSec] = useState<number | null>(null);
  const [avCardError, setAvCardError] = useState('');
  const [avProbePending, setAvProbePending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [creatingColors, setCreatingColors] = useState(false);
  const [recording, setRecording] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const videoUrlRef = useRef<HTMLInputElement>(null);
  const fileProbeRef = useRef(0);
  const recordSecRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRequestTokenRef = useRef(0);

  const [textBody, setTextBody] = useState('');
  /** Tras escribir, la persona confirma que leyó/revisó antes de Continuar (modo texto). */
  const [textoReviewAck, setTextoReviewAck] = useState(false);
  const [photos, setPhotos] = useState<StoryPhotoItem[]>([]);

  // --- FORM: historia + extras (STEP 2 del modal: tras captura) ---
  const [storyTitle, setStoryTitle] = useState('');
  const [alias, setAlias] = useState('');
  const [extraText, setExtraText] = useState('');
  const [cancionRelacionada, setCancionRelacionada] = useState('');
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [extraPreparing, setExtraPreparing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileConverting, setProfileConverting] = useState(false);
  const [sex, setSex] = useState<Sex>('');
  const [ageRange, setAgeRange] = useState<AgeRange>('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedPublicacion, setAcceptedPublicacion] = useState(false);
  const [acceptedTerminos, setAcceptedTerminos] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitInFlightRef = useRef(false);
  const extraUploadRef = useRef<{
    key: string;
    readUrl: string;
    storagePath: string;
  }[]>([]);
  const profileUploadRef = useRef<{ readUrl: string; storagePath: string } | null>(null);
  const profileConvertToken = useRef(0);
  const avUploadRef = useRef<{ readUrl: string; storagePath: string } | null>(null);
  const captchaTokenRef = useRef('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const adsConversionSentRef = useRef('');
  const [captchaGate, setCaptchaGate] = useState<TurnstileGate>(
    getTurnstileSiteKey() ? 'wait' : 'skip'
  );
  const [captchaEpoch, setCaptchaEpoch] = useState(0);
  /** Evita validar un título stale si el closure del submit no se actualizó. */
  const storyTitleRef = useRef(storyTitle);
  storyTitleRef.current = storyTitle;

  useEffect(() => {
    avUploadRef.current = null;
  }, [mediaBlob, uploadVideoFile, uploadAudioFile]);

  useEffect(() => {
    if (!isOpen) return;
    const lenis = window.__almamundiLenis as { stop?: () => void; start?: () => void } | undefined;
    lenis?.stop?.();
    return () => {
      lenis?.start?.();
    };
  }, [isOpen]);

  useEffect(() => {
    const reviewingAv =
      (mode === 'video' || mode === 'audio') &&
      (recording || previewUrl != null || mediaBlob != null);
    duckAmbient(reviewingAv);
    return () => duckAmbient(false);
  }, [mode, recording, previewUrl, mediaBlob]);

  const [imprintId, setImprintId] = useState('');
  const [imprintReceivedAt, setImprintReceivedAt] = useState<Date | null>(null);
  const [imprintStoryTitle, setImprintStoryTitle] = useState('');
  const imprintCanvasRef = useRef<HTMLCanvasElement>(null);
  const imprintSnapRef = useRef<{
    textBody: string;
    storyTitle: string;
    extraText: string;
    photoFichas: { nombre: string; lugar: string; descripcion: string }[];
    mediaBlob: Blob | null;
    city: string;
    country: string;
  } | null>(null);
  const [shareNotice, setShareNotice] = useState('');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareMenuShowDownload, setShareMenuShowDownload] = useState(false);
  const [shareImageApps, setShareImageApps] = useState(false);
  const [shareImageFile, setShareImageFile] = useState<File | null>(null);
  const [shareCopyFallback, setShareCopyFallback] = useState<string | null>(null);
  const shareNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    mediaRequestTokenRef.current += 1;
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
    recordSecRef.current = 0;
    setMediaBlob(null);
    setAvCardError('');
    setAvDurationSec(null);
    setAvProbePending(false);
    fileProbeRef.current += 1;
    revokePreview();
    chunksRef.current = [];
  }, [revokePreview, stopStream, stopTimer]);

  const wasOpenRef = useRef(false);
  const modeAtOpenRef = useRef<StoryModalMode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) clearStoryAuthorCarryIfStale();
      wasOpenRef.current = false;
      modeAtOpenRef.current = null;
      clearStoryAuthorSession();
      imprintSnapRef.current = null;
      captchaTokenRef.current = '';
      setCaptchaEpoch((n) => n + 1);
      resetCaptureMedia();
      setStep('capture');
      setErr('');
      setMediaErrKind(null);
      setFieldErr({});
      setTextBody('');
      setTextoReviewAck(false);
      setPhotos((prev) => {
        prev.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        return [];
      });
      extraUploadRef.current = [];
      profileUploadRef.current = null;
      avUploadRef.current = null;
      submitInFlightRef.current = false;
      setStoryTitle('');
      setAlias('');
      setExtraText('');
      setCancionRelacionada('');
      setExtraFiles([]);
      setProfilePhoto(null);
      setSex('');
      setAgeRange('');
      setCity('');
      setCountry('');
      setEmail('');
      setAcceptedPrivacy(false);
      setNewsletterOptIn(false);
      setAcceptedPublicacion(false);
      setAcceptedTerminos(false);
      setUploadVideoFile(null);
      setUploadAudioFile(null);
      setVideoShareUrl('');
      setAudioShareUrl('');
      setShowVideoLink(false);
      setDurationInlineErr('');
      setSaving(false);
      setImprintId('');
      setImprintReceivedAt(null);
      setImprintStoryTitle('');
      setShareNotice('');
      setShareCopyFallback(null);
      setShareImageFile(null);
      setShareMenuOpen(false);
      setShareMenuShowDownload(false);
      if (shareNoticeTimerRef.current) {
        clearTimeout(shareNoticeTimerRef.current);
        shareNoticeTimerRef.current = null;
      }
      return;
    }
    const opening = !wasOpenRef.current;
    const modeChanged = modeAtOpenRef.current !== null && modeAtOpenRef.current !== mode;
    if (opening || modeChanged) {
      wasOpenRef.current = true;
      modeAtOpenRef.current = mode;
      setStep('capture');
      setErr('');
      setMediaErrKind(null);
      setFieldErr({});
      resetCaptureMedia();
      setUploadVideoFile(null);
      setUploadAudioFile(null);
      setShowVideoLink(false);
      setVideoShareUrl('');
      setAudioShareUrl('');
      if (opening) {
        clearStoryAuthorSession();
        setAlias('');
        setCountry('');
        setCity('');
        setEmail('');
        setAgeRange('');
        setSex('');
        const draft = loadStoryDraft();
        if (mode === 'texto') {
          const topicSeed =
            chosenTopic && !draft?.textBody
              ? chosenTopic.questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')
              : '';
          setTextBody(draft?.textBody || topicSeed);
        }
      }
    }
  }, [isOpen, mode, chosenTopic, resetCaptureMedia]);

  useEffect(() => {
    if (!isOpen || step === 'received' || mode !== 'texto') return;
    saveStoryDraft({ textBody });
  }, [isOpen, step, mode, textBody]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: coarse)');
    const sync = () => {
      setIsCoarsePointer(mq.matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const hasUnsavedContent = useCallback(() => {
    return Boolean(
      textBody.trim() ||
        storyTitle.trim() ||
        extraText.trim() ||
        cancionRelacionada.trim() ||
        videoShareUrl.trim() ||
        audioShareUrl.trim() ||
        mediaBlob ||
        uploadVideoFile ||
        uploadAudioFile ||
        photos.length > 0
    );
  }, [
    textBody,
    storyTitle,
    extraText,
    cancionRelacionada,
    videoShareUrl,
    audioShareUrl,
    mediaBlob,
    uploadVideoFile,
    uploadAudioFile,
    photos.length,
  ]);

  const requestLeave = useCallback((): boolean => {
    if (step === 'received') {
      onClose();
      return true;
    }
    if (hasUnsavedContent()) {
      if (!window.confirm(t.modalLeaveConfirm)) return false;
      clearStoryDraft();
    }
    onClose();
    return true;
  }, [hasUnsavedContent, onClose, step, t.modalLeaveConfirm]);

  const applyMediaErr = useCallback(
    (kind: MediaCaptureErrorKind, channel: 'video' | 'audio') => {
      setMediaErrKind(kind);
      if (channel === 'video') {
        setErr(
          kind === 'denied'
            ? t.modalCameraDenied
            : kind === 'unsupported'
              ? t.modalCameraUnsupported
              : t.modalCameraBusy
        );
        return;
      }
      setErr(
        kind === 'denied'
          ? t.modalMicDenied
          : kind === 'unsupported'
            ? t.modalMicUnsupported
            : t.modalMicBusy
      );
    },
    [t]
  );

  const stepRef = useRef(step);
  stepRef.current = step;
  const requestLeaveRef = useRef(requestLeave);
  requestLeaveRef.current = requestLeave;

  useEffect(() => {
    if (!isOpen) return;
    const current = window.history.state as { amStory?: string } | null;
    if (current?.amStory !== step) {
      window.history.pushState({ amStory: step }, '', window.location.href);
    }
    const onPop = () => {
      const now = stepRef.current;
      if (now === 'details') {
        setStep('capture');
        setErr('');
        window.history.pushState({ amStory: 'capture' }, '', window.location.href);
        return;
      }
      if (!requestLeaveRef.current()) {
        window.history.pushState({ amStory: now }, '', window.location.href);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isOpen, step]);

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
      applyMediaErr(classifyMediaCaptureError(e, 'preview'), 'video');
    }
  }, [applyMediaErr, isOpen, step, mode, streamReady, mediaBlob, recording]);

  const startVideoCapture = useCallback(async () => {
    setErr('');
    const requestToken = ++mediaRequestTokenRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      if (requestToken !== mediaRequestTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setStreamReady(true);
      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream;
        await videoLiveRef.current.play().catch(() => {});
      }
    } catch (e) {
      if (requestToken !== mediaRequestTokenRef.current) return;
      applyMediaErr(classifyMediaCaptureError(e, 'getUserMedia'), 'video');
      setStreamReady(false);
    }
  }, [applyMediaErr]);

  const startRecordingVideo = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    if (typeof MediaRecorder === 'undefined') {
      applyMediaErr('unsupported', 'video');
      return;
    }
    const mime = pickVideoMime();
    if (!mime) {
      applyMediaErr('unsupported', 'video');
      return;
    }
    chunksRef.current = [];
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, { mimeType: mime });
    } catch (e) {
      console.error('[StoryModal] MediaRecorder video', e);
      applyMediaErr(classifyMediaCaptureError(e, 'recorder'), 'video');
      return;
    }
    recorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      const probeToken = mediaRequestTokenRef.current;
      setAvProbePending(true);
      setAvCardError('');
      setUploadVideoFile(null);
      setUploadAudioFile(null);
      void probeVideoBlobDurationSeconds(blob).then((sec) => {
        if (probeToken !== mediaRequestTokenRef.current) return;
        const duration = sec ?? recordSecRef.current;
        setMediaBlob(blob);
        revokePreview();
        setPreviewUrl(URL.createObjectURL(blob));
        setAvDurationSec(duration);
        setAvProbePending(false);
        if (duration != null && !isDurationWithinMax(duration)) {
          setAvCardError(t.modalFileTooLongVideo);
        }
        stopStream();
        stopTimer();
        setRecording(false);
      });
    };
    setRecordSec(0);
    recordSecRef.current = 0;
    timerRef.current = setInterval(() => {
      setRecordSec((s) => {
        const next = s + 1;
        recordSecRef.current = next;
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
      applyMediaErr(classifyMediaCaptureError(e, 'recorder'), 'video');
    }
  }, [applyMediaErr, revokePreview, stopStream, stopTimer, t.modalFileTooLongVideo]);

  const startRecordingAudio = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    if (typeof MediaRecorder === 'undefined') {
      applyMediaErr('unsupported', 'audio');
      return;
    }
    const mime = pickAudioMime();
    if (!mime) {
      applyMediaErr('unsupported', 'audio');
      return;
    }
    chunksRef.current = [];
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, { mimeType: mime });
    } catch (e) {
      console.error('[StoryModal] MediaRecorder audio', e);
      applyMediaErr(classifyMediaCaptureError(e, 'recorder'), 'audio');
      return;
    }
    recorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      const probeToken = mediaRequestTokenRef.current;
      setAvProbePending(true);
      setAvCardError('');
      setUploadVideoFile(null);
      setUploadAudioFile(null);
      void probeAudioFileDurationSeconds(new File([blob], 'rec.webm', { type: blob.type })).then((sec) => {
        if (probeToken !== mediaRequestTokenRef.current) return;
        const duration = sec ?? recordSecRef.current;
        setMediaBlob(blob);
        revokePreview();
        setPreviewUrl(URL.createObjectURL(blob));
        setAvDurationSec(duration);
        setAvProbePending(false);
        if (duration != null && !isDurationWithinMax(duration)) {
          setAvCardError(t.modalFileTooLongAudio);
        }
        stopStream();
        stopTimer();
        setRecording(false);
      });
    };
    setRecordSec(0);
    recordSecRef.current = 0;
    timerRef.current = setInterval(() => {
      setRecordSec((s) => {
        const next = s + 1;
        recordSecRef.current = next;
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
      applyMediaErr(classifyMediaCaptureError(e, 'recorder'), 'audio');
    }
  }, [applyMediaErr, revokePreview, stopStream, stopTimer, t.modalFileTooLongAudio]);

  const beginAudioRecording = useCallback(async () => {
    setErr('');
    const requestToken = ++mediaRequestTokenRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (requestToken !== mediaRequestTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setStreamReady(true);
      startRecordingAudio();
    } catch (e) {
      if (requestToken !== mediaRequestTokenRef.current) return;
      applyMediaErr(classifyMediaCaptureError(e, 'getUserMedia'), 'audio');
      setStreamReady(false);
    }
  }, [applyMediaErr, startRecordingAudio]);

  const stopRecording = useCallback(() => {
    const mr = recorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
    recorderRef.current = null;
  }, []);

  const discardRecording = useCallback(() => {
    resetCaptureMedia();
    setErr('');
  }, [resetCaptureMedia]);

  useLayoutEffect(() => {
    const width = window.matchMedia('(max-width: 767px)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const sync = () => {
      const phone = width.matches || coarse.matches;
      setPhoneVideoUi((prev) => (prev === phone ? prev : phone));
      if (phone && mode === 'video' && streamRef.current) {
        const mr = recorderRef.current;
        if (mr && mr.state !== 'inactive') mr.stop();
        else stopStream();
      }
    };
    sync();
    width.addEventListener('change', sync);
    coarse.addEventListener('change', sync);
    return () => {
      width.removeEventListener('change', sync);
      coarse.removeEventListener('change', sync);
    };
  }, [mode, stopStream]);

  const acceptUploadFile = useCallback(
    (kind: 'video' | 'audio', file: File) => {
      setErr('');
      setMediaErrKind(null);
      setAvCardError('');
      setAvDurationSec(null);
      setMediaBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      if (kind === 'video') {
        setUploadVideoFile(file);
        setUploadAudioFile(null);
        setVideoShareUrl('');
      } else {
        setUploadAudioFile(file);
        setUploadVideoFile(null);
        setAudioShareUrl('');
      }
      const typeOk = kind === 'video' ? isAllowedVideoUploadFile(file) : isAllowedAudioUploadFile(file);
      if (!typeOk) {
        setAvProbePending(false);
        setAvCardError(kind === 'video' ? t.modalFileTypeVideo : t.modalFileTypeAudio);
        return;
      }
      const maxMb = kind === 'video' ? SUBIR_VIDEO_UPLOAD_MAX_MB : SUBIR_AUDIO_UPLOAD_MAX_MB;
      if (file.size > maxMb * 1024 * 1024) {
        setAvProbePending(false);
        setAvCardError(interpolate(t.modalFileTooHeavy, { max: String(maxMb) }));
        return;
      }
      const token = ++fileProbeRef.current;
      setAvProbePending(true);
      const probe =
        kind === 'video' ? probeVideoFileDurationSeconds(file) : probeAudioFileDurationSeconds(file);
      void probe.then((sec) => {
        if (token !== fileProbeRef.current) return;
        setAvProbePending(false);
        setAvDurationSec(sec);
        if (sec != null && !isDurationWithinMax(sec)) {
          setAvCardError(kind === 'video' ? t.modalFileTooLongVideo : t.modalFileTooLongAudio);
        }
      });
    },
    [
      previewUrl,
      t.modalFileTooHeavy,
      t.modalFileTooLongAudio,
      t.modalFileTooLongVideo,
      t.modalFileTypeAudio,
      t.modalFileTypeVideo,
    ]
  );

  const removePickedFile = useCallback(() => {
    setUploadVideoFile(null);
    setUploadAudioFile(null);
    setAvCardError('');
    setAvDurationSec(null);
    setAvProbePending(false);
    fileProbeRef.current += 1;
    setErr('');
    revokePreview();
  }, [revokePreview]);

  const addPhotos = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    setErr('');
    const incoming = Array.from(list);
    const accepted: { id: string; file: File }[] = [];

    setPhotos((prev) => {
      const next = [...prev];
      for (const f of incoming) {
        if (next.length >= SUBIR_PHOTO_MAX) {
          setErr(UPLOAD_PHOTO_MAX_MESSAGE);
          break;
        }
        const typeOk =
          /^image\/(jpeg|png|webp|jpg|heic|heif)$/i.test(f.type) || looksLikeHeic(f);
        if (!typeOk) {
          setErr(t.modalPhotoTypeError);
          continue;
        }
        if (f.size > SUBIR_PHOTO_FILE_MAX_MB * 1024 * 1024) {
          setErr(t.modalPhotoSizeError);
          continue;
        }
        const item: StoryPhotoItem = {
          id: createStoryPhotoId(),
          name: f.name,
          readyFile: null,
          previewUrl: '',
          converting: true,
          uploadStatus: 'idle',
          progress: 0,
          error: null,
          titulo: '',
          anio: '',
          anioDesconocido: false,
          decada: '',
          lugar: '',
          alt: '' };
        next.push(item);
        accepted.push({ id: item.id, file: f });
      }
      return next;
    });

    for (const { id, file } of accepted) {
      void (async () => {
        let source = file;
        if (looksLikeHeic(file)) {
          const converted = await convertHeicToJpegIfNeeded(file);
          if (!converted || looksLikeHeic(converted)) {
            setPhotos((prev) => {
              const current = prev.find((p) => p.id === id);
              if (!current) return prev;
              if (current.previewUrl) URL.revokeObjectURL(current.previewUrl);
              return prev.filter((p) => p.id !== id);
            });
            setErr(t.modalPhotoReadError);
            return;
          }
          source = converted;
        }
        const prepared = await prepareStoryPhotoForUpload(source);
        setPhotos((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
            return {
              ...p,
              readyFile: prepared,
              previewUrl: URL.createObjectURL(prepared),
              converting: false,
              name: prepared.name };
          })
        );
      })();
    }
  }, [t.modalPhotoReadError, t.modalPhotoSizeError, t.modalPhotoTypeError]);

  const removePhotoAt = useCallback((index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    setErr('');
  }, []);

  const patchPhoto = useCallback(
    (
      id: string,
      patch: Partial<Pick<StoryPhotoItem, 'titulo' | 'anio' | 'anioDesconocido' | 'decada' | 'lugar' | 'alt'>>
    ) => {
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      if (err) setErr('');
    },
    [err]
  );

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
    const incoming = Array.from(files);
    void (async () => {
      const ready: File[] = [];
      let failed = false;
      let preparing = false;
      for (const f of incoming) {
        if (!isAllowedExtraAttachmentFile(f)) {
          setErr(UPLOAD_EXTRA_TYPE_ERROR);
          continue;
        }
        if (f.size > MAX_EXTRA_FILE_MB * 1024 * 1024) {
          setErr(`Un archivo supera ${MAX_EXTRA_FILE_MB}MB. Prueba con uno más liviano.`);
          continue;
        }
        if (!looksLikeHeic(f)) {
          ready.push(await prepareStoryPhotoForUpload(f));
          continue;
        }
        if (!preparing) {
          preparing = true;
          setExtraPreparing(true);
        }
        const converted = await convertHeicToJpegIfNeeded(f);
        if (!converted || looksLikeHeic(converted)) {
          failed = true;
          continue;
        }
        ready.push(await prepareStoryPhotoForUpload(converted));
      }
      if (preparing) setExtraPreparing(false);
      if (failed) setErr(t.modalPhotoReadError);
      if (ready.length > 0) setExtraFiles((prev) => [...prev, ...ready]);
    })();
  }, [t.modalPhotoReadError]);

  const removeExtraFile = useCallback((idx: number) => {
    setExtraFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const onPickProfilePhoto = useCallback(async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && !looksLikeHeic(file)) {
      setErr('La foto debe ser una imagen (JPG/PNG/WEBP).');
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_MB * 1024 * 1024) {
      setErr(`La foto supera ${MAX_PROFILE_PHOTO_MB}MB. Usa una más liviana.`);
      return;
    }

    setErr('');
    const token = ++profileConvertToken.current;
    setProfileConverting(true);
    setProfilePhoto(null);
    const source = looksLikeHeic(file) ? await convertHeicToJpegIfNeeded(file) : file;
    if (token !== profileConvertToken.current) return;
    if (!source || looksLikeHeic(source)) {
      setProfileConverting(false);
      setErr(t.modalPhotoReadError);
      return;
    }
    const prepared = await prepareStoryPhotoForUpload(source);
    if (token !== profileConvertToken.current) return;
    setProfileConverting(false);
    setProfilePhoto(prepared);
    profileUploadRef.current = null;
  }, [t.modalPhotoReadError]);

  const captureFileWait = useCallback((): string | null => {
    if (mode === 'audio' || mode === 'video') {
      const ready =
        mode === 'video'
          ? (mediaBlob != null && mediaBlob.size > 0) ||
            uploadVideoFile != null ||
            isVideoShareUrl(videoShareUrl)
          : (mediaBlob != null && mediaBlob.size > 0) ||
            uploadAudioFile != null ||
            isHttpUrl(audioShareUrl);
      if (recording || !ready) return mode === 'audio' ? t.modalWaitVoice : t.modalWaitVideo;
      return null;
    }
    if (mode === 'foto') {
      const ready = photos.some((p) => p.readyFile && !p.converting);
      if (!ready || photos.some((p) => p.converting)) return t.modalWaitPhoto;
    }
    return null;
  }, [
    mode,
    recording,
    mediaBlob,
    uploadVideoFile,
    uploadAudioFile,
    videoShareUrl,
    audioShareUrl,
    photos,
    t.modalWaitVoice,
    t.modalWaitVideo,
    t.modalWaitPhoto,
  ]);

  const canContinueCapture = useCallback((): boolean => {
    if (captureFileWait()) return false;
    if (mode === 'video' || mode === 'audio') {
      if (avProbePending || avCardError) return false;
      if (mode === 'video') {
        return (
          (mediaBlob != null && mediaBlob.size > 0) ||
          uploadVideoFile != null ||
          isVideoShareUrl(videoShareUrl)
        );
      }
      return (
        (mediaBlob != null && mediaBlob.size > 0) ||
        uploadAudioFile != null ||
        isHttpUrl(audioShareUrl)
      );
    }
    if (mode === 'texto') {
      const t = textBody.trim();
      return t.length > 0 && t.length <= SUBIR_TEXT_MAX_CHARS;
    }
    const ready = photos.filter((p) => p.readyFile && !p.converting).length;
    return (
      ready >= SUBIR_PHOTO_MIN &&
      photos.length <= SUBIR_PHOTO_MAX &&
      !photos.some((p) => p.converting) &&
      photos.every((p) => photoFichaIssue(p) == null)
    );
  }, [
    mode,
    mediaBlob,
    uploadVideoFile,
    uploadAudioFile,
    videoShareUrl,
    audioShareUrl,
    textBody,
    photos,
    avProbePending,
    avCardError,
    captureFileWait,
  ]);

  const goDetails = useCallback(() => {
    const wait = captureFileWait();
    if (wait) {
      setErr(wait);
      return;
    }
    if (!canContinueCapture()) return;
    stopStream();
    setErr('');
    setMediaErrKind(null);
    setStep('details');
  }, [canContinueCapture, captureFileWait, stopStream]);

  const validateDetails = useCallback(() => {
    const title =
      mode === 'foto' ? (photos[0]?.titulo ?? '').trim() : storyTitleRef.current.trim();
    const next: typeof fieldErr = {};
    if (!title || title.length < 2) next.title = t.modalFieldTitleMissing;
    if (alias.trim().length < 2) next.alias = t.modalFieldAliasMissing;
    if (!country.trim()) next.country = t.modalFieldCountryMissing;
    if (!city.trim()) next.city = t.modalFieldCityMissing;
    if (!ageRange) next.age = t.modalFieldAgeMissing;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t.modalFieldEmailMissing;
    }
    setFieldErr(next);
    if (Object.keys(next).length > 0) {
      setErr('');
      return false;
    }
    if (!acceptedPrivacy || !acceptedPublicacion || !acceptedTerminos) {
      setErr(t.modalMarkThreeToSend);
      return false;
    }
    setErr('');
    return true;
  }, [
    acceptedPrivacy,
    acceptedPublicacion,
    acceptedTerminos,
    ageRange,
    alias,
    city,
    country,
    email,
    mode,
    photos,
    t,
  ]);

  const uploadOnePhoto = useCallback(async (
    item: StoryPhotoItem,
    onProgress?: (ratio: number) => void
  ): Promise<StoryPhotoItem> => {
    if (item.uploadStatus === 'uploading') return item;
    if (item.readUrl && item.storagePath) {
      onProgress?.(1);
      return item;
    }
    if (!item.readyFile) {
      return { ...item, uploadStatus: 'error', error: t.modalPhotoUploadFailed };
    }
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, uploadStatus: 'uploading', progress: 0, error: null } : p
      )
    );
    try {
      const prepared = await prepareStoryPhotoForUpload(item.readyFile);
      const r = await uploadFileToStorage(
        prepared,
        'submissions',
        `photo-${item.id}-${prepared.name}`,
        (ratio) => {
          onProgress?.(ratio);
          setPhotos((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, progress: ratio } : p))
          );
        }
      );
      const done: StoryPhotoItem = {
        ...item,
        readyFile: prepared,
        uploadStatus: 'done',
        progress: 1,
        error: null,
        readUrl: r.readUrl,
        storagePath: r.storagePath };
      setPhotos((prev) => prev.map((p) => (p.id === item.id ? done : p)));
      return done;
    } catch (e) {
      reportStorySubmitError('photo_upload_failed', 'story-media', e);
      const failed: StoryPhotoItem = {
        ...item,
        uploadStatus: 'error',
        error: t.modalPhotoUploadFailed };
      setPhotos((prev) => prev.map((p) => (p.id === item.id ? failed : p)));
      return failed;
    }
  }, [t.modalPhotoUploadFailed]);

  const retryPhotoUpload = useCallback(
    (id: string) => {
      const item = photos.find((p) => p.id === id);
      if (!item || item.uploadStatus === 'uploading') return;
      void uploadOnePhoto({ ...item, readUrl: undefined, storagePath: undefined, error: null });
    },
    [photos, uploadOnePhoto]
  );

  const submitDetails = useCallback(async () => {
    if (saving || submitInFlightRef.current) return;
    if (!validateDetails()) return;
    if (captchaGate === 'need' || captchaGate === 'wait') {
      reportStorySubmitError('captcha_gate', 'captcha');
      setErr(t.modalCaptchaFailed);
      return;
    }
    submitInFlightRef.current = true;
    setSaving(true);
    setErr('');
    setCreatingColors(false);
    try {
      const uploadPieces: { key: string; size: number }[] = [];
      if (profilePhoto && profilePhoto.size > 0) {
        uploadPieces.push({ key: 'profile', size: profilePhoto.size });
      }
      if (mode !== 'foto') {
        extraFiles.forEach((file, index) => {
          if (file.size > 0) uploadPieces.push({ key: `extra-${index}`, size: file.size });
        });
      }
      if (mode === 'video' || mode === 'audio') {
        const media = mediaBlob ?? (mode === 'video' ? uploadVideoFile : uploadAudioFile);
        if (media && media.size > 0) uploadPieces.push({ key: 'media', size: media.size });
      } else if (mode === 'foto') {
        photos.forEach((photo) => {
          if (photo.readyFile && photo.readyFile.size > 0) {
            uploadPieces.push({ key: `photo-${photo.id}`, size: photo.readyFile.size });
          }
        });
      }
      const totalUploadBytes = uploadPieces.reduce((sum, piece) => sum + piece.size, 0);
      const loadedByKey = new Map<string, number>();
      let shownUploadPercent = 0;
      const reportLoaded = (key: string, loaded: number) => {
        if (totalUploadBytes <= 0 || !Number.isFinite(loaded)) return;
        const size = uploadPieces.find((piece) => piece.key === key)?.size ?? 0;
        if (size <= 0) return;
        const nextLoaded = Math.min(size, Math.max(loadedByKey.get(key) ?? 0, loaded));
        loadedByKey.set(key, nextLoaded);
        let sum = 0;
        loadedByKey.forEach((bytes) => {
          sum += bytes;
        });
        const percent =
          sum >= totalUploadBytes ? 100 : Math.min(99, Math.floor((sum / totalUploadBytes) * 100));
        if (percent < shownUploadPercent) return;
        shownUploadPercent = percent;
        setUploadProgress((prev) => Math.max(prev ?? 0, percent));
        if (percent >= 100) setCreatingColors(true);
      };
      if (totalUploadBytes > 0) setUploadProgress(0);

      const privateMediaPaths: string[] = [];
      const trackUpload = async (
        file: File | Blob,
        prefix: string,
        name: string,
        cache: { readUrl: string; storagePath: string } | null | undefined,
        progressKey: string
      ) => {
        if (cache?.readUrl && cache.storagePath) {
          privateMediaPaths.push(cache.storagePath);
          reportLoaded(progressKey, file.size);
          return cache;
        }
        const r = await uploadFileToStorage(file, prefix, name, (ratio) => {
          reportLoaded(progressKey, ratio * file.size);
        });
        privateMediaPaths.push(r.storagePath);
        reportLoaded(progressKey, file.size);
        return r;
      };

      let profilePhotoUploaded: string | undefined;
      if (profilePhoto) {
        const r = await trackUpload(
          profilePhoto,
          'submissions/avatars',
          `avatar-${profilePhoto.name}`,
          profileUploadRef.current,
          'profile'
        );
        profileUploadRef.current = r;
        profilePhotoUploaded = r.readUrl;
      }

      const extraAttachmentUrls: string[] = [];
      const extraNext: { key: string; readUrl: string; storagePath: string }[] = [];
      for (let i = 0; i < (mode === 'foto' ? 0 : extraFiles.length); i++) {
        const f = extraFiles[i]!;
        const key = `${i}-${f.name}-${f.size}`;
        const cached = extraUploadRef.current.find((x) => x.key === key);
        const r = await trackUpload(f, 'submissions/extras', `extra-${i}-${f.name}`, cached, `extra-${i}`);
        extraNext.push({ key, readUrl: r.readUrl, storagePath: r.storagePath });
        extraAttachmentUrls.push(r.readUrl);
      }
      extraUploadRef.current = extraNext;

      const title =
        mode === 'foto' ? (photos[0]?.titulo ?? '').trim() : storyTitleRef.current.trim();
      const placeCombined = `${city.trim()}, ${country.trim()}`;

      let payload: {
        textBody?: string;
        photoUrl?: string;
        photoUrls?: string[];
        photoAlts?: string[];
        photoFichas?: {
          nombre: string;
          anio?: string;
          decada?: string;
          lugar: string;
          alt?: string;
        }[];
        audioUrl?: string;
        videoUrl?: string;
      } = {};

      if (mode === 'texto') {
        payload = { textBody: textBody.trim() };
      } else if (mode === 'video') {
        if (mediaBlob) {
          const ext = mediaBlob.type.includes('mp4') ? 'mp4' : 'webm';
          const r = await trackUpload(
            mediaBlob,
            'submissions',
            `video-grabado.${ext}`,
            avUploadRef.current,
            'media'
          );
          avUploadRef.current = r;
          payload = { videoUrl: r.readUrl };
        } else if (uploadVideoFile) {
          const sec = await probeVideoFileDurationSeconds(uploadVideoFile);
          if (sec != null && !isDurationWithinMax(sec)) {
            setErr(`El video supera los ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
            return;
          }
          const extRaw = uploadVideoFile.name.split('.').pop()?.toLowerCase() || '';
          const safeExt = extRaw && /^[a-z0-9]+$/.test(extRaw) ? extRaw : 'mp4';
          const r = await trackUpload(
            uploadVideoFile,
            'submissions',
            `video-subido.${safeExt}`,
            avUploadRef.current,
            'media'
          );
          avUploadRef.current = r;
          payload = { videoUrl: r.readUrl };
        } else if (isVideoShareUrl(videoShareUrl)) {
          payload = { videoUrl: videoShareUrl.trim() };
        } else {
          reportStorySubmitError('missing_video', 'payload');
          setErr('Falta el video de la historia.');
          return;
        }
      } else if (mode === 'audio') {
        if (mediaBlob) {
          const af = new File([mediaBlob], 'grabacion.webm', {
            type: mediaBlob.type || 'audio/webm' });
          const sec = await probeAudioFileDurationSeconds(af);
          if (sec != null && !isDurationWithinMax(sec)) {
            setErr(`El audio supera los ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
            return;
          }
          const ext = mediaBlob.type.includes('mp4') ? 'm4a' : 'webm';
          const r = await trackUpload(
            mediaBlob,
            'submissions',
            `audio-grabado.${ext}`,
            avUploadRef.current,
            'media'
          );
          avUploadRef.current = r;
          payload = { audioUrl: r.readUrl };
        } else if (uploadAudioFile) {
          const sec = await probeAudioFileDurationSeconds(uploadAudioFile);
          if (sec != null && !isDurationWithinMax(sec)) {
            setErr(`El audio supera los ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
            return;
          }
          const r = await trackUpload(
            uploadAudioFile,
            'submissions',
            `audio.${uploadAudioFile.name.split('.').pop() || 'mp3'}`,
            avUploadRef.current,
            'media'
          );
          avUploadRef.current = r;
          payload = { audioUrl: r.readUrl };
        } else if (isHttpUrl(audioShareUrl)) {
          payload = { audioUrl: audioShareUrl.trim() };
        } else {
          reportStorySubmitError('missing_audio', 'payload');
          setErr('Falta el audio de la historia.');
          return;
        }
      } else if (mode === 'foto') {
        const ready = photos.filter((p) => p.readyFile);
        if (ready.length === 0) {
          reportStorySubmitError('missing_photos', 'payload');
          setErr('Faltan las fotos de la historia.');
          return;
        }
        const uploaded = await Promise.all(
          ready.map((p) =>
            uploadOnePhoto(p, (ratio) => {
              reportLoaded(`photo-${p.id}`, ratio * (p.readyFile?.size ?? 0));
            })
          )
        );
        const failed = uploaded.filter((p) => p.uploadStatus !== 'done' || !p.readUrl);
        if (failed.length > 0) {
          reportStorySubmitError('photo_partial_failed', 'story-media');
          setErr(t.modalSubmitFailedKeep);
          return;
        }
        const urls = uploaded.map((p) => p.readUrl!).filter(Boolean);
        uploaded.forEach((p) => {
          if (p.storagePath) privateMediaPaths.push(p.storagePath);
        });
        const first = urls[0];
        if (first) {
          payload = {
            photoUrl: first,
            photoUrls: urls,
            photoAlts: uploaded.map((p) => p.alt.trim().slice(0, PHOTO_ALT_MAX)),
            photoFichas: uploaded.map((p) => ({
              nombre: p.titulo.trim().slice(0, 80),
              lugar: p.lugar.trim().slice(0, 80),
              ...(p.anioDesconocido ? { decada: p.decada } : { anio: p.anio.trim() }),
              ...(p.alt.trim() ? { alt: p.alt.trim().slice(0, PHOTO_ALT_MAX) } : {}) })) };
        }
      }

      if (totalUploadBytes === 0) {
        setCreatingColors(true);
      } else {
        uploadPieces.forEach((piece) => reportLoaded(piece.key, piece.size));
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mode,
          storyTitle: title,
          alias: alias.trim(),
          email: email.trim(),
          themeId: '',
          date: '',
          dateApprox: false,
          placeLabel: placeCombined,
          countryLabel: country.trim(),
          context: buildModalSubmissionContext(
            textBody,
            title,
            city,
            country,
            mode === 'foto' ? '' : extraText
          ),
          payload,
          consentAdult: acceptedPrivacy,
          consentPublicacion: acceptedPublicacion,
          consentTerminos: acceptedTerminos,
          consentPrivacyPolicy: acceptedTerminos,
          ...(captchaTokenRef.current ? { captchaToken: captchaTokenRef.current } : {}),
          ...(profilePhotoUploaded ? { profilePhotoUrl: profilePhotoUploaded } : {}),
          ...(sex ? { sex } : {}),
          ...(ageRange ? { ageRange } : {}),
          ...(extraAttachmentUrls.length ? { extraAttachmentUrls } : {}),
          ...(privateMediaPaths.length ? { privateMediaPaths } : {}),
          ...(cancionRelacionada.trim()
            ? { cancionRelacionada: cancionRelacionada.trim().slice(0, CANCION_RELACIONADA_MAX) }
            : {}),
          ...(mode !== 'foto' && extraText.trim()
            ? { antecedentes: extraText.trim().slice(0, ANTECEDENTES_MAX) }
            : {}),
          ...(newsletterOptIn ? { newsletterOptIn: true } : {}),
          locale }) });

      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok) {
        reportStorySubmitError(data.error || `submissions_${res.status}`, 'submissions', data.error);
        if (res.status === 400) turnstileRef.current?.reset();
        if (data.error === 'uploads_paused') {
          setErr(messageForUploadError(new Error('uploads_paused'), mode));
          return;
        }
        if (data.error === TURNSTILE_REJECT_MESSAGE) {
          setErr(t.modalCaptchaFailed);
          return;
        }
        setErr(t.modalSubmitFailedKeep);
        return;
      }

      const id =
        typeof data.id === 'string' && data.id
          ? data.id
          : `AM-${Date.now().toString(36).toUpperCase()}`;
      if (typeof data.id === 'string' && data.id && adsConversionSentRef.current !== data.id) {
        adsConversionSentRef.current = data.id;
        window.gtag?.('event', 'conversion', {
          send_to: 'AW-17718043044/dK-ICKuv_KMdEKTDz4BC' });
      }
      imprintSnapRef.current = {
        textBody,
        storyTitle: title,
        extraText: mode === 'foto' ? '' : extraText,
        photoFichas: photos.map((p) => ({
          nombre: p.titulo.trim(),
          lugar: p.lugar.trim(),
          descripcion: p.alt.trim() })),
        mediaBlob,
        city,
        country };
      setImprintStoryTitle(title);
      setImprintId(id);
      setImprintReceivedAt(new Date());
      clearStoryDraft();
      setStoryTitle('');
      setTextBody('');
      setTextoReviewAck(false);
      setExtraText('');
      setCancionRelacionada('');
      setExtraFiles([]);
      setPhotos((prev) => {
        prev.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        return [];
      });
      setProfilePhoto(null);
      setUploadVideoFile(null);
      setUploadAudioFile(null);
      setVideoShareUrl('');
      setAudioShareUrl('');
      resetCaptureMedia();
      setAcceptedPrivacy(false);
      setNewsletterOptIn(false);
      setAcceptedPublicacion(false);
      setAcceptedTerminos(false);
      captchaTokenRef.current = '';
      setCaptchaGate(getTurnstileSiteKey() ? 'wait' : 'skip');
      setCaptchaEpoch((n) => n + 1);
      setStep('received');
    } catch (e) {
      reportStorySubmitError('submit_exception', 'submit', e);
      setErr(t.modalSubmitFailedKeep);
    } finally {
      submitInFlightRef.current = false;
      setSaving(false);
      setCreatingColors(false);
      setUploadProgress(null);
    }
  }, [
    saving,
    validateDetails,
    profilePhoto,
    extraFiles,
    mode,
    textBody,
    mediaBlob,
    uploadVideoFile,
    uploadAudioFile,
    videoShareUrl,
    audioShareUrl,
    photos,
    uploadOnePhoto,
    alias,
    email,
    city,
    country,
    extraText,
    cancionRelacionada,
    sex,
    ageRange,
    acceptedPrivacy,
    acceptedPublicacion,
    acceptedTerminos,
    newsletterOptIn,
    captchaGate,
    resetCaptureMedia,
    t.modalCaptchaFailed,
    t.modalSubmitFailedKeep,
  ]);

  useEffect(() => {
    if (step !== 'received' || !imprintCanvasRef.current || !imprintReceivedAt || !imprintId) return;
    const snap = imprintSnapRef.current;
    try {
      drawImprintPreview(imprintCanvasRef.current, {
        storyId: imprintId,
        receivedAt: imprintReceivedAt,
        mode,
        textBody: snap?.textBody ?? '',
        storyTitle: snap?.storyTitle ?? imprintStoryTitle,
        extraText: snap?.extraText ?? '',
        photoFichas: snap?.photoFichas ?? [],
        mediaBlob: snap?.mediaBlob ?? null,
        locale,
        city: snap?.city ?? city,
        country: snap?.country ?? country });
    } catch (e) {
      console.error('[StoryModal] drawImprintPreview', e);
    }
  }, [step, imprintId, imprintReceivedAt, imprintStoryTitle, mode, locale, city, country]);

  const flashShareNotice = useCallback((msg: string, ms = 2800) => {
    if (shareNoticeTimerRef.current) clearTimeout(shareNoticeTimerRef.current);
    setShareNotice(msg);
    shareNoticeTimerRef.current = setTimeout(() => {
      setShareNotice('');
      shareNoticeTimerRef.current = null;
    }, ms);
  }, []);

  const downloadImprint = useCallback(async () => {
    const c = imprintCanvasRef.current;
    if (!c) return;
    const filename = huellaPngFilename(imprintStoryTitle || storyTitle, imprintId);
    try {
      const blob = await canvasToPngBlob(c);
      if (isCoarsePointer && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          const file = new File([blob], filename, { type: 'image/png' });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              text: t.modalShareTextLong || PENDING_STORY_SHARE_TEXT,
            });
            return;
          }
        } catch (e) {
          if ((e as Error).name === 'AbortError') return;
        }
      }
      downloadPngBlob(blob, filename);
    } catch {
      flashShareNotice(t.modalCopyImageFailed);
    }
  }, [imprintId, imprintStoryTitle, isCoarsePointer, storyTitle, t.modalCopyImageFailed, t.modalShareTextLong, flashShareNotice]);

  const shareImprint = useCallback(async () => {
    setShareMenuShowDownload(false);
    setShareCopyFallback(null);
    const canvas = imprintCanvasRef.current;
    const phone =
      typeof navigator !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    let file: File | null = null;
    if (canvas) {
      try {
        const blob = await canvasToPngBlob(canvas);
        file = new File([blob], huellaPngFilename(imprintStoryTitle || storyTitle, imprintId), {
          type: 'image/png' });
      } catch (error) {
        console.error('[StoryModal] canvasToPngBlob', error);
        file = null;
      }
    }
    let canShare = false;
    if (
      phone &&
      file &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function'
    ) {
      try {
        canShare = navigator.canShare({ files: [file] });
      } catch (error) {
        console.error('[StoryModal] canShare', error);
        canShare = false;
      }
    }
    setShareImageFile(file);
    setShareImageApps(canShare);
    setShareMenuOpen(true);
  }, [imprintId, imprintStoryTitle, storyTitle]);

  const showCopyFallback = useCallback((text: string) => {
    if (shareNoticeTimerRef.current) {
      clearTimeout(shareNoticeTimerRef.current);
      shareNoticeTimerRef.current = null;
    }
    setShareNotice(t.modalShareCopyFailed);
    setShareCopyFallback(text);
    window.setTimeout(() => setShareMenuOpen(false), 0);
  }, [t.modalShareCopyFailed]);

  const startAnotherStory = useCallback(() => {
    setShareMenuOpen(false);
    setShareMenuShowDownload(false);
    setShareNotice('');
    setShareCopyFallback(null);
    setShareImageFile(null);
    setErr('');
    setMediaErrKind(null);
    setFieldErr({});
    resetCaptureMedia();
    setTextBody('');
    setTextoReviewAck(false);
    setPhotos((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return [];
    });
    extraUploadRef.current = [];
    profileUploadRef.current = null;
    avUploadRef.current = null;
    submitInFlightRef.current = false;
    setStoryTitle('');
    setAlias('');
    setExtraText('');
    setCancionRelacionada('');
    setExtraFiles([]);
    setProfilePhoto(null);
    setSex('');
    setAgeRange('');
    setCity('');
    setCountry('');
    setEmail('');
    setAcceptedPrivacy(false);
    setNewsletterOptIn(false);
    setAcceptedPublicacion(false);
    setAcceptedTerminos(false);
    setUploadVideoFile(null);
    setUploadAudioFile(null);
    setVideoShareUrl('');
    setAudioShareUrl('');
    setShowVideoLink(false);
    setDurationInlineErr('');
    setSaving(false);
    setImprintId('');
    setImprintReceivedAt(null);
    setImprintStoryTitle('');
    imprintSnapRef.current = null;
    captchaTokenRef.current = '';
    setCaptchaGate(getTurnstileSiteKey() ? 'wait' : 'skip');
    setCaptchaEpoch((n) => n + 1);
    setStep('capture');
  }, [resetCaptureMedia]);

  if (!isOpen) return null;

  const previewSha = previewCommitStamp();
  const previewLine = previewSha ? interpolate(t.modalPreviewVersion, { sha: previewSha }) : null;

  if (step === 'capture') {
    const copy = t.upload[mode];
    const textLinkClass =
      'm-0 cursor-pointer border-0 bg-transparent p-0 text-[length:var(--fs-etiqueta)] font-medium text-[#1C1C2E] underline underline-offset-2';
    const clock = `${formatClock(recordSec)} / ${formatClock(MAX_AUDIO_VIDEO_DURATION_SECONDS)}`;
    const hasVideo = Boolean(previewUrl && (mediaBlob || uploadVideoFile));
    const hasAudio = Boolean(previewUrl && (mediaBlob || uploadAudioFile));
    const videoLinkOpen = showVideoLink || videoShareUrl.trim().length > 0;
    const openVideoLink = () => {
      if (videoLinkOpen && !videoShareUrl.trim()) {
        setShowVideoLink(false);
        return;
      }
      setShowVideoLink(true);
      requestAnimationFrame(() => videoUrlRef.current?.focus());
    };
    const clearVideo = () => {
      discardRecording();
      removePickedFile();
      setVideoShareUrl('');
      setShowVideoLink(false);
      setMediaErrKind(null);
    };
    const clearAudio = () => {
      discardRecording();
      removePickedFile();
      setAudioShareUrl('');
      setMediaErrKind(null);
    };
    return (
      <FormatCaptureEditorialShell
        copy={copy}
        titlePreLine={mode === 'foto' || mode === 'texto'}
        onClose={requestLeave}
        footnote={previewLine}
        continueEnabled={canContinueCapture()}
        continueHint={captureFileWait()}
        onContinue={goDetails}
        continueLabel={t.modalContinue}
        closeAriaLabel={t.modalClose}
        kicker={t.modalStep1}
        className={mode === 'video' || mode === 'audio' ? amStyles.amModalAvCompact : undefined}
      >
        {err ? (
          <div className="mb-3 space-y-2">
            <p className={amStyles.amModalInlineError} role="alert">{err}</p>
            {mediaErrKind && (mode === 'video' || mode === 'audio') ? (
              <button
                type="button"
                className={textLinkClass}
                onClick={() => {
                  setErr('');
                  setMediaErrKind(null);
                  (mode === 'video' ? videoFileRef : audioFileRef).current?.click();
                }}
              >
                {mode === 'video' ? t.modalSwitchToUploadVideo : t.modalSwitchToUploadAudio}
              </button>
            ) : null}
          </div>
        ) : null}
        {chosenTopic && mode !== 'texto' && (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-[length:var(--fs-pequeno)]"
            style={soft.inset}
          >
            <div className="min-w-0">
              <p className="font-semibold text-gray-700">{t.modalTopicActive}</p>
              <p className="truncate text-gray-600 text-[length:var(--fs-texto)]">{chosenTopic.title}</p>
            </div>
            <button
              type="button"
              onClick={onClearTopic}
              className="rounded-full px-4 py-2 text-[length:var(--fs-etiqueta)] font-bold uppercase text-orange-700 tracking-[0.12em]"
              style={soft.button}
              aria-label={t.modalRemove}
            >
              {t.modalRemove}
            </button>
          </div>
        )}

        {mode === 'video' && (
          <div className="flex w-full flex-col items-center gap-3">
            {hasVideo ? (
              <>
                {avCardError ? (
                  <p className="m-0 text-center text-[length:var(--fs-etiqueta)] font-medium text-red-600" role="alert">
                    {avCardError}
                  </p>
                ) : null}
                <video
                  key={previewUrl ?? 'video'}
                  src={previewUrl ?? undefined}
                  className="mx-auto block aspect-video w-full max-w-[267px] rounded-2xl bg-[#1c1c2e] object-contain md:max-w-[391px]"
                  playsInline
                  controls
                  preload="metadata"
                  aria-label={t.modalReadyTitleVideo}
                />
                <button type="button" className={textLinkClass} onClick={clearVideo}>
                  {t.modalChangeVideo}
                </button>
              </>
            ) : phoneVideoUi ? (
              <>
                <button
                  type="button"
                  className="btn-am-principal inline-flex min-h-11 w-full items-center justify-center px-5 py-3"
                  onClick={() => videoFileRef.current?.click()}
                >
                  {t.modalRecordOrChooseVideo}
                </button>
                <button
                  type="button"
                  className={textLinkClass}
                  aria-expanded={videoLinkOpen}
                  onClick={openVideoLink}
                >
                  {t.modalPasteLink}
                </button>
              </>
            ) : (
              <>
                <div className="relative mx-auto aspect-video w-full max-w-[533px] overflow-hidden rounded-2xl bg-[#1c1c2e]">
                  <video
                    ref={videoLiveRef}
                    className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${streamReady ? 'opacity-100' : 'opacity-0'}`}
                    playsInline
                    muted
                    autoPlay
                    aria-label={streamReady ? (recording ? t.modalTapStop : t.modalTapRecord) : t.modalTurnOnCamera}
                  />
                  <div
                    className={`absolute inset-0 flex flex-col items-center gap-1 ${
                      streamReady
                        ? 'justify-end bg-gradient-to-t from-black/55 via-black/10 to-transparent pb-3'
                        : 'justify-center'
                    }`}
                  >
                    {streamReady ? (
                      <>
                        <button
                          type="button"
                          onClick={recording ? stopRecording : startRecordingVideo}
                          aria-pressed={recording}
                          aria-label={recording ? t.modalTapStop : t.modalTapRecord}
                          className={`flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 bg-black/35 text-white ${
                            recording ? 'border-[#FF4A1C]' : 'border-white'
                          }`}
                        >
                          {recording ? (
                            <Square size={22} aria-hidden />
                          ) : (
                            <span className="h-6 w-6 rounded-full bg-[#FF4A1C]" aria-hidden />
                          )}
                        </button>
                        <p className="m-0 text-[length:var(--fs-etiqueta)] font-semibold text-white" aria-live="polite">
                          {clock}
                        </p>
                        {recording && recordSec >= 270 ? (
                          <p className="m-0 text-[length:var(--fs-etiqueta)] font-semibold text-[#FF4A1C]" aria-live="assertive">
                            {t.modalRecordingSoonEnd}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => void startVideoCapture()}
                          aria-label={t.modalTurnOnCamera}
                          className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white bg-white/10 text-white"
                        >
                          <Video size={28} aria-hidden />
                        </button>
                        <p className="m-0 text-[length:var(--fs-etiqueta)] text-white">{t.modalTurnOnCamera}</p>
                      </>
                    )}
                  </div>
                </div>
                {!recording ? (
                  <div className="flex items-center justify-center gap-4">
                    <button type="button" className={textLinkClass} onClick={() => videoFileRef.current?.click()}>
                      {t.modalUploadVideoLink}
                    </button>
                    <button
                      type="button"
                      className={textLinkClass}
                      aria-expanded={videoLinkOpen}
                      onClick={openVideoLink}
                    >
                      {t.modalPasteLink}
                    </button>
                  </div>
                ) : null}
              </>
            )}
            {!hasVideo && !recording && videoLinkOpen ? (
              <div className="w-full space-y-1">
                <input
                  ref={videoUrlRef}
                  id="story-video-url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  value={videoShareUrl}
                  aria-label={t.modalPasteLink}
                  onChange={(e) => {
                    const value = e.target.value;
                    setVideoShareUrl(value);
                    if (value.trim() && (streamReady || mediaBlob || uploadVideoFile)) {
                      discardRecording();
                      removePickedFile();
                    }
                  }}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[16px] text-[#1C1C2E] outline-none focus:border-[#FF4A1C]"
                  aria-invalid={videoShareUrl.trim().length > 0 && !isVideoShareUrl(videoShareUrl)}
                />
                <p className="m-0 text-[length:var(--fs-etiqueta)] text-[#6b6b7b]">{t.modalVideoLinkHint}</p>
                {videoShareUrl.trim().length > 0 && !isVideoShareUrl(videoShareUrl) ? (
                  <p className="m-0 text-[length:var(--fs-etiqueta)] text-amber-700" role="alert">
                    Usa un enlace de YouTube o Vimeo
                  </p>
                ) : null}
              </div>
            ) : null}
            <input
              ref={videoFileRef}
              id="story-video-file"
              type="file"
              accept="video/*"
              aria-label={t.modalRecordOrChooseVideo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                discardRecording();
                setShowVideoLink(false);
                acceptUploadFile('video', f);
              }}
              className="sr-only"
            />
          </div>
        )}

        {mode === 'audio' && (
          <div className="flex w-full flex-col items-center gap-2">
            {hasAudio ? (
              <>
                {avCardError ? (
                  <p className="m-0 text-center text-[length:var(--fs-etiqueta)] font-medium text-red-600" role="alert">
                    {avCardError}
                  </p>
                ) : null}
                <audio
                  key={previewUrl ?? 'audio'}
                  src={previewUrl ?? undefined}
                  controls
                  preload="metadata"
                  className="w-full"
                  aria-label={t.modalReadyTitleAudio}
                />
                <button type="button" className={textLinkClass} onClick={clearAudio}>
                  {t.modalRecordAgain}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => (recording ? stopRecording() : void beginAudioRecording())}
                  aria-pressed={recording}
                  aria-label={recording ? t.modalTapStop : t.modalTapRecord}
                  className={`flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 bg-transparent ${
                    recording ? 'border-[#FF4A1C] text-[#FF4A1C]' : 'border-black/20 text-[#1C1C2E]'
                  }`}
                >
                  <Mic size={28} aria-hidden />
                </button>
                <p className="m-0 text-[length:var(--fs-pequeno)] text-[#1C1C2E]">
                  {recording ? t.modalTapStop : t.modalTapRecord}
                </p>
                <p className="m-0 text-[length:var(--fs-pequeno)] font-semibold text-[#1C1C2E]" aria-live="polite">
                  {clock}
                </p>
                {recording && recordSec >= 270 ? (
                  <p className="m-0 text-[length:var(--fs-etiqueta)] font-semibold text-[#FF4A1C]" aria-live="assertive">
                    {t.modalRecordingSoonEnd}
                  </p>
                ) : null}
                {!recording ? (
                  <button type="button" className={textLinkClass} onClick={() => audioFileRef.current?.click()}>
                    {t.modalUploadAudioLink}
                  </button>
                ) : null}
              </>
            )}
            <input
              ref={audioFileRef}
              id="story-audio-file"
              type="file"
              accept={SUBIR_AUDIO_FILE_ACCEPT}
              aria-label={t.modalUploadAudioLink}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                discardRecording();
                acceptUploadFile('audio', f);
              }}
              className="sr-only"
            />
          </div>
        )}

        {mode === 'texto' && (
          <div className="space-y-4">
            {chosenTopic && (
              <div className="space-y-3 rounded-2xl p-4" style={soft.inset}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[length:var(--fs-texto)] font-semibold text-gray-800 ">{t.modalInspiration} · {chosenTopic.title}</p>
                  <button
                    type="button"
                    onClick={onClearTopic}
                    className="rounded-full px-3 py-1.5 text-[length:var(--fs-etiqueta)] font-bold text-orange-700"
                    style={soft.button}
                    aria-label={t.modalRemoveInspiration}
                  >
                    {t.modalRemoveInspiration}
                  </button>
                </div>
                <ul className="list-inside list-disc space-y-2 text-[length:var(--fs-texto)] text-gray-600 ">
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
              rows={10}
              className={amStyles.amTextarea}
              aria-label={t.modalSectionStory}
              maxLength={SUBIR_TEXT_MAX_CHARS}
            />
            <p
              className={`${amStyles.amTextareaCounter} ${
                textBody.length >= SUBIR_TEXT_COUNTER_WARN_CHARS ? amStyles.amTextareaCounterWarn : ''
              }`}
              aria-live="polite"
            >
              {interpolate(t.modalChars, {
                n: String(textBody.length),
                max: String(SUBIR_TEXT_MAX_CHARS) })}
            </p>
          </div>
        )}

        {mode === 'foto' && (
          <UploadModalFotoCapture
            photos={photos}
            onAddFiles={addPhotos}
            onRemove={removePhotoAt}
            onRetry={retryPhotoUpload}
            onPatch={patchPhoto}
            convertingLabel={t.modalPhotoConverting}
            onUnreadable={(id) => {
              setPhotos((prev) => {
                const target = prev.find((p) => p.id === id);
                if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
                return prev.filter((p) => p.id !== id);
              });
              setErr(t.modalPhotoReadError);
            }}
            retryLabel={t.modalPhotoRetry}
            failedLabel={t.modalPhotoUploadFailed}
            inlineError={err || undefined}
            incompleteIds={photos.filter((p) => photoFichaIssue(p) != null).map((p) => p.id)}
            fichaMessage={(() => {
              const year = currentPhotoYear();
              const index = photos.findIndex((p) => photoFichaIssue(p, year) != null);
              if (index < 0) return undefined;
              const photo = photos[index]!;
              const issue = photoFichaIssue(photo, year) as PhotoFichaIssue;
              const foto = photo.titulo.trim() ? `«${photo.titulo.trim()}»` : String(index + 1);
              if (issue === 'nombre') return interpolate(t.modalPhotoMissingName, { foto });
              if (issue === 'anio') return interpolate(t.modalPhotoMissingYear, { foto });
              if (issue === 'anio-invalido') {
                return interpolate(t.modalPhotoInvalidYear, { foto, max: year });
              }
              if (issue === 'decada') return interpolate(t.modalPhotoMissingDecade, { foto });
              return interpolate(t.modalPhotoMissingPlace, { foto });
            })()}
          />
        )}
      </FormatCaptureEditorialShell>
    );
  }

  return (
    <div
      className={`story-submit-modal font-interna fixed inset-0 z-[220] flex ${
        step === 'received'
          ? 'items-center justify-center p-4'
          : 'items-stretch p-0 md:items-center md:justify-center md:p-4'
      }`}
      data-lenis-prevent=""
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        fontFamily: APP_FONT }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={step === 'details' ? 'story-modal-details-title' : 'story-modal-title'}
      onKeyDown={(event) => {
        if (event.key !== 'Tab' || step !== 'details') return;
        const root = event.currentTarget;
        const focusable = [...root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        )].filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !root.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div
        className={`flex min-h-0 w-full flex-col overflow-hidden transition-all duration-200 ease-out ${
          step === 'received'
            ? 'h-[min(90vh,92dvh)] max-h-[min(90vh,92dvh)] max-w-[720px]'
            : 'story-submit-card--details h-[100dvh] max-h-[100dvh] max-w-none pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] md:h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] md:max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] md:max-w-4xl md:pt-0 md:pr-0 md:pb-0 md:pl-0'
        }`}
        style={{ ...soft.flat, fontFamily: APP_FONT }}
      >
        <header
          className={`flex shrink-0 items-start justify-between gap-4 border-b border-white/30 ${
            step === 'received' ? 'px-4 py-3 md:px-5' : 'px-5 py-4 md:px-8 md:py-5'
          }`}
          style={{ backgroundColor: soft.bg }}
        >
          <div className="min-w-0 space-y-1">
            <p className="text-[length:var(--fs-pequeno)] font-bold uppercase text-orange-600 tracking-[0.12em]">
              ALMAMUNDI
            </p>
            {step !== 'details' && (
              <span id="story-modal-title" className="sr-only">
                {step === 'received' ? t.modalConfirmSend : t.modalCapture}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={requestLeave}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:text-red-600 active:scale-95 md:h-14 md:w-14"
            style={soft.button}
            aria-label={t.modalClose}
          >
            <X size={22} strokeWidth={2} />
          </button>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-x-hidden overscroll-contain ${
            step === 'details'
              ? 'flex flex-col overflow-hidden'
              : step === 'received'
                ? 'overflow-y-auto px-4 py-3 md:px-5 md:py-4'
                : 'overflow-y-auto px-5 py-5 md:px-8 md:py-6'
          }`}
          style={{ backgroundColor: step === 'received' ? '#FAFAF5' : soft.bg }}
        >
          {step === 'details' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div aria-hidden className="h-6 shrink-0" />
              <div
                className="story-submit-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-3 sm:px-4 md:px-5"
                onFocusCapture={(event) => {
                  const target = event.target;
                  if (!(target instanceof HTMLElement)) return;
                  if (!target.matches('input, textarea, select')) return;
                  target.scrollIntoView({ block: 'center', inline: 'nearest' });
                }}
              >
              <div className="space-y-1 px-0.5">
                <p className="text-[length:var(--fs-etiqueta)] font-semibold text-gray-700" aria-live="polite">
                  {t.modalStep2}
                </p>
                <h3
                  id="story-modal-details-title"
                  className="text-[length:var(--fs-texto)] font-normal leading-tight text-gray-800 "
                >
                  {t.modalDetailsTitle}
                </h3>
                <p className="text-[length:var(--fs-etiqueta)] leading-snug text-gray-600">{t.modalDetailsSubtitle}</p>
                <p className="text-[length:var(--fs-etiqueta)] text-gray-500">{t.modalRequiredFieldsNote}</p>
              </div>

              <div className="mt-2 grid grid-cols-1 items-start gap-2 md:grid-cols-2 md:gap-4">
                {/* Historia + extras — columna izquierda */}
                <div className="rounded-2xl p-3 md:p-4" style={soft.inset}>
                  <div className="mb-2 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700 ">
                    {mode === 'foto' ? t.modalSectionAbout : t.modalSectionYourStory}
                  </div>
                  <div className="space-y-2">
                    {mode !== 'foto' ? (
                    <div>
                      <label
                        htmlFor="story-title"
                        className="mb-0.5 flex items-center gap-1.5 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        <FileText size={12} className="text-orange-500" aria-hidden />
                        {t.modalStoryName}
                      </label>
                      <input
                        id="story-title"
                        value={storyTitle}
                        onChange={(e) => {
                          setStoryTitle(e.target.value);
                          if (err) setErr('');
                          if (fieldErr.title) setFieldErr((p) => ({ ...p, title: undefined }));
                        }}
                        className="w-full rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      />
                      {fieldErr.title ? (
                        <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-red-600" role="alert">{fieldErr.title}</p>
                      ) : null}
                    </div>
                    ) : null}
                    {mode === 'foto' ? (
                    <div>
                      <label
                        htmlFor="story-alias"
                        className="mb-0.5 flex items-center gap-1.5 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        <User size={12} className="text-orange-500" aria-hidden />
                        {t.modalAlias}
                      </label>
                      <input
                        id="story-alias"
                        value={alias}
                        onChange={(e) => {
                          setAlias(e.target.value);
                          if (err) setErr('');
                          if (fieldErr.alias) setFieldErr((p) => ({ ...p, alias: undefined }));
                        }}
                        className="w-full rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      />
                      <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-gray-600">{t.modalAliasHint}</p>
                      {fieldErr.alias ? (
                        <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-red-600" role="alert">{fieldErr.alias}</p>
                      ) : null}
                    </div>
                    ) : null}
                    {mode !== 'foto' ? (
                    <div>
                      <label
                        htmlFor="story-extras"
                        className="mb-0.5 block text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        {t.modalExtras}
                      </label>
                      {mode === 'audio' || mode === 'video' ? (
                        <p className="mb-0.5 text-[length:var(--fs-etiqueta)] leading-snug text-gray-600">
                          {t.modalExtrasColorHint}
                        </p>
                      ) : null}
                      <textarea
                        id="story-extras"
                        value={extraText}
                        onChange={(e) => setExtraText(e.target.value.slice(0, ANTECEDENTES_MAX))}
                        maxLength={ANTECEDENTES_MAX}
                        rows={2}
                        className="w-full resize-none rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      />
                    </div>
                    ) : null}
                    {mode !== 'foto' ? (
                    <div>
                      <label
                        htmlFor="story-cancion-relacionada"
                        className="mb-0.5 block text-[length:var(--fs-etiqueta)] font-semibold normal-case leading-snug text-gray-700"
                      >
                        {t.modalCancionRelacionada}
                      </label>
                      <input
                        id="story-cancion-relacionada"
                        value={cancionRelacionada}
                        onChange={(e) => setCancionRelacionada(e.target.value.slice(0, CANCION_RELACIONADA_MAX))}
                        maxLength={CANCION_RELACIONADA_MAX}
                        className="w-full rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      />
                    </div>
                    ) : null}
                    {mode !== 'foto' ? (
                    <div>
                      <div className="mb-0.5 flex items-center gap-1.5 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700">
                        <Upload size={12} className="text-orange-500" aria-hidden />
                        {t.modalFiles}
                      </div>
                      <label
                        className="flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] text-gray-600 "
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      >
                        <span>{t.modalAttach}</span>
                        <input
                          type="file"
                          multiple
                          accept={SUBIR_EXTRA_FILE_ACCEPT}
                          className="hidden"
                          onChange={(e) => addExtraFiles(e.target.files)}
                        />
                      </label>
                      <p className="mt-0.5 text-[length:var(--fs-etiqueta)] leading-tight text-gray-500">
                        JPG, PNG, WEBP o HEIC.
                      </p>
                      {extraPreparing ? (
                        <p className="mt-1 inline-flex items-center gap-2 text-[length:var(--fs-etiqueta)] text-gray-700" role="status">
                          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" aria-hidden />
                          {t.modalPhotoConverting}
                        </p>
                      ) : null}
                      {extraFiles.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[length:var(--fs-etiqueta)] text-gray-700">
                          {extraFiles.map((f, idx) => (
                            <li key={f.name + idx} className="flex items-center justify-between gap-1">
                              <span className="truncate">{f.name}</span>
                              <button
                                type="button"
                                onClick={() => removeExtraFile(idx)}
                                className="shrink-0 text-[length:var(--fs-etiqueta)] font-bold uppercase text-gray-500 hover:text-red-500 tracking-[0.12em]"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    ) : null}
                    {mode === 'foto' ? (
                    <div>
                      <p className="mb-2 text-[length:var(--fs-etiqueta)] leading-snug text-gray-700">
                        {t.modalProfilePhotoNote}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className="inline-flex min-h-11 cursor-pointer items-center rounded-xl px-4 text-[length:var(--fs-etiqueta)] text-gray-600"
                          style={{ ...soft.flat, borderRadius: '12px' }}
                        >
                          {profilePhoto ? t.modalChange : t.modalUpload}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onPickProfilePhoto(e.target.files?.[0] ?? null)}
                          />
                        </label>
                        {profileConverting ? (
                          <p className="inline-flex min-h-11 items-center gap-2 text-[length:var(--fs-etiqueta)] text-gray-700" role="status">
                            <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" aria-hidden />
                            {t.modalPhotoConverting}
                          </p>
                        ) : profilePhotoUrl ? (
                          <>
                            <div className="h-8 w-8 overflow-hidden rounded-lg" style={{ ...soft.flat, borderRadius: '8px' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={profilePhotoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={() => {
                                  setProfilePhoto(null);
                                  setErr(t.modalPhotoReadError);
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                profileConvertToken.current += 1;
                                setProfileConverting(false);
                                setProfilePhoto(null);
                              }}
                              className="inline-flex min-h-11 items-center px-2 text-[length:var(--fs-etiqueta)] font-semibold text-gray-500 hover:text-red-500"
                            >
                              {t.modalRemove}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl p-3 md:p-4" style={soft.inset}>
                  <div className="mb-2 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700 ">
                    {mode === 'foto' ? t.modalSectionWhere : t.modalSectionAbout}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {mode !== 'foto' ? (
                    <>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="story-alias"
                        className="mb-0.5 flex items-center gap-1.5 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        <User size={12} className="text-orange-500" aria-hidden />
                        {t.modalAlias}
                      </label>
                      <input
                        id="story-alias"
                        value={alias}
                        onChange={(e) => {
                          setAlias(e.target.value);
                          if (err) setErr('');
                          if (fieldErr.alias) setFieldErr((p) => ({ ...p, alias: undefined }));
                        }}
                        className="w-full rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      />
                      <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-gray-600">{t.modalAliasHint}</p>
                      {fieldErr.alias ? (
                        <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-red-600" role="alert">{fieldErr.alias}</p>
                      ) : null}
                    </div>
                    <div className="sm:col-span-2">
                      <p className="mb-2 text-[length:var(--fs-etiqueta)] leading-snug text-gray-700">
                        {t.modalProfilePhotoNote}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className="inline-flex min-h-11 cursor-pointer items-center rounded-xl px-4 text-[length:var(--fs-etiqueta)] text-gray-600"
                          style={{ ...soft.flat, borderRadius: '12px' }}
                        >
                          {profilePhoto ? t.modalChange : t.modalUpload}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onPickProfilePhoto(e.target.files?.[0] ?? null)}
                          />
                        </label>
                        {profileConverting ? (
                          <p className="inline-flex min-h-11 items-center gap-2 text-[length:var(--fs-etiqueta)] text-gray-700" role="status">
                            <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" aria-hidden />
                            {t.modalPhotoConverting}
                          </p>
                        ) : profilePhotoUrl ? (
                          <>
                            <div className="h-8 w-8 overflow-hidden rounded-lg" style={{ ...soft.flat, borderRadius: '8px' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={profilePhotoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={() => {
                                  setProfilePhoto(null);
                                  setErr(t.modalPhotoReadError);
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                profileConvertToken.current += 1;
                                setProfileConverting(false);
                                setProfilePhoto(null);
                              }}
                              className="inline-flex min-h-11 items-center px-2 text-[length:var(--fs-etiqueta)] font-semibold text-gray-500 hover:text-red-500"
                            >
                              {t.modalRemove}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    </>
                    ) : null}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="story-country"
                        className="mb-0.5 flex items-center gap-1.5 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        <Globe2 size={12} className="text-orange-500" aria-hidden />
                        {t.modalCountry}
                      </label>
                      <input
                        id="story-country"
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          if (fieldErr.country) setFieldErr((p) => ({ ...p, country: undefined }));
                        }}
                        className="w-full rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                        autoComplete="off"
                      />
                      {fieldErr.country ? (
                        <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-red-600" role="alert">{fieldErr.country}</p>
                      ) : null}
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="story-city"
                        className="mb-0.5 flex items-center gap-1.5 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        <MapPin size={12} className="text-orange-500" aria-hidden />
                        {t.modalCity}
                      </label>
                      <input
                        id="story-city"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          if (fieldErr.city) setFieldErr((p) => ({ ...p, city: undefined }));
                        }}
                        className="w-full rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                        autoComplete="off"
                      />
                      <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-gray-600">{t.modalLocationHint}</p>
                      {fieldErr.city ? (
                        <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-red-600" role="alert">{fieldErr.city}</p>
                      ) : null}
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="story-age"
                        className="mb-0.5 block text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        {t.modalAge}
                      </label>
                      <select
                        id="story-age"
                        value={ageRange}
                        onChange={(e) => {
                          setAgeRange(e.target.value as AgeRange);
                          if (fieldErr.age) setFieldErr((p) => ({ ...p, age: undefined }));
                        }}
                        className="w-full rounded-xl px-2 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      >
                        <option value="">{t.modalAgeChoose}</option>
                        {AGE_RANGE_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.id === 'menos-18'
                              ? t.modalAgeMenos18
                              : o.id === '60-mas'
                                ? t.modalAge60
                                : o.id === 'prefiero-no-decir'
                                  ? t.modalAgePreferNot
                                  : o.label}
                          </option>
                        ))}
                      </select>
                      {fieldErr.age ? (
                        <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-red-600" role="alert">{fieldErr.age}</p>
                      ) : null}
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="story-gender"
                        className="mb-0.5 flex items-center gap-1.5 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        <Users size={12} className="text-orange-500" aria-hidden />
                        {t.modalGender}
                      </label>
                      <select
                        id="story-gender"
                        value={sex}
                        onChange={(e) => setSex(e.target.value as Sex)}
                        className="w-full rounded-xl px-2 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      >
                        <option value="">{t.modalGenderBlank}</option>
                        <option value="femenino">{t.modalGenderFemale}</option>
                        <option value="masculino">{t.modalGenderMale}</option>
                        <option value="no-binario">{t.modalGenderNb}</option>
                        <option value="prefiero-no-decir">{t.modalGenderPreferNot}</option>
                        <option value="otro">{t.modalGenderOther}</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="story-email"
                        className="mb-0.5 flex items-center gap-1.5 text-[length:var(--fs-etiqueta)] font-semibold normal-case text-gray-700"
                      >
                        <Mail size={12} className="text-orange-500" aria-hidden />
                        {t.modalEmail}
                      </label>
                      <input
                        id="story-email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErr.email) setFieldErr((p) => ({ ...p, email: undefined }));
                        }}
                        type="email"
                        autoComplete="off"
                        className="w-full rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                        style={{ ...soft.flat, borderRadius: '12px' }}
                      />
                      <p className="mt-0.5 text-[length:var(--fs-etiqueta)] leading-tight text-gray-600 ">
                        {t.modalEmailHint}
                      </p>
                      {fieldErr.email ? (
                        <p className="mt-0.5 text-[length:var(--fs-etiqueta)] text-red-600" role="alert">{fieldErr.email}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {mode === 'foto' ? (
                <div className="mt-2 rounded-2xl p-3 md:p-4" style={soft.inset}>
                  <label
                    htmlFor="story-cancion-relacionada"
                    className="mb-2 block text-[length:var(--fs-etiqueta)] font-semibold leading-snug text-gray-700"
                  >
                    {t.modalCancionRelacionada}
                  </label>
                  <input
                    id="story-cancion-relacionada"
                    value={cancionRelacionada}
                    onChange={(e) => setCancionRelacionada(e.target.value.slice(0, CANCION_RELACIONADA_MAX))}
                    maxLength={CANCION_RELACIONADA_MAX}
                    className="w-full rounded-xl px-2.5 py-1.5 text-[length:var(--fs-pequeno)] outline-none text-gray-800"
                    style={{ ...soft.flat, borderRadius: '12px' }}
                  />
                </div>
              ) : null}

              {mode === 'foto' && fieldErr.title ? (
                <p className="mt-2 text-[length:var(--fs-etiqueta)] text-red-600" role="alert">{fieldErr.title}</p>
              ) : null}

              {err && (
                <p className="shrink-0 rounded-lg px-2 py-1 text-[length:var(--fs-etiqueta)] font-medium text-red-600 " role="alert">
                  {err}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <AdultConsentCheckbox
                  checked={acceptedPrivacy}
                  onChange={setAcceptedPrivacy}
                  label={t.modalConsentAdult}
                />
                <AdultConsentCheckbox
                  id="consent-publicacion"
                  checked={acceptedPublicacion}
                  onChange={setAcceptedPublicacion}
                  label={t.modalConsentPublish}
                />
                <div className="flex items-start gap-2">
                  <input
                    id="consent-terminos"
                    type="checkbox"
                    checked={acceptedTerminos}
                    onChange={(e) => setAcceptedTerminos(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
                  />
                  <label htmlFor="consent-terminos" className="text-[length:var(--fs-etiqueta)] font-semibold leading-snug text-gray-700 ">
                    Acepto los{' '}
                    <a
                      className="text-orange-600 underline"
                      href="/terminos"
                      {...(textBody.trim() || storyTitle.trim() || mediaBlob || photos.length > 0 || recording
                        ? { target: '_blank' as const, rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {t.modalConsentTermsLink}
                    </a>
                    {' y la '}
                    <a
                      className="text-orange-600 underline"
                      href="/privacidad"
                      {...(textBody.trim() || storyTitle.trim() || mediaBlob || photos.length > 0 || recording
                        ? { target: '_blank' as const, rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {t.modalConsentPrivacyLink}
                    </a>.
                  </label>
                </div>
                <AdultConsentCheckbox
                  id="consent-newsletter"
                  checked={newsletterOptIn}
                  onChange={setNewsletterOptIn}
                  label={t.modalNewsletterOptIn}
                />
                <p className={amStyles.amModalLegal}>{t.modalLegalNote}</p>
                <TurnstileWidget
                  ref={turnstileRef}
                  key={captchaEpoch}
                  onTokenChange={(token) => {
                    captchaTokenRef.current = token;
                  }}
                  onGateChange={setCaptchaGate}
                />
              </div>
              </div>
              <div className="shrink-0 px-4 pt-3 md:px-8">
                  {creatingColors ? (
                    <div className="basis-full">
                      <style>{`
                        @keyframes story-upload-indeterminate {
                          0% { transform: translateX(-120%); }
                          100% { transform: translateX(420%); }
                        }
                        @media (prefers-reduced-motion: reduce) {
                          .story-upload-indeterminate {
                            animation: none !important;
                            width: 100% !important;
                            transform: none !important;
                          }
                        }
                      `}</style>
                      <div
                        className="relative h-2 w-full overflow-hidden rounded-full bg-[#d5d8e0]"
                        role="progressbar"
                        aria-busy="true"
                        aria-label={t.modalCreatingColors}
                      >
                        <div
                          className="story-upload-indeterminate absolute inset-y-0 left-0 w-1/3 rounded-full bg-[var(--almamundi-orange)]"
                          style={{ animation: 'story-upload-indeterminate 1.15s ease-in-out infinite' }}
                        />
                      </div>
                      <p className="mt-1 text-left text-[length:var(--fs-etiqueta)] leading-snug text-gray-700" aria-live="polite">
                        {t.modalUploadColorsWait}
                      </p>
                    </div>
                  ) : uploadProgress != null ? (
                    <div className="basis-full">
                      <div
                        className="h-2 w-full overflow-hidden rounded-full bg-[#d5d8e0]"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={uploadProgress}
                        aria-label={t.modalUploadProgress}
                      >
                        <div
                          className="h-full bg-[var(--almamundi-orange)]"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[length:var(--fs-etiqueta)] font-semibold text-gray-700">{uploadProgress}%</p>
                    </div>
                  ) : null}
                  {!saving && !(acceptedPrivacy && acceptedPublicacion && acceptedTerminos) ? (
                    <p className="mb-2 text-right text-[length:var(--fs-etiqueta)] text-gray-600">
                      {t.modalMarkThreeToSend}
                    </p>
                  ) : null}
                  <div className="mb-6 flex flex-nowrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErr('');
                      setStep('capture');
                    }}
                    className="btn-am-neutro inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap px-4 py-2 text-[length:var(--fs-pequeno)] font-semibold active:scale-95 md:px-6"
                    style={{ fontFamily: APP_FONT }}
                  >
                    {t.modalBack}
                  </button>
                    <button
                      type="button"
                      onClick={submitDetails}
                      disabled={
                        saving || !acceptedPrivacy || !acceptedPublicacion || !acceptedTerminos
                      }
                      className="btn-am-principal inline-flex min-h-11 min-w-0 items-center justify-center px-4 py-2 text-center text-[length:var(--fs-pequeno)] font-semibold leading-tight active:scale-95 disabled:opacity-60 md:px-6"
                      style={{ fontFamily: APP_FONT }}
                    >
                      {creatingColors
                        ? t.modalCreatingColors
                        : saving
                        ? mode === 'video'
                          ? t.modalSendingVideo
                          : mode === 'audio'
                            ? t.modalSendingAudio
                            : mode === 'texto'
                              ? t.modalSendingText
                              : t.modalSendingPhotos
                        : mode === 'video'
                          ? t.modalSendVideo
                          : mode === 'audio'
                            ? t.modalSendAudio
                            : mode === 'texto'
                              ? t.modalSendText
                              : photos.length > 1
                                ? t.modalSendPhotos
                                : t.modalSendPhoto}
                    </button>
                  </div>
              </div>
            </div>
          )}

          {step === 'received' && (
            <div className="font-interna flex flex-col">
              <div className="shrink-0 space-y-2 text-center">
                <h3 className="text-[length:var(--fs-titular)] font-semibold leading-[1.15] text-[#141D26]">
                  {alias.trim() ? (
                    <>
                      {aliasForGreeting(alias, locale)}, {t.modalReceivedAfterName}
                    </>
                  ) : (
                    t.modalReceivedAnonBefore
                  )}
                </h3>
                <p className="text-[length:var(--fs-etiqueta)] font-normal leading-snug text-[#5C5C52]">
                  {t.modalImprintExplain}
                </p>
                <p className="text-[length:var(--fs-etiqueta)] font-normal leading-snug text-[#5C5C52]">
                  {t.modalReviewInProgress}
                </p>
              </div>

              <div className="mx-auto mt-4 aspect-square w-full shrink-0 overflow-hidden rounded-lg border border-[#e8e6e0] bg-[#F7F4EE] md:w-[420px]">
                  <canvas
                    ref={imprintCanvasRef}
                    className="block h-full w-full object-contain"
                    aria-label={t.modalImprintAria}
                  />
              </div>
              <p className="mx-auto mt-2 w-full text-[length:var(--fs-etiqueta)] font-semibold leading-snug text-[#141D26] md:w-[420px]">
                {t.modalImprintWhat}
              </p>
              <p className="mx-auto mt-1 w-full text-[length:var(--fs-etiqueta)] leading-snug text-[#5C5C52] md:w-[420px]">
                {mode === 'texto'
                  ? t.modalImprintHowTexto
                  : mode === 'foto'
                    ? t.modalImprintHowFoto
                    : mode === 'audio'
                      ? t.modalImprintHowAudio
                      : t.modalImprintHowVideo}
              </p>

              <div className="mt-4 shrink-0">
                <div className="flex flex-col gap-2 md:flex-row">
                  <button
                    type="button"
                    onClick={() => void downloadImprint()}
                    className="btn-am-principal inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-[length:var(--fs-pequeno)] font-semibold md:flex-1"
                  >
                    <Download size={16} strokeWidth={1.6} aria-hidden />
                    {t.modalDownloadImprint}
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareImprint()}
                    className="btn-am-secundario inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-[length:var(--fs-pequeno)] font-medium md:flex-1"
                  >
                    <Share2 size={15} aria-hidden />
                    {t.modalShareImprint}
                  </button>
                </div>
                <div className="mt-8">
                  <p className="mb-2 text-[length:var(--fs-etiqueta)] font-semibold text-[#5C5C52]">{t.modalNowWhat}</p>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/pregunta');
                    }}
                    className="mb-2 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D4D4C4] bg-white px-4 text-[length:var(--fs-pequeno)] font-medium text-[#141D26] transition hover:border-[var(--almamundi-orange)] hover:text-[var(--almamundi-orange)]"
                  >
                    {t.modalAnswerWeekQuestion}
                  </button>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <button
                      type="button"
                      onClick={startAnotherStory}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D4D4C4] bg-white px-4 text-[length:var(--fs-pequeno)] font-medium text-[#141D26] transition hover:border-[var(--almamundi-orange)] hover:text-[var(--almamundi-orange)] md:flex-1"
                    >
                      {mode === 'foto'
                        ? t.modalAnotherCtaFoto
                        : mode === 'video'
                          ? t.modalAnotherCtaVideo
                          : mode === 'audio'
                            ? t.modalAnotherCtaAudio
                            : t.modalAnotherCtaTexto}
                    </button>
                    <button
                      type="button"
                      onClick={onExploreMap}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D4D4C4] bg-white px-4 text-[length:var(--fs-pequeno)] font-medium text-[#141D26] transition hover:border-[var(--almamundi-orange)] hover:text-[var(--almamundi-orange)] md:flex-1"
                    >
                      {t.modalBackToMap}
                    </button>
                  </div>
                  <p className="mt-2 text-center">
                    <a
                      href="/contar"
                      onClick={(event) => {
                        event.preventDefault();
                        router.push('/contar');
                      }}
                      className="inline-flex min-h-11 items-center text-[length:var(--fs-etiqueta)] text-[#6B6B60] underline-offset-2 hover:text-[var(--almamundi-orange)] hover:underline"
                    >
                      {t.modalAnotherFormatLink}
                    </a>
                  </p>
                  <p className="mt-4 text-center text-[length:var(--fs-etiqueta)] leading-snug text-[#5C5C52]">
                    {t.modalContactLead}{' '}
                    <a
                      href="mailto:hola@almamundi.org"
                      className="text-[var(--almamundi-orange)] underline underline-offset-2"
                    >
                      hola@almamundi.org
                    </a>
                    .
                  </p>
                </div>
                <p
                  className={`min-h-[1.1rem] text-center text-[length:var(--fs-etiqueta)] font-semibold text-[var(--almamundi-orange)] ${
                    shareNotice ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-live="polite"
                >
                  {shareNotice || '\u00a0'}
                </p>
                {shareCopyFallback ? (
                  <textarea
                    readOnly
                    value={shareCopyFallback}
                    aria-label={t.modalShareCopyFailed}
                    className="mt-2 w-full resize-y rounded-xl border border-[#D4D4C4] bg-white px-3 py-2 text-[length:var(--fs-pequeno)] text-[#141D26]"
                    rows={4}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                ) : null}
              </div>
            </div>
          )}

          {shareMenuOpen ? (
            <StoryShareMenu
              shareUrl={PENDING_STORY_SHARE_URL}
              shareTextShort={t.modalShareTextShort || PENDING_STORY_SHARE_TEXT_SHORT}
              shareTextLong={t.modalShareTextLong || PENDING_STORY_SHARE_TEXT}
              shareTextSocial={t.modalShareTextLong || PENDING_STORY_SHARE_TEXT}
              emailSubject={t.modalShareEmailSubject || PENDING_STORY_SHARE_EMAIL_SUBJECT}
              labels={{
                title: t.modalShareMenuTitle,
                facebook: t.modalShareFacebook,
                x: t.modalShareX,
                linkedin: t.modalShareLinkedIn,
                instagram: t.modalShareInstagram,
                tiktok: t.modalShareTikTok,
                email: t.modalShareEmail,
                copyLink: t.modalCopyLink,
                download: isCoarsePointer ? t.modalSaveImage : t.modalDownloadImprint,
                close: t.modalClose }}
              showDownload={shareMenuShowDownload}
              showImageApps={shareImageApps}
              imageFile={shareImageFile}
              shareTitle={(imprintStoryTitle || storyTitle).trim() || 'AlmaMundi'}
              onCopied={() => {
                setShareCopyFallback(null);
                flashShareNotice(t.modalShareLinkCopied);
                setShareMenuOpen(false);
              }}
              onTextCopied={() => {
                setShareCopyFallback(null);
                flashShareNotice(t.modalShareTextCopied);
                setShareMenuOpen(false);
              }}
              onAppHandoff={(app) => {
                setShareCopyFallback(null);
                flashShareNotice(interpolate(t.modalShareAppHandoff, { app }), 7000);
                setShareMenuOpen(false);
              }}
              onCopyFailed={showCopyFallback}
              onDownload={() => {
                setShareMenuOpen(false);
                void downloadImprint();
              }}
              onEmail={() => {
                setShareCopyFallback(null);
                flashShareNotice(t.modalShareEmailCopied, 7000);
                window.setTimeout(() => setShareMenuOpen(false), 0);
              }}
              onClose={() => setShareMenuOpen(false)}
            />
          ) : null}

          {err && step !== 'details' && step !== 'received' && (
            <p className="mt-4 text-[length:var(--fs-texto)] font-medium text-red-600 " role="alert">{err}</p>
          )}
        </div>
        {previewLine ? <p className={`${amStyles.amModalFootnote} px-4 pb-3`}>{previewLine}</p> : null}
      </div>
    </div>
  );
}
